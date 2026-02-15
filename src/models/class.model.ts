
import mongoose, { Schema, Document } from 'mongoose';

export interface IClass extends Document {
    name: string;
    department: string;
    academicYear: string;
    semester: number;
    students: mongoose.Types.ObjectId[];
    lecturers: mongoose.Types.ObjectId[];
    createdAt: Date;
    updatedAt: Date;
}

const classSchema = new Schema<IClass>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        department: {
            type: String,
            required: true,
            trim: true,
        },
        academicYear: {
            type: String,
            required: true,
            trim: true,
        },
        semester: {
            type: Number,
            required: true,
        },
        students: [
            {
                type: Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
        lecturers: [
            {
                type: Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
    },
    {
        timestamps: true,
    }
);

classSchema.set('toJSON', {
    transform: (_doc: any, ret: any) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
    },
});

const Class = mongoose.model<IClass>('Class', classSchema);

export default Class;
