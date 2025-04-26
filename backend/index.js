// index.js
const express = require("express");
const RFIDReader = require("./rfidReader");

const app = express();
const PORT = process.env.PORT || 4000;

// create & start the reader
const reader = new RFIDReader();
reader.on("connected", path =>
  console.log(`RFID reader connected on ${path}`)
);
reader.on("tag", tag =>
  console.log("RFID Tag Scanned:", tag)
);
reader.on("disconnected", () =>
  console.log("RFID reader disconnected; attempting reconnect...")
);
reader.on("error", err =>
  console.error("RFID Reader Error:", err.message)
);
reader.start();

// normal Express setup
app.use(express.json());
app.listen(PORT, () =>
  console.log(`Server running on port ${PORT}`)
);

// (Optionally expose an endpoint to get reader status)
app.get("/rfid/status", (req, res) => {
  res.json({ connected: !!reader.port, attempts: reader.attempts });
});
