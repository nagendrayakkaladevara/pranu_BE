
import mongoose, { Schema, Document } from 'mongoose';

export enum QuestionType {
    MCQ = 'MCQ',
    SUBJECTIVE = 'SUBJECTIVE',
}

export enum Difficulty {
    EASY = 'EASY',
    MEDIUM = 'MEDIUM',
    HARD = 'HARD',
}

export interface IOption {
    text: string;
    isCorrect: boolean;
}

export interface IQuestion extends Document {
    text: string;
    type: QuestionType;
    difficulty: Difficulty;
    marks: number;
    subject: string;
    topic?: string;
    options: IOption[];
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const optionSchema = new Schema<IOption>({
    text: { type: String, required: true },
    isCorrect: { type: Boolean, default: false },
});

const questionSchema = new Schema<IQuestion>(
    {
        text: {
            type: String,
            required: true,
            trim: true,
        },
        type: {
            type: String,
            enum: Object.values(QuestionType),
            default: QuestionType.MCQ,
        },
        difficulty: {
            type: String,
            enum: Object.values(Difficulty),
            default: Difficulty.MEDIUM,
        },
        marks: {
            type: Number,
            default: 1,
        },
        subject: {
            type: String,
            required: true,
            trim: true,
        },
        topic: {
            type: String,
            trim: true,
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        options: [optionSchema],
    },
    {
        timestamps: true,
    }
);

questionSchema.set('toJSON', {
    transform: (_doc: any, ret: any) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
    },
});

const Question = mongoose.model<IQuestion>('Question', questionSchema);

export default Question;
