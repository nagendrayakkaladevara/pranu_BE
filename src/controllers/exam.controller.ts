import httpStatus from 'http-status';
import { Request, Response } from 'express';
import catchAsync from '../utils/catchAsync';
import examService from '../services/exam.service';

const listQuizzes = catchAsync(async (req: Request, res: Response) => {
  const result = await examService.listAvailableQuizzes(req.user.id);
  res.send(result);
});

const startAttempt = catchAsync(async (req: Request, res: Response) => {
  const result = await examService.startAttempt(Number(req.params.quizId), req.user.id);
  res.send(result);
});

const submitAttempt = catchAsync(async (req: Request, res: Response) => {
  const result = await examService.submitAttempt(
    Number(req.params.attemptId),
    req.user.id,
    req.body.responses,
  );
  res.send(result);
});

export default {
  listQuizzes,
  startAttempt,
  submitAttempt,
};
