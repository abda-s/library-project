const express = require("express");
const { SerialPort } = require("serialport");
const { ReadlineParser } = require("@serialport/parser-readline");

const app = express();
const SERVER_PORT = process.env.PORT || 4000;

// how often to retry after failure
const MAX_RETRY_INTERVAL = 10000; // ms

let rfidPort = null;
let connectionAttempts = 0;

// ——————————————————————————————
// Startup
// ——————————————————————————————
app.use(express.json());

app.listen(SERVER_PORT, () => {
  console.log(`Server running on port ${SERVER_PORT}`);
  startRFIDConnectionLoop();
});

// ——————————————————————————————
// Core connection loop
// ——————————————————————————————
async function attemptRFIDConnection() {
  try {
    const port = await initializeRFIDReader();
    rfidPort = port;
    setupRFIDHandlers(port);
  } catch (err) {
    connectionAttempts++;
    const delay = Math.min(1000 * connectionAttempts, MAX_RETRY_INTERVAL);
    console.log(`${err.message}. Retrying in ${delay / 1000}s…`);
    setTimeout(attemptRFIDConnection, delay);
  }
}

function startRFIDConnectionLoop() {
  if (!rfidPort || !rfidPort.isOpen) {
    attemptRFIDConnection();
  }
}

// ——————————————————————————————
// SerialPort initialization
// ——————————————————————————————
async function initializeRFIDReader() {
  const ports = await SerialPort.list();
  const portInfo = ports.find(p =>
    p.manufacturer?.includes("FTDI") ||
    p.product?.includes("RS232") ||
    p.vendorId === "0403"
  );
  if (!portInfo) {
    throw new Error("No compatible RFID reader found");
  }
  console.log(`Found device at ${portInfo.path}. Attempting connection…`);

  return new SerialPort({ path: portInfo.path, baudRate: 115200 });
}

// ——————————————————————————————
// Handlers + monitor
// ——————————————————————————————
function setupRFIDHandlers(port) {
  const parser = port.pipe(new ReadlineParser({ delimiter: "\r\n" }));

  parser.on("data", data => {
    console.log("RFID Tag Scanned:", data);
  });

  port.once("open", () => {
    console.log("Successfully connected to RFID reader");
    connectionAttempts = 0;
    monitorPortRemoval(port);
  });

  // on any error, treat as disconnection
  port.once("error", err => {
    console.error("RFID Error:", err.message);
    cleanUpAndReconnect();
  });

  port.once("close", () => {
    cleanUpAndReconnect();
  });
}

// ——————————————————————————————
// Poll the OS for removal
// ——————————————————————————————
function monitorPortRemoval(port) {
  const path = port.path;
  const monitor = setInterval(async () => {
    try {
      const list = await SerialPort.list();
      const exists = list.some(p => p.path === path);
      if (!exists) {
        console.warn(`Device ${path} no longer in port list → scheduling reconnect`);
        clearInterval(monitor);
        // closing will emit ‘close’ → cleanUpAndReconnect()
        port.close();
      }
    } catch (e) {
      console.error("Error listing ports:", e.message);
      clearInterval(monitor);
      cleanUpAndReconnect();
    }
  }, 2000);

  port.once("close", () => clearInterval(monitor));
}

// ——————————————————————————————
// Teardown & reconnect
// ——————————————————————————————
function cleanUpAndReconnect() {
  if (rfidPort) {
    rfidPort.removeAllListeners();
    rfidPort = null;
  }
  console.log("Connection lost. Scheduling reconnect…");
  startRFIDConnectionLoop();
}
