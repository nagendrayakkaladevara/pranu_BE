
import mongoose, { Schema, Document } from 'mongoose';

export enum QuizStatus {
    DRAFT = 'DRAFT',
    PUBLISHED = 'PUBLISHED',
    ARCHIVED = 'ARCHIVED',
}

export interface IQuiz extends Document {
    title: string;
    description?: string;
    createdBy: mongoose.Types.ObjectId;
    durationMinutes: number;
    totalMarks: number;
    passMarks?: number;
    shuffleQuestions: boolean;
    status: QuizStatus;
    startTime?: Date;
    endTime?: Date;
    questions: mongoose.Types.ObjectId[];
    assignedClasses: mongoose.Types.ObjectId[];
    createdAt: Date;
    updatedAt: Date;
}

const quizSchema = new Schema<IQuiz>(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        durationMinutes: {
            type: Number,
            default: 60,
        },
        totalMarks: {
            type: Number,
            required: true,
        },
        passMarks: {
            type: Number,
        },
        shuffleQuestions: {
            type: Boolean,
            default: false,
        },
        status: {
            type: String,
            enum: Object.values(QuizStatus),
            default: QuizStatus.DRAFT,
        },
        startTime: {
            type: Date,
        },
        endTime: {
            type: Date,
        },
        questions: [
            {
                type: Schema.Types.ObjectId,
                ref: 'Question',
            },
        ],
        assignedClasses: [
            {
                type: Schema.Types.ObjectId,
                ref: 'Class',
            },
        ],
    },
    {
        timestamps: true,
    }
);

quizSchema.set('toJSON', {
    transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
    },
});

const Quiz = mongoose.model<IQuiz>('Quiz', quizSchema);

export default Quiz;
