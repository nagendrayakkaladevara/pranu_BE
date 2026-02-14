
import mongoose, { Schema, Document } from 'mongoose';

export enum AttemptStatus {
    STARTED = 'STARTED',
    SUBMITTED = 'SUBMITTED',
    EXPIRED = 'EXPIRED',
}

export interface IResponse {
    questionId: mongoose.Types.ObjectId;
    selectedOptionId?: mongoose.Types.ObjectId;
}

export interface IQuizAttempt extends Document {
    quiz: mongoose.Types.ObjectId;
    student: mongoose.Types.ObjectId;
    status: AttemptStatus;
    score?: number;
    startTime: Date;
    endTime?: Date;
    responses: IResponse[];
    createdAt: Date;
    updatedAt: Date;
}

const responseSchema = new Schema<IResponse>(
    {
        questionId: {
            type: Schema.Types.ObjectId,
            ref: 'Question',
            required: true,
        },
        selectedOptionId: {
            type: Schema.Types.ObjectId,
        },
    },
    { _id: false }
);

const quizAttemptSchema = new Schema<IQuizAttempt>(
    {
        quiz: {
            type: Schema.Types.ObjectId,
            ref: 'Quiz',
            required: true,
        },
        student: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        status: {
            type: String,
            enum: Object.values(AttemptStatus),
            default: AttemptStatus.STARTED,
        },
        score: {
            type: Number,
        },
        startTime: {
            type: Date,
            default: Date.now,
        },
        endTime: {
            type: Date,
        },
        responses: [responseSchema],
    },
    {
        timestamps: true,
    }
);

quizAttemptSchema.set('toJSON', {
    transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
    },
});

const QuizAttempt = mongoose.model<IQuizAttempt>('QuizAttempt', quizAttemptSchema);

export default QuizAttempt;
