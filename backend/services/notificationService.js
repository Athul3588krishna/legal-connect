const Notification = require('../models/Notification');

let io = null;

/**
 * Initialize the notification service with the Socket.io server instance
 */
const initNotificationSocket = (ioInstance) => {
  io = ioInstance;
  console.log('[Socket] Notification service initialized with Socket.io instance.');
};

/**
 * Create a notification in MongoDB and broadcast it in real-time
 */
const createNotification = async (userId, message, type) => {
  try {
    const notification = await Notification.create({
      user: userId,
      message,
      type
    });

    if (io) {
      // Emit to user's private socket room (room name is their userId)
      io.to(userId.toString()).emit('notification', notification);
      console.log(`[Socket] Notification emitted to user: ${userId}`);
    } else {
      console.log('[Socket] Socket.io not initialized, logged notification to database only.');
    }

    return notification;
  } catch (error) {
    console.error('[Notification Service] Error creating notification:', error);
    throw error;
  }
};

module.exports = {
  initNotificationSocket,
  createNotification
};
