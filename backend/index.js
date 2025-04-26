const express = require("express");
const { SerialPort } = require("serialport");
const { ReadlineParser } = require("@serialport/parser-readline");

const app = express();
const port = process.env.PORT || 4000;

// Middleware
app.use(express.json());

async function initializeRFIDReader() {
  try {
    // Get list of available serial ports
    const ports = await SerialPort.list();
    
    // Find port with FTDI chip or RS232 interface (adjust as needed for your device)
    const portInfo = ports.find(port => {
      return (
        port.manufacturer?.includes('FTDI') ||
        port.product?.includes('RS232') ||
        port.vendorId === '0403' // FTDI vendor ID
      );
    });

    if (!portInfo) {
      console.error('Available ports:', ports);
      throw new Error('No RS232/FTDI compatible port found');
    }

    console.log(`Connecting to RFID reader at ${portInfo.path}`);
    return new SerialPort({
      path: portInfo.path,
      baudRate: 115200,
    });
  } catch (error) {
    console.error('RFID initialization error:', error.message);
    process.exit(1);
  }
}

// Initialize RFID reader and start server
async function startServer() {
  try {
    const rfidPort = await initializeRFIDReader();
    const parser = rfidPort.pipe(new ReadlineParser({ delimiter: "\r\n" }));

    // RFID Data handling
    parser.on("data", (data) => {
      console.log("RFID Tag Scanned:", data);
      // Add your processing logic here
    });

    rfidPort.on("open", () => {
      console.log(`RFID Reader successfully connected to ${rfidPort.path}`);
    });

    rfidPort.on("error", (err) => {
      console.error("RFID Reader error:", err.message);
    });

    // Start server after successful RFID initialization
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (error) {
    console.error("Failed to initialize application:", error);
    process.exit(1);
  }
}

startServer();
