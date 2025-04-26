// index.js

const express = require("express");
const { SerialPort } = require("serialport");
const { ReadlineParser } = require("@serialport/parser-readline");

const app = express();
const port = process.env.PORT || 4000;

// Middleware
app.use(express.json());
9600
// RFID Reader Setup
const rfidPort = new SerialPort({
  path: "/dev/ttyUSB0",
  baudRate: 115200,
});

const parser = rfidPort.pipe(new ReadlineParser({ delimiter: "\r\n" }));

parser.on("data", (data) => {
  console.log("RFID Tag Scanned:", data);
  // Additional logic can be added here, such as emitting events or processing the data
});

rfidPort.on("open", () => {
  console.log("RFID Reader connected on /dev/ttyUSB0");
});

rfidPort.on("error", (err) => {
  console.error("RFID Reader error:", err.message);
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
