import httpStatus from 'http-status';
import { Request, Response } from 'express';
import catchAsync from '../utils/catchAsync';
import questionService from '../services/question.service';
import { Difficulty } from '@prisma/client';

const createQuestion = catchAsync(async (req: Request, res: Response) => {
  const result = await questionService.createQuestion(req.body);
  res.status(httpStatus.CREATED).send(result);
});

const getQuestions = catchAsync(async (req: Request, res: Response) => {
  const filter = {
    subject: req.query.subject ? String(req.query.subject) : undefined,
    topic: req.query.topic ? String(req.query.topic) : undefined,
    difficulty: req.query.difficulty ? (req.query.difficulty as Difficulty) : undefined,
    search: req.query.search ? String(req.query.search) : undefined,
  };
  const options = {
    limit: Number(req.query.limit) || 10,
    page: Number(req.query.page) || 1,
    sortBy: req.query.sortBy,
  };
  const result = await questionService.queryQuestions(filter, options);
  res.send(result);
});

const getQuestion = catchAsync(async (req: Request, res: Response) => {
  const result = await questionService.getQuestionById(Number(req.params.questionId));
  if (!result) {
    res.status(httpStatus.NOT_FOUND).send({ message: 'Question not found' });
    return;
  }
  res.send(result);
});

const updateQuestion = catchAsync(async (req: Request, res: Response) => {
  const result = await questionService.updateQuestionById(Number(req.params.questionId), req.body);
  res.send(result);
});

const deleteQuestion = catchAsync(async (req: Request, res: Response) => {
  await questionService.deleteQuestionById(Number(req.params.questionId));
  res.status(httpStatus.NO_CONTENT).send();
});

export default {
  createQuestion,
  getQuestions,
  getQuestion,
  updateQuestion,
  deleteQuestion,
};
