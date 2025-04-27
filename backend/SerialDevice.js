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
      this.retryCount = 0;
this._queue = [];
  
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

// SerialDevice.js - Modified _connect method
async _connect() {
  this._log(`[SerialDevice] Trying to connect...`);
  
  // Check for existing port connection
  if (this.port?.isOpen) {
    this._log(`[SerialDevice] Port already open`);
    return;
  }

  try {
    const info = await this._findPort();
    if (!info) {
      throw new Error('No valid port found');
    }

    // Check if port is already opened
    const ports = await SerialPort.list();
    if (!ports.some(p => p.path === info.path)) {
      throw new Error('Port disappeared before connection');
    }

    // Create new port instance with error handling
    this.port = new SerialPort({
      path: info.path,
      baudRate: this.baudRate,
      autoOpen: false // We'll handle opening manually
    });

    // Add error handler immediately
    this.port.on('error', (err) => {
      this._error(`[SerialDevice] Port error:`, err.message);
      this._cleanup();
      this._reconnectWithBackoff();
    });

    // Open port with retry logic
    await new Promise((resolve, reject) => {
      this.port.open((err) => {
        if (err) {
          this._error(`[SerialDevice] Open error:`, err.message);
          this.port.close();
          reject(err);
        } else {
          resolve();
        }
      });
    });

    // Only setup parser and listeners after successful open
    const parser = this.port.pipe(new ReadlineParser({ delimiter: '\r\n' }));
    parser.on('data', (data) => this.handleData(data));

    this._log(`[SerialDevice] Port opened at ${info.path}`);
    this.attempts = 0;
    this.emit('connected', info.path);
    this._startMonitor();

  } catch (err) {
    this._error(`[SerialDevice] Connection failed:`, err.message);
    this._cleanup();
    this._reconnectWithBackoff();
  }
}
  
  async _startMonitor() {
    this._log(`[SerialDevice] Starting port monitor...`);
    const path = this.port?.path; // Add optional chaining
    
    // Don't start monitoring if no valid port
    if (!path) {
      this._log(`[SerialDevice] No valid port to monitor`);
      return;
    }
  
    this._monitor = setInterval(async () => {
      // Add null check for this.port
      if (!this.port || !this.port.isOpen) {
        this._log(`[SerialDevice] Port already closed, stopping monitor`);
        clearInterval(this._monitor);
        return;
      }
  
      try {
        const ports = await SerialPort.list();
        if (!ports.some((p) => p.path === path)) {
          this._log(`[SerialDevice] Device at ${path} disconnected.`);
          clearInterval(this._monitor);
          if (this.port?.isOpen) { // Check if port exists and is open
            this.port.close();
          } else {
            this._cleanup();
            this._reconnectWithBackoff();
          }
        }
      } catch (error) {
        this._error(`[SerialDevice] Monitoring error:`, error.message);
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
      // Remove listeners first
      this.port.removeAllListeners();
      
      // Close port safely
      if (this.port.isOpen) {
        try {
          this.port.close();
        } catch (err) {
          this._error(`[SerialDevice] Close error:`, err.message);
        }
      }
      
      this.port = null;
    }
    
    // Force garbage collection
    if (global.gc) {
      global.gc();
    }
  }

  _reconnectWithBackoff() {
    this.attempts++;
    const delay = Math.min(this.attempts * 1000, this.maxRetry);
    this._log(`[SerialDevice] Reconnecting in ${delay / 1000} seconds (attempt ${this.attempts})...`);
    setTimeout(() => this.start(), delay);
  }

  _scheduleRetry(data) {
    if (this.retryCount < 3) { // Limit retry attempts
      this.retryCount++;
      this._log(`[SerialDevice] Retrying send (attempt ${this.retryCount}/3)...`);
      setTimeout(() => this.send(data), 1000 * this.retryCount);
    } else {
      this._error(`[SerialDevice] Failed to send data after 3 attempts`);
      this.retryCount = 0;
    }
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
          this.emit('send_error', err);  // Use dedicated event instead of generic error
          this._scheduleRetry(data);     // Optional: Add retry logic for failed sends
        }
      });
    } else {
      this._log(`[SerialDevice] Port not open - queuing data and attempting reconnect...`);
      this.emit('send_retry', data);     // Notify about queued data
      this.start();                      // Initiate reconnection attempt
      
      // Optional: Add queuing mechanism
      if (!this._queue) this._queue = [];
      this._queue.push(data);
    }
  }

}

module.exports = SerialDevice;
