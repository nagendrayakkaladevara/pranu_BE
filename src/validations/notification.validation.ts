import { z } from 'zod';
import { NotificationType } from '../models/notification.model';

const getNotifications = {
  query: z.object({
    read: z.coerce.boolean().optional(),
    type: z
      .enum([
        NotificationType.CIRCULAR,
        NotificationType.QUIZ_PUBLISHED,
        NotificationType.ATTEMPT_GRADED,
        NotificationType.CLASS_ENROLLED,
      ])
      .optional(),
    sortBy: z.string().optional(),
    limit: z.coerce.number().optional(),
    page: z.coerce.number().optional(),
  }),
};

const markAsRead = {
  params: z.object({
    notificationId: z.string(),
  }),
};

export default {
  getNotifications,
  markAsRead,
};
