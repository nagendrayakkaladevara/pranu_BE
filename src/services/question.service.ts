
import httpStatus from 'http-status';
import Question from '../models/question.model';
import { ApiError } from '../middlewares/error';

/**
 * Create a question
 * @param {Object} questionBody
 * @returns {Promise<Question>}
 */
const createQuestion = async (questionBody: any) => {
  const { options } = questionBody;

  // Verify at least one correct option exists for MCQ if options provided
  if (options && options.length > 0 && !options.some((opt: any) => opt.isCorrect)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'At least one option must be correct');
  }

  return Question.create(questionBody);
};

/**
 * Query for questions
 * @param {Object} filter - Filter
 * @param {Object} options - Query options
 * @returns {Promise<Object>}
 */
const queryQuestions = async (filter: any, options: any) => {
  const where: any = {};
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

/**
 * Get question by id
 * @param {string} id
 * @returns {Promise<Question>}
 */
const getQuestionById = async (id: string) => {
  return Question.findById(id);
};

/**
 * Update question by id
 * @param {string} questionId
 * @param {Object} updateBody
 * @returns {Promise<Question>}
 */
const updateQuestionById = async (questionId: string, updateBody: any) => {
  const question = await getQuestionById(questionId);
  if (!question) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Question not found');
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

/**
 * Delete question by id
 * @param {string} questionId
 * @returns {Promise<Question>}
 */
const deleteQuestionById = async (questionId: string) => {
  const question = await Question.findByIdAndDelete(questionId);
  if (!question) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Question not found');
  }
  return question;
};

export default {
  createQuestion,
  queryQuestions,
  getQuestionById,
  updateQuestionById,
  deleteQuestionById,
};
