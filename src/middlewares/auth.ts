import { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';
import jwt from 'jsonwebtoken';
import config from '../config/config';
import { ApiError } from './error';
import prisma from '../client';
import { Role } from '@prisma/client';

// Extend Express Request type to include user
declare global {
    namespace Express {
        interface Request {
            user?: any;
        }
    }
}

const auth = (...requiredRoles: Role[]) => async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate');
        }

        const token = authHeader.split(' ')[1];

        if (!token) {
            throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate');
        }

        try {
            const payload = jwt.verify(token, config.jwt.secret) as any;

            const user = await prisma.user.findUnique({
                where: { id: payload.sub }
            });

            if (!user || (requiredRoles.length && !requiredRoles.includes(user.role))) {
                throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
            }

            req.user = user;
            next();

        } catch (error) {
            throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate');
        }

    } catch (error) {
        next(error);
    }
};

export default auth;
