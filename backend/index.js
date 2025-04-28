// backend/server.js
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const RFIDReader = require('./RFIDReader');
const fs = require('fs');
const path = require('path');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

const logFilePath = path.join(__dirname, 'rfid_readings.csv');

if (!fs.existsSync(logFilePath)) {
  fs.writeFileSync(logFilePath, 'Port,TagID,TimestampUTC,RSSI\n', 'utf8');
}

// Mock database
const mockBooks = {
  'E28011606000020AED5EC1C2': {
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    tagId: "E28011606000020AED5EC1C2",
    addedAt: new Date('2023-03-15').toISOString()
  }
};

// RFID Reader setup
const reader = new RFIDReader({ debug: true });
const tagTracking = new Map();

reader.on('tag', (data) => {
  // data is each line of info from the reader
  try {
    const [port, tagId, timestamp, rssi] = data.split(',');
    const numericRssi = parseInt(rssi, 10); // made it a number instead of a string
    const numericTimestamp = Math.floor(parseInt(timestamp, 10) / 1000); // made it a number instead of a string
    const timestampDate = new Date(numericTimestamp); // made it a date instead of a number

    //console.log("Timestamp:", numericTimestamp, "Date:", timestampDate); // logging the timestamp and date

        // ===> SAVE TO CSV
        const dateUtc = new Date(numericTimestamp).toISOString();
        const dateJordan = new Date(numericTimestamp).toLocaleString('en-US', { timeZone: 'Asia/Amman' });
        const csvLine = `${port},${tagId},${dateUtc},${rssi}\n`;
        fs.appendFileSync(logFilePath, csvLine, 'utf8');
        // <=== SAVE TO CSV

    // Handle RSSI < -50
    if (numericRssi < -50) {
      const entry = tagTracking.get(tagId);
      if (entry && entry.readings.length === 0) {
        io.emit('scan_status', { status: 'idle' });
      }
      return;
    }

    // Handle RSSI > -25 (trigger scanning)
    if (numericRssi > -25) {
      io.emit('scan_status', { status: 'scanning', tagId });
    }

    // Get or create tag entry
    let entry = tagTracking.get(tagId) || {
      readings: [],
      lastSeen: 0,
      processing: false
    };

    // Store reading
    // entry.readings.push({
    //   timestamp: numericTimestamp,
    //   rssi: numericRssi
    // });

    entry.readings.push({
      port: port,
      timestamp: timestampDate,
      rssi: numericRssi
    });

    // Keep only last 30 readings
    if (entry.readings.length > 100) {
      entry.readings.shift();
    }

    // Update last seen, last seen is used to know when was the last reading of this tag, but only when the reading is more than -25
    entry.lastSeen = Date.now();
    tagTracking.set(tagId, entry);

    // Check for valid reading window
    if (!entry.processing) {
      entry.processing = true;
      
      // Analyze readings after short debounce
      setTimeout(() => {
        const validReadings = entry.readings.filter(r => r.rssi > -25);
        
        if (validReadings.length >= 2) {
          // Sort readings by timestamp
          validReadings.sort((a, b) => a.timestamp - b.timestamp);
          
          // Check for 1.5-2 second duration
          const first = validReadings[0].timestamp.getTime();
          const last = entry.readings[entry.readings.length - 1].timestamp.getTime();
          const duration = last - first;

          if (duration >= 1500) {
            const book = mockBooks[tagId];
            io.emit('tag_scanned', {
              status: book ? 'found' : 'not_found',
              data: book || {
                tagId,
                timestamp: last,
                duration,
              },
              error: book ? null : 'Unrecognized RFID tag'
            });
            tagTracking.delete(tagId);
          }
        }
        entry.processing = false;
      }, 100);
    }

  } catch (error) {
    console.error('Error processing tag:', error);
    io.emit('scan_error', { error: 'Error processing RFID tag' });
  }
});

reader.on('connected', (path) => {
  console.log(`RFID Reader connected on ${path}`);
  io.emit('scan_status', { status: 'idle' });
});

reader.on('disconnected', () => {
  io.emit('scan_error', { error: 'Reader disconnected' });
});

reader.on('error', (error) => {
  io.emit('scan_error', { error: error.message });
});

server.listen(4000, () => {
  console.log('Server running on port 4000');
  reader.start();
});