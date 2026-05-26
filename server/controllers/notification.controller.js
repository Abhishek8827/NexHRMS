import Notification from '../models/Notification.model.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

// GET /api/v1/notifications — Get my notifications
export const getMyNotifications = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const userRole = req.user.role;

  const notifications = await Notification.find({
    $or: [
      { recipients: userId },
      { recipientRoles: userRole },
    ],
  })
    .populate('createdBy', 'firstName lastName')
    .sort({ createdAt: -1 })
    .limit(30);

  // Add isRead field per user
  const notificationsWithRead = notifications.map(n => ({
    ...n.toObject(),
    isRead: n.readBy.some(id => id.toString() === userId.toString()),
  }));

  const unreadCount = notificationsWithRead.filter(n => !n.isRead).length;

  return res.status(200).json(
    new ApiResponse(200, { notifications: notificationsWithRead, unreadCount }, 'Notifications fetched')
  );
});

// PUT /api/v1/notifications/:id/read
export const markAsRead = asyncHandler(async (req, res) => {
  await Notification.findByIdAndUpdate(
    req.params.id,
    { $addToSet: { readBy: req.user._id } }
  );
  return res.status(200).json(new ApiResponse(200, {}, 'Marked as read'));
});

// PUT /api/v1/notifications/read-all
export const markAllAsRead = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const userRole = req.user.role;

  await Notification.updateMany(
    {
      $or: [{ recipients: userId }, { recipientRoles: userRole }],
      readBy: { $ne: userId },
    },
    { $addToSet: { readBy: userId } }
  );

  return res.status(200).json(new ApiResponse(200, {}, 'All marked as read'));
});

// Helper — called internally by other controllers
export const createNotification = async ({
  type, title, message, link,
  recipients = [], recipientRoles = [],
  createdBy, data = {},
}) => {
  try {
    await Notification.create({
      type, title, message, link,
      recipients, recipientRoles,
      createdBy, data,
    });
  } catch (err) {
    console.error('Notification creation failed:', err.message);
  }
};