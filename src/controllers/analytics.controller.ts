import httpStatus from 'http-status';
import { Request, Response } from 'express';
import catchAsync from '../utils/catchAsync';
import analyticsService from '../services/analytics.service';

const getQuizResults = catchAsync(async (req: Request, res: Response) => {
  const result = await analyticsService.getQuizResults(req.params.quizId);
  res.send(result);
});

const getStudentStats = catchAsync(async (req: Request, res: Response) => {
  const result = await analyticsService.getStudentStats(req.params.studentId);
  res.send(result);
});

const getQuestionAnalysis = catchAsync(async (req: Request, res: Response) => {
  const result = await analyticsService.getQuestionAnalysis(req.params.quizId);
  res.send(result);
});

const getDifficultyAnalysis = catchAsync(async (req: Request, res: Response) => {
  const result = await analyticsService.getDifficultyAnalysis(req.params.quizId);
  res.send(result);
});

export default {
  getQuizResults,
  getStudentStats,
  getQuestionAnalysis,
  getDifficultyAnalysis,
};
