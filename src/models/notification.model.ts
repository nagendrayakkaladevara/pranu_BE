import mongoose, { Schema, Document } from 'mongoose';

export enum NotificationType {
  CIRCULAR = 'CIRCULAR',
  QUIZ_PUBLISHED = 'QUIZ_PUBLISHED',
  ATTEMPT_GRADED = 'ATTEMPT_GRADED',
  CLASS_ENROLLED = 'CLASS_ENROLLED',
}

export interface INotificationMetadata {
  circularId?: mongoose.Types.ObjectId;
  quizId?: mongoose.Types.ObjectId;
  attemptId?: mongoose.Types.ObjectId;
  classId?: mongoose.Types.ObjectId;
}

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  message?: string;
  link?: string;
  metadata?: INotificationMetadata;
  read: boolean;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const notificationMetadataSchema = new Schema<INotificationMetadata>(
  {
    circularId: { type: Schema.Types.ObjectId, ref: 'Circular' },
    quizId: { type: Schema.Types.ObjectId, ref: 'Quiz' },
    attemptId: { type: Schema.Types.ObjectId, ref: 'QuizAttempt' },
    classId: { type: Schema.Types.ObjectId, ref: 'Class' },
  },
  { _id: false },
);

const notificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: Object.values(NotificationType),
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      trim: true,
    },
    link: {
      type: String,
      trim: true,
    },
    metadata: {
      type: notificationMetadataSchema,
    },
    read: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, read: 1 });

notificationSchema.set('toJSON', {
  transform: (_doc: any, ret: any) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

const Notification = mongoose.model<INotification>('Notification', notificationSchema);

export default Notification;
