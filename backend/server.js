// backend/server.js
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');
const db = require('./models'); // Assuming your Sequelize setup is here

const csvLogger = require('./csvLogger');
const bookService = require('./bookService');
const socketHandler = require('./socketHandler');
const rfidService = require('./rfidService');

const PORT = process.env.PORT || 4000;
const app = express();
const server = createServer(app);
app.use(express.json()); // Add JSON body parsing middleware

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Adjust as needed for your frontend
    methods: ["GET", "POST"]
  }
});

const initializeDatabase = async () => {
    try {
      await db.sequelize.authenticate();
      console.log('Database connection established');
      
      // Sync models with database
      await db.sequelize.sync({ alter: true });
      console.log('Database synchronized');
    } catch (error) {
      console.error('Database initialization failed:', error);
      process.exit(1);
    }
  };

// Initialize socket handler with the io instance
socketHandler.init(io);

// Initialize CSV Logger (ensures file exists)
csvLogger.init();

// Initialize and start RFID service
// rfidService.init(io, csvLogger.appendReading, socketHandler);
rfidService.init(io, csvLogger.appendReading, socketHandler);



const booksRoutes = require('./routes/booksRoutes');
app.use('/books', booksRoutes);

// Basic root route (optional)
app.get('/', (req, res) => {
  res.send('RFID Backend is running.');
});


initializeDatabase().then(() => {
  server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    rfidService.startReader();
  });
}).catch(err => {
  console.error('Database sync failed:', err);
  process.exit(1); // Exit if DB sync fails
});