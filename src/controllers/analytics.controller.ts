import httpStatus from 'http-status';
import { Request, Response } from 'express';
import catchAsync from '../utils/catchAsync';
import analyticsService from '../services/analytics.service';

const getQuizResults = catchAsync(async (req: Request, res: Response) => {
    const result = await analyticsService.getQuizResults(Number(req.params.quizId));
    res.send(result);
});

const getStudentStats = catchAsync(async (req: Request, res: Response) => {
    const result = await analyticsService.getStudentStats(Number(req.params.studentId));
    res.send(result);
});

export default {
    getQuizResults,
    getStudentStats
}
