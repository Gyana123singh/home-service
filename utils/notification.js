const Notification = require("../models/Notification");
const { getIO } = require("../sockets/socket");

/**
 * Creates a notification in the database and sends it in real-time via Socket.io
 * @param {string|mongoose.Types.ObjectId} recipientId - The ID of the user/vendor to receive the notification
 * @param {string} title - The notification title
 * @param {string} body - The notification body
 * @param {"booking"|"payment"|"system"|"message"} type - The notification type
 * @param {object} [data] - Optional metadata associated with the notification
 */
exports.sendNotification = async (recipientId, title, body, type, data = {}) => {
  try {
    // 1. Create the notification record in the database
    const notification = await Notification.create({
      recipient: recipientId,
      title,
      body,
      type,
      data,
    });

    // 2. Emit the notification in real-time via WebSockets
    try {
      const io = getIO();
      // Emit to vendor:${recipientId} and user:${recipientId} rooms
      const vendorRoom = `vendor:${recipientId}`;
      const customerRoom = `user:${recipientId}`;

      io.to(vendorRoom).to(customerRoom).emit("notification:new", notification);
      console.log(`🔌 Sent socket notification to user/vendor ${recipientId}`);
    } catch (socketErr) {
      console.warn("⚠️ Socket notification emit failed:", socketErr.message);
    }

    return notification;
  } catch (err) {
    console.error("❌ Failed to create/send notification:", err);
  }
};
