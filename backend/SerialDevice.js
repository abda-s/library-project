// SerialDevice.js
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const EventEmitter = require('events');

class SerialDevice extends EventEmitter {
    constructor({
      baudRate = 9600,
      pollInterval = 2000,
      maxRetry = 10000,
      debug = false,
    } = {}) {
      super();
      this.baudRate = baudRate;
      this.pollInterval = pollInterval;
      this.maxRetry = maxRetry;
      this.debug = debug;
  
      this.port = null;
      this.attempts = 0;
      this._monitor = null;
  
      this._log(`[${this.constructor.name}] Initialized`);
    }
  _log(...args) {
    if (this.debug) console.log(...args);
  }

  _error(...args) {
    if (this.debug) console.error(...args);
  }

  async _findPort() {
    throw new Error('_findPort() must be implemented by child class');
  }

  async _connect() {
    this._log(`[SerialDevice] Trying to connect...`);
    const info = await this._findPort();
    if (!info) {
      throw null;  
    }

    this.port = new SerialPort({ path: info.path, baudRate: this.baudRate });
    const parser = this.port.pipe(new ReadlineParser({ delimiter: '\r\n' }));

    parser.on('data', (data) => this.handleData(data));

    this.port.once('open', () => {
      this._log(`[SerialDevice] Port opened at ${info.path}`);
      this.attempts = 0;
      this.emit('connected', info.path);
      this._startMonitor();
    });

    const teardown = (err) => {
      if (err) this._error(`[SerialDevice] Port error:`, err.message);
      else this._log(`[SerialDevice] Port closed.`);
      this._cleanup();
      this.emit('disconnected');
      this._reconnectWithBackoff();
    };

    this.port.once('error', teardown);
    this.port.once('close', () => teardown());
  }
  
  async _startMonitor() {
    this._log(`[SerialDevice] Starting port monitor...`);
    const path = this.port.path;
    this._monitor = setInterval(async () => {
      const ports = await SerialPort.list();
      if (!ports.some((p) => p.path === path)) {
        this._log(`[SerialDevice] Device at ${path} disconnected.`);
        clearInterval(this._monitor);
        this.port.close(); // triggers teardown
      }
    }, this.pollInterval);
  }

  _cleanup() {
    this._log(`[SerialDevice] Cleaning up resources...`);
    if (this._monitor) {
      clearInterval(this._monitor);
      this._monitor = null;
    }
    if (this.port) {
      this.port.removeAllListeners();
      this.port = null;
    }
  }

  _reconnectWithBackoff() {
    this.attempts++;
    const delay = Math.min(this.attempts * 1000, this.maxRetry);
    this._log(`[SerialDevice] Reconnecting in ${delay / 1000} seconds (attempt ${this.attempts})...`);
    setTimeout(() => this.start(), delay);
  }

  async start() {
    if (this.port && this.port.isOpen) {
      this._log(`[SerialDevice] Port already open, skipping start.`);
      return;
    }
    try {
      await this._connect();
    } catch (err) {
      if (err) this._error(`[SerialDevice] Connection error:`, err.message, this.port);
      this._reconnectWithBackoff();
    }
  }
  
  stop() {
    this._log(`[SerialDevice] Stopping device...`);
    this._cleanup();
  }

  handleData(data) {
    this._log(`[SerialDevice] Received data:`, data);
    this.emit('data', data);
  }

  send(data) {
    if (this.port && this.port.isOpen) {
      this._log(`[SerialDevice] Sending data:`, data);
      this.port.write(data + '\n', (err) => {
        if (err) {
          this._error(`[SerialDevice] Error sending data:`, err.message);
          this.emit('error', err);
        }
      });
    } else {
      this._error(`[SerialDevice] Cannot send: port not open.`);
      this.emit('error', new Error('Cannot send: port not open.'));
    }
  }
}

module.exports = SerialDevice;
