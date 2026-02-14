
import { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';
import jwt from 'jsonwebtoken';
import config from '../config/config';
import { ApiError } from './error';
import User from '../models/user.model';

// Extend Express Request type to include user
declare global {
    namespace Express {
        interface Request {
            user?: any;
        }
    }
}

/**
 * Auth middleware to handle JWT authentication and role-based access control
 * @param requiredRoles List of roles allowed to access the route
 */
const auth =
    (...requiredRoles: string[]) =>
        async (req: Request, res: Response, next: NextFunction) => {
            try {
                const authHeader = req.headers.authorization;

                if (!authHeader || !authHeader.startsWith('Bearer ')) {
                    throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate');
                }

                const token = authHeader.split(' ')[1];

                if (!token) {
                    throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate');
                }

                let payload: any;
                try {
                    payload = jwt.verify(token, config.jwt.secret);
                } catch (error) {
                    throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate');
                }

                const user = await User.findById(payload.sub);

                if (!user) {
                    throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate');
                }

                if (requiredRoles.length && !requiredRoles.includes(user.role)) {
                    throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
                }

                req.user = user;
                next();
            } catch (error) {
                next(error);
            }
        };

export default auth;
