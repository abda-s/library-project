// RFIDReader.js
const SerialDevice = require('./SerialDevice');
const { SerialPort } = require('serialport');

class RFIDReader extends SerialDevice {
  constructor() {
    super({
      baudRate: 115200,
      pollInterval: 2000,
      maxRetry: 10000,
      debug: true
    });
  }

  async _findPort() {
    this._log(`[RFIDReader] Searching for device...`);
    const ports = await SerialPort.list();
    
    const portInfo = ports.find(p =>
      p.manufacturer?.includes("FTDI") ||
      p.product?.includes("RS232") ||
      p.vendorId === "0403"
    );

    if (portInfo) {
      this._log(`[RFIDReader] Found potential device at ${portInfo.path}`);
      this._log(`[RFIDReader] Device details:`, {
        manufacturer: portInfo.manufacturer,
        product: portInfo.product,
        vendorId: portInfo.vendorId
      });
    } else {
      this._log(`[RFIDReader] No compatible devices found`);
    }

    return portInfo;
  }

  handleData(data) {
    // Add any RFID-specific data processing here
    const cleanedData = data.trim();
    this.emit('tag', cleanedData);
  }
}

module.exports = RFIDReader;