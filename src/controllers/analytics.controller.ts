import httpStatus from 'http-status';
import { Request, Response } from 'express';
import catchAsync from '../utils/catchAsync';
import analyticsService from '../services/analytics.service';

/**
 * Get analytics/results for a specific quiz
 * @param req Request object containing quizId params
 * @param res Response object to send quiz statistics
 */
const getQuizResults = catchAsync(async (req: Request, res: Response) => {
  const result = await analyticsService.getQuizResults(Number(req.params.quizId));
  res.send(result);
});

/**
 * Get performance statistics for a specific student
 * @param req Request object containing studentId params
 * @param res Response object to send student's attempt history
 */
const getStudentStats = catchAsync(async (req: Request, res: Response) => {
  const result = await analyticsService.getStudentStats(Number(req.params.studentId));
  res.send(result);
});

export default {
  getQuizResults,
  getStudentStats,
};
