import httpStatus from 'http-status';
import Question from '../models/question.model';
import { ApiError } from '../middlewares/error';

const createQuestion = async (questionBody: any) => {
  const { options } = questionBody;

  if (options && options.length > 0 && !options.some((opt: any) => opt.isCorrect)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'At least one option must be correct');
  }

  return Question.create(questionBody);
};

const queryQuestions = async (filter: any, options: any, userId: string, userRole: string) => {
  const where: any = {};

  // Lecturers only see their own questions; Admins see all
  if (userRole === 'LECTURER') {
    where.createdBy = userId;
  }

  if (filter.subject) where.subject = { $regex: filter.subject, $options: 'i' };
  if (filter.topic) where.topic = { $regex: filter.topic, $options: 'i' };
  if (filter.difficulty) where.difficulty = filter.difficulty;
  if (filter.search) where.text = { $regex: filter.search, $options: 'i' };

  const page = options.page ?? 1;
  const limit = options.limit ?? 10;
  const skip = (page - 1) * limit;

  let sort = '-createdAt';
  if (options.sortBy) {
    const [field, order] = options.sortBy.split(':');
    sort = (order === 'desc' ? '-' : '') + field;
  }

  const questions = await Question.find(where)
    .sort(sort)
    .skip(skip)
    .limit(limit);

  const totalResults = await Question.countDocuments(where);
  const totalPages = Math.ceil(totalResults / limit);

  return { questions, page, limit, totalPages, totalResults };
};

const getQuestionById = async (id: string) => {
  return Question.findById(id);
};

const updateQuestionById = async (questionId: string, updateBody: any, userId: string, userRole: string) => {
  const question = await getQuestionById(questionId);
  if (!question) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Question not found');
  }

  // Lecturers can only update their own questions
  if (userRole === 'LECTURER' && question.createdBy.toString() !== userId) {
    throw new ApiError(httpStatus.FORBIDDEN, 'You can only update your own questions');
  }

  if (updateBody.options) {
    if (!updateBody.options.some((opt: any) => opt.isCorrect)) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'At least one option must be correct');
    }
  }

  Object.assign(question, updateBody);
  await question.save();
  return question;
};

const deleteQuestionById = async (questionId: string, userId: string, userRole: string) => {
  const question = await getQuestionById(questionId);
  if (!question) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Question not found');
  }

  // Lecturers can only delete their own questions
  if (userRole === 'LECTURER' && question.createdBy.toString() !== userId) {
    throw new ApiError(httpStatus.FORBIDDEN, 'You can only delete your own questions');
  }

  await question.deleteOne();
  return question;
};

export default {
  createQuestion,
  queryQuestions,
  getQuestionById,
  updateQuestionById,
  deleteQuestionById,
};
