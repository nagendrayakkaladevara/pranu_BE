import httpStatus from 'http-status';
import { Request, Response } from 'express';
import catchAsync from '../utils/catchAsync';
import questionService from '../services/question.service';
import { Difficulty } from '../models/question.model';

/**
 * Create a new question
 * @param req Request object containing question details
 * @param res Response object to send created question
 */
const createQuestion = catchAsync(async (req: Request, res: Response) => {
  const result = await questionService.createQuestion(req.body);
  res.status(httpStatus.CREATED).send(result);
});

/**
 * Get all questions with filters
 * @param req Request object containing query filters (subject, topic, difficulty, search)
 * @param res Response object to send list of questions
 */
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

/**
 * Get question by ID
 * @param req Request object containing questionId params
 * @param res Response object to send question details
 */
const getQuestion = catchAsync(async (req: Request, res: Response) => {
  const result = await questionService.getQuestionById(req.params.questionId);
  if (!result) {
    res.status(httpStatus.NOT_FOUND).send({ message: 'Question not found' });
    return;
  }
  res.send(result);
});

/**
 * Update question by ID
 * @param req Request object containing questionId params and update body
 * @param res Response object to send updated question
 */
const updateQuestion = catchAsync(async (req: Request, res: Response) => {
  const result = await questionService.updateQuestionById(req.params.questionId, req.body);
  res.send(result);
});

/**
 * Delete question by ID
 * @param req Request object containing questionId params
 * @param res Response object (No Content)
 */
const deleteQuestion = catchAsync(async (req: Request, res: Response) => {
  await questionService.deleteQuestionById(req.params.questionId);
  res.status(httpStatus.NO_CONTENT).send();
});

export default {
  createQuestion,
  getQuestions,
  getQuestion,
  updateQuestion,
  deleteQuestion,
};
