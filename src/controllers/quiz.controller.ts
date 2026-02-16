import httpStatus from 'http-status';
import { Request, Response } from 'express';
import catchAsync from '../utils/catchAsync';
import quizService from '../services/quiz.service';
import { QuizStatus } from '../models/quiz.model';

/**
 * Create a new quiz
 * @param req Request object containing quiz details
 * @param res Response object to send created quiz
 */
const createQuiz = catchAsync(async (req: Request, res: Response) => {
  const result = await quizService.createQuiz(req.body, req.user); // req.user set by auth middleware
  res.status(httpStatus.CREATED).send(result);
});

/**
 * Get all quizzes with filters
 * @param req Request object containing query filters
 * @param res Response object to send list of quizzes
 */
const getQuizzes = catchAsync(async (req: Request, res: Response) => {
  const filter: any = {
    title: req.query.title ? String(req.query.title) : undefined,
    status: req.query.status ? (req.query.status as QuizStatus) : undefined,
  };
  // Lecturers see only their own quizzes; admins see all
  if (req.user.role === 'LECTURER') {
    filter.createdBy = req.user.id;
  }
  const options = {
    limit: Number(req.query.limit) || 10,
    page: Number(req.query.page) || 1,
    sortBy: req.query.sortBy,
  };
  const result = await quizService.queryQuizzes(filter, options);
  res.send(result);
});

/**
 * Get quiz details by ID
 * @param req Request object containing quizId params
 * @param res Response object to send quiz details
 */
const getQuiz = catchAsync(async (req: Request, res: Response) => {
  const result = await quizService.getQuizById(req.params.quizId);
  if (!result) {
    res.status(httpStatus.NOT_FOUND).send({ message: 'Quiz not found' });
    return;
  }
  res.send(result);
});

/**
 * Update quiz details by ID
 * @param req Request object containing quizId params and update body
 * @param res Response object to send updated quiz
 */
const updateQuiz = catchAsync(async (req: Request, res: Response) => {
  const result = await quizService.updateQuizById(req.params.quizId, req.body);
  res.send(result);
});

/**
 * Delete quiz by ID
 * @param req Request object containing quizId params
 * @param res Response object (No Content)
 */
const deleteQuiz = catchAsync(async (req: Request, res: Response) => {
  await quizService.deleteQuizById(req.params.quizId);
  res.status(httpStatus.NO_CONTENT).send();
});

/**
 * Add questions to a quiz
 * @param req Request object containing quizId params and list of question IDs
 * @param res Response object to send updated quiz
 */
const addQuestions = catchAsync(async (req: Request, res: Response) => {
  const result = await quizService.addQuestionsToQuiz(
    req.params.quizId,
    req.body.questionIds,
  );
  res.send(result);
});

/**
 * Publish quiz to classes
 * @param req Request object containing quizId params and list of class IDs
 * @param res Response object to send updated quiz
 */
const publishQuiz = catchAsync(async (req: Request, res: Response) => {
  const result = await quizService.publishQuiz(req.params.quizId, req.body.classIds);
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
