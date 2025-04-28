// backend/csvLogger.js
const fs = require('fs');
const path = require('path');

const logFilePath = path.join(__dirname, 'rfid_readings.csv');

// Ensure the CSV file exists with headers
const init = () => {
  if (!fs.existsSync(logFilePath)) {
    fs.writeFileSync(logFilePath, 'Port,TagID,TimestampUTC,RSSI\n', 'utf8');
    console.log(`Created CSV log file: ${logFilePath}`);
  }
};

// Append a reading to the CSV file
const appendReading = (port, tagId, timestampUtc, rssi) => {
  try {
    const csvLine = `${port},${tagId},${timestampUtc},${rssi}\n`;
    fs.appendFileSync(logFilePath, csvLine, 'utf8');
  } catch (error) {
    console.error('Error writing to CSV log file:', error);
  }
};

module.exports = {
  init,
  appendReading
};