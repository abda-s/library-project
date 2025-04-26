const express = require('express');
const RFIDReader = require('./RFIDReader');
const ArduinoDevice = require('./ArduinoDevice');

const app = express();
const port = process.env.PORT || 4000;

app.use(express.json());

const rfidReader = new RFIDReader();
const arduino = new ArduinoDevice();

rfidReader.on('connected', (path) => {
  console.log(`RFID connected on ${path}`);
});

rfidReader.on('tag', (tag) => {
  console.log(`RFID Tag: ${tag}`);
});

arduino.on('connected', (path) => {
  console.log(`Arduino connected on ${path}`);
});

arduino.on('arduino-data', (data) => {
  // console.log(`Arduino says: ${data}`);
});

app.post('/send-to-arduino', (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).send('No message provided');

  arduino.send(message);
  res.send('Message sent');
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  rfidReader.start();
  arduino.start();

  setInterval(() => {
    rfidReader.start();
    arduino.send("RAINBOW");
  }, 1000);
});
