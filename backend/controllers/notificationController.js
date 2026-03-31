const Notification = require('../models/Notification');

const createNotification = async ({ userId, message, link = '' }) => {
  if (!userId || !message) {
    return null;
  }

  return Notification.create({
    userId,
    message,
    link
  });
};

const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id }).sort({ createdAt: -1 });
    return res.json(notifications);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch notifications' });
  }
};

const markRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    return res.json(notification);
  } catch (error) {
    return res.status(400).json({ message: 'Failed to mark notification as read' });
  }
};

const markAllRead = async (req, res) => {
  try {
    const result = await Notification.updateMany({ userId: req.user._id, read: false }, { read: true });
    return res.json({ message: 'Notifications marked as read', updatedCount: result.modifiedCount || 0 });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to mark all notifications as read' });
  }
};

module.exports = {
  getNotifications,
  markRead,
  markAllRead,
  createNotification
};
