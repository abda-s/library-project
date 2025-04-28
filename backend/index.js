// backend/server.js
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const RFIDReader = require('./RFIDReader');
const fs = require('fs');
const path = require('path');
const db = require("./models");

const PORT = process.env.PORT || 4000;
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
  try {
    // 1. Basic check: Ensure data is a non-empty string
    if (typeof data !== 'string' || data.trim() === '') {
      console.warn('Received empty or invalid data type:', data);
      return; // Stop processing this line
    }

    const parts = data.split(',');

    // 2. Check number of parts: Ensure there are exactly 4 parts
    if (parts.length !== 4) {
      console.warn('Received data with incorrect number of parts:', data);
      return; // Stop processing this line
    }

    const [port, tagId, timestampStr, rssiStr] = parts;

    // 3. Check format and parse: Ensure tagId is not empty, and timestamp/rssi are valid numbers
    if (tagId.trim() === '') {
      console.warn('Received data with empty tagId:', data);
      return; // Stop processing this line
    }

    const numericRssi = parseInt(rssiStr, 10);
    // Check if rssi is a valid integer
    if (isNaN(numericRssi)) {
      console.warn('Received data with invalid RSSI:', data);
      return; // Stop processing this line
    }

    const numericTimestampMs = parseInt(timestampStr, 10);
    // Check if timestamp is a valid integer
    if (isNaN(numericTimestampMs)) {
        console.warn('Received data with invalid timestamp:', data);
        return; // Stop processing this line
    }

    // Convert timestamp from milliseconds to seconds (as per your original logic)
    const numericTimestamp = Math.floor(numericTimestampMs / 1000);
    const timestampDate = new Date(numericTimestamp * 1000); // Create Date object from seconds

    // You might also want to add checks for plausible ranges, e.g.,
    // Check if timestampDate is a valid Date object (e.g., not "Invalid Date")
    if (isNaN(timestampDate.getTime())) {
         console.warn('Could not create valid Date from timestamp:', data);
         return; // Stop processing this line
    }

    // You could also add a check if the timestamp is reasonably recent if needed
    // const now = Date.now();
    // const timeDifference = now - numericTimestampMs;
    // if (timeDifference > 600000 || timeDifference < -600000) { // Example: check if within 10 minutes
    //      console.warn('Received data with suspicious timestamp:', data);
    //      io.emit('scan_error', { error: 'Received data with suspicious timestamp' });
    //      return; // Stop processing this line
    // }


    // If all checks pass, the data is considered valid for further processing:

    // ===> SAVE TO CSV
    const dateUtc = new Date(numericTimestamp * 1000).toISOString(); // Use the timestamp in milliseconds
    const dateJordan = new Date(numericTimestamp * 1000).toLocaleString('en-US', { timeZone: 'Asia/Amman' }); // Use the timestamp in milliseconds
    const csvLine = `${port},${tagId},${dateUtc},${rssiStr}\n`; // Use original rssiStr for CSV if preferred, or numericRssi
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
    entry.readings.push({
      port: port,
      timestamp: timestampDate,
      rssi: numericRssi
    });

    // Keep only last 100 readings
    if (entry.readings.length > 30) {
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
        // Retrieve the latest state of the entry
        const currentEntry = tagTracking.get(tagId);
        if (!currentEntry) {
             // Tag might have been deleted during the timeout if conditions weren't met
             return;
        }

        const validReadings = currentEntry.readings.filter(r => r.rssi > -25);

        if (validReadings.length >= 2) {
          // Sort readings by timestamp
          validReadings.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

          // Check for 1.5-second duration (changed from 1.5-2 to just >= 1.5 based on code logic)
          const first = validReadings[0].timestamp.getTime();
          const last = currentEntry.readings[currentEntry.readings.length - 1].timestamp.getTime(); // Use the last overall reading timestamp
          const duration = last - first;

          if (duration >= 1500) {
            const book = mockBooks[tagId];
            io.emit('tag_scanned', {
              status: book ? 'found' : 'not_found',
              data: book || {
                tagId,
                timestamp: last, // Use the last timestamp
                duration,
              },
              error: book ? null : 'Unrecognized RFID tag'
            });
            tagTracking.delete(tagId); // Remove tracking for this tag after successful scan
          }
        }
         // Ensure processing flag is reset, even if scan conditions weren't met
        currentEntry.processing = false;
        tagTracking.set(tagId, currentEntry);

         // If no longer tracking this tag and processing finished, potentially emit idle
         if (!tagTracking.has(tagId) && Object.keys(mockBooks).every(bookTagId => !tagTracking.has(bookTagId))) {
             // This is a simplified check; a more robust solution might track active scanning
             io.emit('scan_status', { status: 'idle' });
         }

      }, 100); // Short debounce
    }

  } catch (error) {
    console.error('Error processing tag data:', data, 'Error:', error);
    io.emit('scan_error', { error: 'Internal server error processing tag data' });
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

db.sequelize.sync().then(() => {
  server.listen(PORT, () => {
    console.log(`server running on http://localhost:${PORT}`);
    reader.start();

  });
});