
import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export enum Role {
    ADMIN = 'ADMIN',
    LECTURER = 'LECTURER',
    STUDENT = 'STUDENT',
}

export interface IUser extends Document {
    email: string;
    password?: string;
    name: string;
    role: Role;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    isPasswordMatch(password: string): Promise<boolean>;
}

export interface IUserModel extends Model<IUser> {
    isEmailTaken(email: string, excludeUserId?: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
        },
        password: {
            type: String,
            required: true,
            private: true, // used by toJSON plugin if implemented
        },
        name: {
            type: String,
            required: true,
        },
        role: {
            type: String,
            enum: Object.values(Role),
            default: Role.STUDENT,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

// Check if email is taken
userSchema.statics.isEmailTaken = async function (email: string, excludeUserId?: string) {
    const user = await this.findOne({ email, _id: { $ne: excludeUserId } });
    return !!user;
};

// Check if password matches
userSchema.methods.isPasswordMatch = async function (password: string) {
    const user = this;
    return bcrypt.compare(password, user.password);
};

userSchema.pre('save', async function () {
    const user = this;
    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password!, 8);
    }
});

// A simple plugin to return cleaner JSON
userSchema.set('toJSON', {
    transform: (_doc: any, ret: any) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        delete ret.password;
        return ret;
    },
});

const User = mongoose.model<IUser, IUserModel>('User', userSchema);

export default User;
