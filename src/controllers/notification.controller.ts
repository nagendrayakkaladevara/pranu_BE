import httpStatus from 'http-status';
import { Request, Response } from 'express';
import catchAsync from '../utils/catchAsync';
import notificationService from '../services/notification.service';
import { NotificationType } from '../models/notification.model';

/**
 * Get notifications for the authenticated user
 */
const getNotifications = catchAsync(async (req: Request, res: Response) => {
  const filter: { read?: boolean; type?: NotificationType } = {};
  const readParam = req.query.read;
  if (readParam !== undefined) {
    filter.read = String(readParam) === 'true';
  }
  if (req.query.type) filter.type = req.query.type as NotificationType;

  const options = {
    limit: Number(req.query.limit) || 10,
    page: Number(req.query.page) || 1,
    sortBy: req.query.sortBy as string | undefined,
  };

  const result = await notificationService.queryNotifications(req.user!.id, filter, options);
  res.send(result);
});

/**
 * Get unread notification count
 */
const getUnreadCount = catchAsync(async (req: Request, res: Response) => {
  const count = await notificationService.getUnreadCount(req.user!.id);
  res.send({ count });
});

/**
 * Mark a single notification as read
 */
const markAsRead = catchAsync(async (req: Request, res: Response) => {
  const notification = await notificationService.markAsRead(
    req.params.notificationId,
    req.user!.id,
  );
  if (!notification) {
    res.status(httpStatus.NOT_FOUND).send({ message: 'Notification not found' });
    return;
  }
  res.send(notification);
});

/**
 * Mark all notifications as read for the user
 */
const markAllAsRead = catchAsync(async (req: Request, res: Response) => {
  await notificationService.markAllAsRead(req.user!.id);
  res.status(httpStatus.NO_CONTENT).send();
});

export default {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
};
