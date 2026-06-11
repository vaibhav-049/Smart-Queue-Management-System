const http = require('http');
require('dotenv').config();

const app = require('./app');
const connectDB = require('./config/db');
const { initSocket } = require('./config/socket');

// Set up server port
const PORT = process.env.PORT || 5000;

// Initialize Server
const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

// Connect to Database and start server listener
const startServer = async () => {
  try {
    console.log('Connecting to database...');
    await connectDB();
    
    server.listen(PORT, () => {
      console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
      console.log(`Socket.io Server initialized and listening.`);
    });
  } catch (error) {
    console.error(`Error starting server: ${error.message}`);
    process.exit(1);
  }
};

startServer();
