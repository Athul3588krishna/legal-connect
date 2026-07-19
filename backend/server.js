const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorMiddleware');
const apiLimiter = require('./middleware/rateLimiter');

// Load environment variables
dotenv.config();

// Connect to Database
connectDB();

const app = express();

// Middlewares
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploaded files (Case documents / profile images)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Apply rate limiting to API routes
app.use('/api', apiLimiter);

// Register Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/complaints', require('./routes/complaintRoutes'));
app.use('/api/advocate', require('./routes/advocateRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/feedback', require('./routes/feedbackRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/support', require('./routes/supportRoutes'));
app.use('/api/advocates', require('./routes/advocateReviewRoutes'));

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  // Set static folder
  app.use(express.static(path.join(__dirname, '../frontend/dist')));

  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../frontend', 'dist', 'index.html'));
  });
} else {
  // Root Endpoint for verification in development
  app.get('/', (req, res) => {
    res.status(200).json({ 
      success: true, 
      message: 'LegalAssist API is running smoothly.' 
    });
  });
}

// Global Error Handler Middleware
app.use(errorHandler);

const http = require('http');
const socketio = require('socket.io');

const PORT = process.env.PORT || 5000;

// Wrap express app in HTTP server
const server = http.createServer(app);

// Initialize Socket.io
const io = socketio(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});

const { initNotificationSocket } = require('./services/notificationService');
initNotificationSocket(io);

// Map of userId -> socketId
const userSockets = new Map();

io.on('connection', (socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`);

  // Register user room
  socket.on('join', (userId) => {
    if (userId) {
      socket.join(userId);
      userSockets.set(userId, socket.id);
      console.log(`[Socket] User ${userId} joined room.`);
    }
  });

  socket.on('disconnect', () => {
    console.log(`[Socket] Client disconnected: ${socket.id}`);
    for (const [userId, socketId] of userSockets.entries()) {
      if (socketId === socket.id) {
        userSockets.delete(userId);
        break;
      }
    }
  });
});

// Expose socket references
app.set('io', io);
app.set('userSockets', userSockets);

server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error(`Unhandled Rejection Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});
