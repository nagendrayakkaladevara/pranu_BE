import httpStatus from 'http-status';
import { Request, Response } from 'express';
import catchAsync from '../utils/catchAsync';
import examService from '../services/exam.service';

/**
 * List available quizzes for the logged-in student
 * @param req Request object containing authenticated user info
 * @param res Response object to send list of quizzes
 */
const listQuizzes = catchAsync(async (req: Request, res: Response) => {
  const result = await examService.listAvailableQuizzes(req.user.id);
  res.send(result);
});

/**
 * Start a quiz attempt
 * @param req Request object containing quizId params and authenticated user info
 * @param res Response object to send quiz questions and attempt info
 */
const startAttempt = catchAsync(async (req: Request, res: Response) => {
  const result = await examService.startAttempt(req.params.quizId, req.user.id);
  res.send(result);
});

/**
 * Submit a quiz attempt and calculate score
 * @param req Request object containing attemptId params, answers, and authenticated user info
 * @param res Response object to send results and score
 */
const submitAttempt = catchAsync(async (req: Request, res: Response) => {
  const result = await examService.submitAttempt(
    req.params.attemptId,
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
