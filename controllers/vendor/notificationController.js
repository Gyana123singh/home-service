const Notification = require("../../models/Notification");

// 📄 Get notifications for the logged-in vendor
exports.getMyNotifications = async (req, res) => {
  try {
    const userId = req.user._id;

    const notifications = await Notification.find({ recipient: userId })
      .sort({ createdAt: -1 })
      .limit(50); // Get latest 50 notifications

    res.status(200).json({
      success: true,
      data: notifications,
    });
  } catch (err) {
    console.error("GET MY NOTIFICATIONS ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch notifications",
    });
  }
};

// 📄 Mark a specific notification as read
exports.markAsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    const notificationId = req.params.id;

    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, recipient: userId },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    res.status(200).json({
      success: true,
      data: notification,
    });
  } catch (err) {
    console.error("MARK NOTIFICATION AS READ ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Failed to mark notification as read",
    });
  }
};

// 📄 Mark all notifications for the vendor as read
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user._id;

    await Notification.updateMany(
      { recipient: userId, read: false },
      { read: true }
    );

    res.status(200).json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (err) {
    console.error("MARK ALL NOTIFICATIONS AS READ ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Failed to mark all notifications as read",
    });
  }
};
