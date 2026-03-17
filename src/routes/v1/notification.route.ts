import express from 'express';
import auth from '../../middlewares/auth';
import validate from '../../middlewares/validate';
import notificationValidation from '../../validations/notification.validation';
import notificationController from '../../controllers/notification.controller';

const router = express.Router();

// Notifications: All authenticated users can read their own notifications

// Route: GET /v1/notifications
// Description: List notifications for the authenticated user (paginated)
router.get(
  '/',
  auth('ADMIN', 'LECTURER', 'STUDENT'),
  validate(notificationValidation.getNotifications),
  notificationController.getNotifications,
);

// Route: GET /v1/notifications/unread-count
// Description: Get unread notification count
router.get(
  '/unread-count',
  auth('ADMIN', 'LECTURER', 'STUDENT'),
  notificationController.getUnreadCount,
);

// Route: PATCH /v1/notifications/read-all
// Description: Mark all notifications as read for the user
router.patch(
  '/read-all',
  auth('ADMIN', 'LECTURER', 'STUDENT'),
  notificationController.markAllAsRead,
);

// Route: PATCH /v1/notifications/:notificationId/read
// Description: Mark a single notification as read
router.patch(
  '/:notificationId/read',
  auth('ADMIN', 'LECTURER', 'STUDENT'),
  validate(notificationValidation.markAsRead),
  notificationController.markAsRead,
);

export default router;
