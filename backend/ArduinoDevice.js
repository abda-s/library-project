const SerialDevice = require('./SerialDevice');
const { SerialPort } = require('serialport');

class ArduinoDevice extends SerialDevice {
  constructor() {
    super({ baudRate: 9600 });
  }
  
  async _findPort() {
    this._log(`[Arduino] Searching for Leonardo...`);
    const ports = await SerialPort.list();
    
    // Specific match for Leonardo's USB identifiers
    const portInfo = ports.find(p => {
      // Match by exact vendor/product IDs first
      if (p.vendorId === '2341' && p.productId === '8036') {
        return true;
      }
      
      // Fallback to manufacturer/product name match
      return (
        p.manufacturer?.includes('Arduino') ||
        p.product?.includes('Leonardo') ||
        p.description?.includes('Arduino')
      );
    });

  
    if (portInfo) {
      this._log(`[Arduino] Found Leonardo at ${portInfo.path}`);
      this._log(`[Arduino] Device details:`, {
        vendorId: portInfo.vendorId,
        productId: portInfo.productId,
        manufacturer: portInfo.manufacturer,
        product: portInfo.product
      });
    } else {
      this._log(`[Arduino] No Leonardo detected`);
    }
  
    return portInfo;
  }

  handleData(data) {
    this.emit('arduino-data', data); // Special event for Arduino messages
  }
}

module.exports = ArduinoDevice;
