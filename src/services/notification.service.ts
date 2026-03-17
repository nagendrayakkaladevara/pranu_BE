import mongoose from 'mongoose';
import Notification, {
  NotificationType,
  INotificationMetadata,
} from '../models/notification.model';
import Class from '../models/class.model';
import User from '../models/user.model';
import { ICircular } from '../models/circular.model';
import { TargetType } from '../models/circular.model';

/**
 * Create a single notification
 */
const createNotification = async (
  userId: string | mongoose.Types.ObjectId,
  type: NotificationType,
  title: string,
  message?: string,
  link?: string,
  metadata?: INotificationMetadata,
) => {
  return Notification.create({
    userId,
    type,
    title,
    message,
    link,
    metadata,
  });
};

/**
 * Create bulk notifications for multiple users
 */
const createBulkNotifications = async (
  userIds: (string | mongoose.Types.ObjectId)[],
  type: NotificationType,
  title: string,
  message?: string,
  link?: string,
  metadata?: INotificationMetadata,
) => {
  if (userIds.length === 0) return [];

  const uniqueIds = [...new Set(userIds.map((id) => id.toString()))];
  const docs = uniqueIds.map((userId) => ({
    userId,
    type,
    title,
    message,
    link,
    metadata,
  }));

  return Notification.insertMany(docs);
};

/**
 * Resolve target user IDs for a circular based on targetType
 */
const getTargetUserIdsForCircular = async (
  circular: ICircular,
): Promise<mongoose.Types.ObjectId[]> => {
  if (circular.targetType === TargetType.ALL) {
    const students = await User.find({ role: 'STUDENT', isDeleted: { $ne: true } }).select('_id');
    return students.map((s) => s._id);
  }

  if (circular.targetType === TargetType.CLASS && circular.targetClassId) {
    const classDoc = await Class.findById(circular.targetClassId).select('students');
    return classDoc?.students ?? [];
  }

  if (circular.targetType === TargetType.DEPARTMENT && circular.targetDepartment) {
    const classes = await Class.find({
      department: circular.targetDepartment,
    }).select('students');
    const studentIds = new Set<mongoose.Types.ObjectId>();
    classes.forEach((c) => c.students.forEach((s) => studentIds.add(s)));
    return Array.from(studentIds);
  }

  return [];
};

/**
 * Get student IDs from quiz's assigned classes
 */
const getTargetUserIdsForQuiz = async (
  classIds: (string | mongoose.Types.ObjectId)[],
): Promise<mongoose.Types.ObjectId[]> => {
  if (classIds.length === 0) return [];

  const classes = await Class.find({ _id: { $in: classIds } }).select('students');
  const studentIds = new Set<mongoose.Types.ObjectId>();
  classes.forEach((c) => c.students.forEach((s) => studentIds.add(s)));
  return Array.from(studentIds);
};

/**
 * Notify users when a circular/notice/announcement is created
 */
const notifyCircularCreated = async (circular: ICircular): Promise<void> => {
  try {
    const userIds = await getTargetUserIdsForCircular(circular);
    if (userIds.length === 0) return;

    const title = `New ${circular.type.toLowerCase()}: ${circular.title}`;
    const message = circular.content?.substring(0, 150) || undefined;
    const link = `/circulars/${circular._id}`;
    const metadata: INotificationMetadata = { circularId: circular._id };

    await createBulkNotifications(
      userIds,
      NotificationType.CIRCULAR,
      title,
      message,
      link,
      metadata,
    );
  } catch (err) {
    // Do not fail the main operation if notifications fail
    console.error('Notification failed for circular created:', err);
  }
};

/**
 * Notify students when a quiz is published to their classes
 */
const notifyQuizPublished = async (
  quizTitle: string,
  quizId: string,
  classIds: (string | mongoose.Types.ObjectId)[],
): Promise<void> => {
  try {
    const userIds = await getTargetUserIdsForQuiz(classIds);
    if (userIds.length === 0) return;

    const title = `New quiz available: ${quizTitle}`;
    const link = `/exam/quizzes`;
    const metadata: INotificationMetadata = { quizId: new mongoose.Types.ObjectId(quizId) };

    await createBulkNotifications(
      userIds,
      NotificationType.QUIZ_PUBLISHED,
      title,
      undefined,
      link,
      metadata,
    );
  } catch (err) {
    console.error('Notification failed for quiz published:', err);
  }
};

/**
 * Notify student when their attempt is graded
 */
const notifyAttemptGraded = async (
  attemptId: string,
  studentId: string,
  quizTitle: string,
  score: number,
  totalMarks: number,
): Promise<void> => {
  try {
    const title = `Quiz graded: ${quizTitle}`;
    const message = `Your score: ${score}/${totalMarks}`;
    const link = `/exam/attempts/${attemptId}`;
    const metadata: INotificationMetadata = {
      attemptId: new mongoose.Types.ObjectId(attemptId),
    };

    await createNotification(
      studentId,
      NotificationType.ATTEMPT_GRADED,
      title,
      message,
      link,
      metadata,
    );
  } catch (err) {
    console.error('Notification failed for attempt graded:', err);
  }
};

/**
 * Notify students when enrolled in a class (optional)
 */
const notifyClassEnrolled = async (
  classId: string,
  className: string,
  studentIds: string[],
): Promise<void> => {
  try {
    if (studentIds.length === 0) return;

    const title = `Enrolled in class: ${className}`;
    const link = `/classes/${classId}`;
    const metadata: INotificationMetadata = { classId: new mongoose.Types.ObjectId(classId) };

    await createBulkNotifications(
      studentIds,
      NotificationType.CLASS_ENROLLED,
      title,
      undefined,
      link,
      metadata,
    );
  } catch (err) {
    console.error('Notification failed for class enrollment:', err);
  }
};

/**
 * Query notifications for a user
 */
const queryNotifications = async (
  userId: string,
  filter: { read?: boolean; type?: NotificationType },
  options: { page?: number; limit?: number; sortBy?: string },
) => {
  const where: any = { userId };
  if (filter.read !== undefined) where.read = filter.read;
  if (filter.type) where.type = filter.type;

  const page = options.page ?? 1;
  const limit = options.limit ?? 10;
  const skip = (page - 1) * limit;

  let sort = '-createdAt';
  if (options.sortBy) {
    const [field, order] = options.sortBy.split(':');
    sort = (order === 'desc' ? '-' : '') + field;
  }

  const notifications = await Notification.find(where).sort(sort).skip(skip).limit(limit);
  const totalResults = await Notification.countDocuments(where);
  const totalPages = Math.ceil(totalResults / limit);

  return { notifications, page, limit, totalPages, totalResults };
};

/**
 * Get unread count for a user
 */
const getUnreadCount = async (userId: string): Promise<number> => {
  return Notification.countDocuments({ userId, read: false });
};

/**
 * Mark a notification as read
 */
const markAsRead = async (notificationId: string, userId: string) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, userId },
    { $set: { read: true, readAt: new Date() } },
    { new: true },
  );
  return notification;
};

/**
 * Mark all notifications as read for a user
 */
const markAllAsRead = async (userId: string) => {
  await Notification.updateMany(
    { userId, read: false },
    { $set: { read: true, readAt: new Date() } },
  );
};

export default {
  createNotification,
  createBulkNotifications,
  getTargetUserIdsForCircular,
  getTargetUserIdsForQuiz,
  notifyCircularCreated,
  notifyQuizPublished,
  notifyAttemptGraded,
  notifyClassEnrolled,
  queryNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
};
