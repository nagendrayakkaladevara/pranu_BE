import httpStatus from 'http-status';
import { Request, Response } from 'express';
import catchAsync from '../utils/catchAsync';
import questionService from '../services/question.service';
import { Difficulty } from '../models/question.model';

const createQuestion = catchAsync(async (req: Request, res: Response) => {
  const questionBody = { ...req.body, createdBy: req.user.id };
  const result = await questionService.createQuestion(questionBody);
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
  const result = await questionService.queryQuestions(filter, options, req.user.id, req.user.role);
  res.send(result);
});

const getQuestion = catchAsync(async (req: Request, res: Response) => {
  const result = await questionService.getQuestionById(req.params.questionId);
  if (!result) {
    res.status(httpStatus.NOT_FOUND).send({ message: 'Question not found' });
    return;
  }
  res.send(result);
});

const updateQuestion = catchAsync(async (req: Request, res: Response) => {
  const result = await questionService.updateQuestionById(
    req.params.questionId,
    req.body,
    req.user.id,
    req.user.role,
  );
  res.send(result);
});

const deleteQuestion = catchAsync(async (req: Request, res: Response) => {
  await questionService.deleteQuestionById(req.params.questionId, req.user.id, req.user.role);
  res.status(httpStatus.NO_CONTENT).send();
});

export default {
  createQuestion,
  getQuestions,
  getQuestion,
  updateQuestion,
  deleteQuestion,
};
