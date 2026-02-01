import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import httpStatus from 'http-status';
import { ApiError } from '../middlewares/error';

const validate = (schema: any) => (req: Request, res: Response, next: NextFunction) => {
    const object = {
        params: req.params,
        query: req.query,
        body: req.body,
    };

    // We only validate the parts that are defined in the schema
    const validations: any = {};
    if (schema.params) validations.params = schema.params;
    if (schema.query) validations.query = schema.query;
    if (schema.body) validations.body = schema.body;

    const validSchema = z.object(validations);

    try {
        validSchema.parse(object);
        return next();
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            const errorMessage = error.errors.map((details) => details.message).join(', ');
            return next(new ApiError(httpStatus.BAD_REQUEST, errorMessage));
        }
        next(new ApiError(httpStatus.BAD_REQUEST, 'Validation error'));
    }
};

export default validate;
