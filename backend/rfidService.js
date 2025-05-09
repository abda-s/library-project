// backend/rfidService.js
const RFIDReader = require('./RFIDReader'); // Assuming RFIDReader.js is in the same directory
const { books } = require('./models'); // from models/index.js

let io = null;
let appendReadingToCsv = null;
let getBookById = null;
let socketHandler = null;

const reader = new RFIDReader({ debug: true });
const tagTracking = new Map();

const init = (ioInstance, csvLoggerFunc, socketHandlerInstance) => {
  io = ioInstance;
  appendReadingToCsv = csvLoggerFunc;
  socketHandler = socketHandlerInstance;
  setupReaderEvents();
};


const setupReaderEvents = () => {
  reader.on('tag', handleTagData);
  reader.on('connected', handleConnected);
  reader.on('disconnected', handleDisconnected);
  reader.on('error', handleError);
};

const handleTagData = async (data) => {
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

    // Check if timestampDate is a valid Date object (e.g., not "Invalid Date")
    if (isNaN(timestampDate.getTime())) {
      console.warn('Could not create valid Date from timestamp:', data);
      return; // Stop processing this line
    }

    // If all checks pass, the data is considered valid for further processing:

    // ===> SAVE TO CSV
    // Use the timestamp in milliseconds for UTC ISO string
    const dateUtc = new Date(numericTimestampMs).toISOString();
    appendReadingToCsv(port, tagId, dateUtc, rssiStr);
    // <=== SAVE TO CSV

    io.emit('raw_rfid_data', {
      port,
      tagId,
      timestamp: dateUtc,   // e.g. '2025-05-08T12:34:56.789Z'
      rssi: numericRssi
    });
    console.log(`Received data: port=${port}, tagId=${tagId}, timestamp=${dateUtc}, rssi=${numericRssi}`);
    

    if (port !== '1') return; // connect the antinna to port 1

    // Handle RSSI < -50 (consider as tag moved away)
    if (numericRssi < -50) {
      const entry = tagTracking.get(tagId);
      // If we were tracking this tag and it's no longer being read strongly, check if scanning can stop
      if (entry && entry.readings.length === 0) {
        // This is a simplified check; a more robust solution might track active scanning
        if (Object.keys(getBookById({})).every(bookTagId => !tagTracking.has(bookTagId) || (tagTracking.has(bookTagId) && tagTracking.get(bookTagId).readings.every(r => r.rssi < -50)))) {
          socketHandler.emitScanStatus('idle');
        }
      }
      return; // Stop processing for weak signals
    }

    // Handle RSSI > -25 (trigger scanning status)
    if (numericRssi > -30) {
      socketHandler.emitScanStatus('scanning', tagId);
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

    // Keep only last 30 readings to manage memory
    if (entry.readings.length > 30) {
      entry.readings.shift();
    }

    // Update last seen (using the timestamp from the reading, not current time)
    entry.lastSeen = timestampDate.getTime();
    tagTracking.set(tagId, entry);

    // Check for valid reading window and process
    if (!entry.processing) {
      entry.processing = true;

      // Analyze readings after short debounce
      setTimeout(async () => {
        // Retrieve the latest state of the entry
        const currentEntry = tagTracking.get(tagId);
        if (!currentEntry) {
          // Tag might have been deleted if conditions weren't met earlier
          return;
        }

        const validReadings = currentEntry.readings.filter(r => r.rssi > -25);

        if (validReadings.length >= 2) {
          // Sort valid readings by timestamp
          validReadings.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

          // Check for >= 1.5-second duration based on valid readings
          const firstValidTimestamp = validReadings[0].timestamp.getTime();
          const lastValidTimestamp = validReadings[validReadings.length - 1].timestamp.getTime();
          const duration = lastValidTimestamp - firstValidTimestamp;


          if (duration >= 1500) { // Duration is 1500ms (1.5 seconds)
            const book = await books.findOne({ where: { tagId: tagId } });


            const bookData = book ? book.toJSON() : null;

            // Determine the status and data payload exactly like the original
            const status = bookData ? 'found' : 'not_found';
            const dataPayload = bookData || {
              tagId,
              timestamp: lastValidTimestamp, // Use the last valid timestamp
              duration,
            };
            const errorPayload = bookData ? null : 'Unrecognized RFID tag';

            // Emit using the updated socketHandler function
            socketHandler.emitTagScanned(status, dataPayload, errorPayload);

            tagTracking.delete(tagId); // Remove tracking for this tag after successful scan
          }
        }

        // Ensure processing flag is reset
        // Only reset if the tag is still being tracked (not deleted by a successful scan)
        if (tagTracking.has(tagId)) {
          const updatedEntry = tagTracking.get(tagId);
          updatedEntry.processing = false;
          tagTracking.set(tagId, updatedEntry);
        }

        // After processing, check if scanning can go back to idle
        // This check needs refinement based on how you determine 'idle' state
        // A simple approach is to check if any tags with RSSI > -25 are still being tracked.
        const activeTags = Array.from(tagTracking.values()).filter(entry =>
          entry.readings.some(reading => reading.rssi > -25)
        );

        if (activeTags.length === 0) {
          socketHandler.emitScanStatus('idle');
        }


      }, 100); // Short debounce
    }

  } catch (error) {
    console.error('Error processing tag data:', data, 'Error:', error);
    socketHandler.emitScanError('Internal server error processing tag data');
  }
};

const handleConnected = (path) => {
  console.log(`RFID Reader connected on ${path}`);
  socketHandler.emitScanStatus('idle'); // Assume idle on connect
};

const handleDisconnected = () => {
  console.log('RFID Reader disconnected.');
  socketHandler.emitScanError('Reader disconnected');
};

const handleError = (error) => {
  console.error('RFID Reader error:', error);
  socketHandler.emitScanError(error.message);
};

const startReader = () => {
  reader.start();
};

module.exports = {
  init,
  startReader
};