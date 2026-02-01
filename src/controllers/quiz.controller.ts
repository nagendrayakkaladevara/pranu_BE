import httpStatus from 'http-status';
import { Request, Response } from 'express';
import catchAsync from '../utils/catchAsync';
import quizService from '../services/quiz.service';
import { QuizStatus } from '@prisma/client';

const createQuiz = catchAsync(async (req: Request, res: Response) => {
  const result = await quizService.createQuiz(req.body, req.user); // req.user set by auth middleware
  res.status(httpStatus.CREATED).send(result);
});

const getQuizzes = catchAsync(async (req: Request, res: Response) => {
  const filter = {
    title: req.query.title ? String(req.query.title) : undefined,
    status: req.query.status ? (req.query.status as QuizStatus) : undefined,
  };
  const options = {
    limit: Number(req.query.limit) || 10,
    page: Number(req.query.page) || 1,
    sortBy: req.query.sortBy,
  };
  const result = await quizService.queryQuizzes(filter, options);
  res.send(result);
});

const getQuiz = catchAsync(async (req: Request, res: Response) => {
  const result = await quizService.getQuizById(Number(req.params.quizId));
  if (!result) {
    res.status(httpStatus.NOT_FOUND).send({ message: 'Quiz not found' });
    return;
  }
  res.send(result);
});

const updateQuiz = catchAsync(async (req: Request, res: Response) => {
  const result = await quizService.updateQuizById(Number(req.params.quizId), req.body);
  res.send(result);
});

const deleteQuiz = catchAsync(async (req: Request, res: Response) => {
  await quizService.deleteQuizById(Number(req.params.quizId));
  res.status(httpStatus.NO_CONTENT).send();
});

const addQuestions = catchAsync(async (req: Request, res: Response) => {
  const result = await quizService.addQuestionsToQuiz(
    Number(req.params.quizId),
    req.body.questionIds,
  );
  res.send(result);
});

const publishQuiz = catchAsync(async (req: Request, res: Response) => {
  const result = await quizService.publishQuiz(Number(req.params.quizId), req.body.classIds);
  res.send(result);
});

export default {
  createQuiz,
  getQuizzes,
  getQuiz,
  updateQuiz,
  deleteQuiz,
  addQuestions,
  publishQuiz,
};
