import mongoose, { Schema, Document } from 'mongoose';

export enum CircularType {
  CIRCULAR = 'CIRCULAR',
  NOTICE = 'NOTICE',
  ANNOUNCEMENT = 'ANNOUNCEMENT',
}

export enum TargetType {
  CLASS = 'CLASS',
  DEPARTMENT = 'DEPARTMENT',
  ALL = 'ALL',
}

export enum Priority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export interface ICircular extends Document {
  type: CircularType;
  title: string;
  content: string;
  publishedBy: mongoose.Types.ObjectId;
  targetType: TargetType;
  targetClassId?: mongoose.Types.ObjectId;
  targetDepartment?: string;
  priority: Priority;
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const circularSchema = new Schema<ICircular>(
  {
    type: {
      type: String,
      enum: Object.values(CircularType),
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    publishedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    targetType: {
      type: String,
      enum: Object.values(TargetType),
      required: true,
    },
    targetClassId: {
      type: Schema.Types.ObjectId,
      ref: 'Class',
    },
    targetDepartment: {
      type: String,
      trim: true,
    },
    priority: {
      type: String,
      enum: Object.values(Priority),
      default: Priority.NORMAL,
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

circularSchema.index({ targetType: 1, targetClassId: 1, targetDepartment: 1 });
circularSchema.index({ createdAt: -1 });
circularSchema.index({ isPinned: -1, createdAt: -1 });

circularSchema.set('toJSON', {
  transform: (_doc: any, ret: any) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

const Circular = mongoose.model<ICircular>('Circular', circularSchema);

export default Circular;
