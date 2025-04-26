// rfidReader.js
const { SerialPort } = require("serialport");
const { ReadlineParser } = require("@serialport/parser-readline");
const EventEmitter = require("events");

class RFIDReader extends EventEmitter {
  constructor({ baudRate = 115200, pollInterval = 2000, maxRetry = 10000 } = {}) {
    super();
    this.baudRate = baudRate;
    this.pollInterval = pollInterval;
    this.maxRetry = maxRetry;

    this.port = null;
    this.attempts = 0;
    this._monitor = null;
  }

  async _findPort() {
    const ports = await SerialPort.list();
    return ports.find(p =>
      p.manufacturer?.includes("FTDI") ||
      p.product?.includes("RS232") ||
      p.vendorId === "0403"
    );
  }

  async _connect() {
    const info = await this._findPort();
    if (!info) throw new Error("No RFID reader found");

    this.port = new SerialPort({ path: info.path, baudRate: this.baudRate });
    const parser = this.port.pipe(new ReadlineParser({ delimiter: "\r\n" }));

    parser.on("data", data => this.emit("tag", data));

    this.port.once("open", () => {
      this.attempts = 0;
      this.emit("connected", info.path);
      this._startMonitor();
    });

    // any error or close triggers the same teardown
    const teardown = err => {
      if (err) this.emit("error", err);
      this._cleanup();
      this.emit("disconnected");
      this._reconnectWithBackoff();
    };
    this.port.once("error", teardown);
    this.port.once("close", () => teardown());
  }

  async _startMonitor() {
    // poll OS port list for removal
    const path = this.port.path;
    this._monitor = setInterval(async () => {
      const ports = await SerialPort.list();
      if (!ports.some(p => p.path === path)) {
        clearInterval(this._monitor);
        this.port.close();  // triggers ‘close’→teardown
      }
    }, this.pollInterval);
  }

  _cleanup() {
    if (this._monitor) clearInterval(this._monitor);
    if (this.port) this.port.removeAllListeners();
    this.port = null;
  }

  _reconnectWithBackoff() {
    this.attempts++;
    const delay = Math.min(this.attempts * 1000, this.maxRetry);
    setTimeout(() => this.start(), delay);
  }

  async start() {
    if (this.port && this.port.isOpen) return;
    try {
      await this._connect();
    } catch (err) {
      this.emit("error", err);
      this._reconnectWithBackoff();
    }
  }

  stop() {
    this._cleanup();
  }
}

module.exports = RFIDReader;
