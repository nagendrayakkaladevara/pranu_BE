import httpStatus from 'http-status';
import { Request, Response } from 'express';
import catchAsync from '../utils/catchAsync';
import examService from '../services/exam.service';

const listQuizzes = catchAsync(async (req: Request, res: Response) => {
  const result = await examService.listAvailableQuizzes(req.user.id);
  res.send(result);
});

const startAttempt = catchAsync(async (req: Request, res: Response) => {
  const result = await examService.startAttempt(req.params.quizId, req.user.id);
  res.send(result);
});

const submitAttempt = catchAsync(async (req: Request, res: Response) => {
  const result = await examService.submitAttempt(req.params.attemptId, req.user.id, req.body.responses);
  res.send(result);
});

const gradeAttempt = catchAsync(async (req: Request, res: Response) => {
  const result = await examService.gradeAttempt(req.params.attemptId, req.body.grades);
  res.send(result);
});

const getAttempts = catchAsync(async (req: Request, res: Response) => {
  const filter = {
    quizId: req.query.quizId ? String(req.query.quizId) : undefined,
    studentId: req.query.studentId ? String(req.query.studentId) : undefined,
    status: req.query.status ? String(req.query.status) : undefined,
  };
  const options = {
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 10,
    sortBy: req.query.sortBy ? String(req.query.sortBy) : undefined,
  };
  const result = await examService.queryAttempts(filter, options, req.user.id, req.user.role);
  res.send(result);
});

const getAttemptById = catchAsync(async (req: Request, res: Response) => {
  const result = await examService.getAttemptById(req.params.attemptId, req.user.id, req.user.role);
  res.send(result);
});

const getMyStats = catchAsync(async (req: Request, res: Response) => {
  const result = await examService.getMyStats(req.user.id);
  res.send(result);
});

export default {
  listQuizzes,
  startAttempt,
  submitAttempt,
  gradeAttempt,
  getAttempts,
  getAttemptById,
  getMyStats,
};
