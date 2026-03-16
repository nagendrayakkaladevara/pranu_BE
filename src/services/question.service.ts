import httpStatus from 'http-status';
import Question, { QuestionType } from '../models/question.model';
import { ApiError } from '../middlewares/error';

const createQuestion = async (questionBody: any) => {
  const {
    options,
    multipleCorrect = false,
    type = QuestionType.MCQ,
    correctAnswers,
  } = questionBody;

  if (type === QuestionType.MCQ) {
    if (!options || options.length < 2) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'MCQ must have at least 2 options');
    }
    const correctCount = options.filter((opt: any) => opt.isCorrect).length;
    if (multipleCorrect) {
      if (correctCount < 1) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          'Multiple correct: at least one option must be correct',
        );
      }
    } else {
      if (correctCount !== 1) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          'Single correct: exactly one option must be correct',
        );
      }
    }
  } else if (type === QuestionType.FILL_IN_BLANK) {
    const answers = (correctAnswers || [])
      .map((a: string) => String(a).trim())
      .filter((a: string) => a.length > 0);
    if (answers.length < 1) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'FILL_IN_BLANK must have at least one non-empty correctAnswer',
      );
    }
    if (options && options.length > 0) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'FILL_IN_BLANK should not have options; use correctAnswers instead',
      );
    }
    questionBody.options = [];
    questionBody.correctAnswers = answers;
  } else {
    // SUBJECTIVE
    questionBody.options = questionBody.options || [];
    questionBody.correctAnswers = undefined;
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
  if (filter.type) where.type = filter.type;
  if (filter.search) where.text = { $regex: filter.search, $options: 'i' };

  const page = options.page ?? 1;
  const limit = options.limit ?? 10;
  const skip = (page - 1) * limit;

  let sort = '-createdAt';
  if (options.sortBy) {
    const [field, order] = options.sortBy.split(':');
    sort = (order === 'desc' ? '-' : '') + field;
  }

  const questions = await Question.find(where).sort(sort).skip(skip).limit(limit);

  const totalResults = await Question.countDocuments(where);
  const totalPages = Math.ceil(totalResults / limit);

  return { questions, page, limit, totalPages, totalResults };
};

const getQuestionById = async (id: string) => {
  return Question.findById(id);
};

const updateQuestionById = async (
  questionId: string,
  updateBody: any,
  userId: string,
  userRole: string,
) => {
  const question = await getQuestionById(questionId);
  if (!question) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Question not found');
  }

  // Lecturers can only update their own questions
  if (userRole === 'LECTURER' && question.createdBy.toString() !== userId) {
    throw new ApiError(httpStatus.FORBIDDEN, 'You can only update your own questions');
  }

  const type = updateBody.type ?? question.type;

  if (type === QuestionType.MCQ) {
    const options = updateBody.options ?? question.options;
    if (!options || options.length < 2) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'MCQ must have at least 2 options');
    }
    const multipleCorrect = updateBody.multipleCorrect ?? question.multipleCorrect;
    const correctCount = options.filter((opt: any) => opt.isCorrect).length;
    if (multipleCorrect) {
      if (correctCount < 1) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          'Multiple correct: at least one option must be correct',
        );
      }
    } else {
      if (correctCount !== 1) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          'Single correct: exactly one option must be correct',
        );
      }
    }
    updateBody.correctAnswers = undefined;
  } else if (type === QuestionType.FILL_IN_BLANK) {
    const correctAnswers = updateBody.correctAnswers ?? question.correctAnswers ?? [];
    const answers = correctAnswers
      .map((a: string) => String(a).trim())
      .filter((a: string) => a.length > 0);
    if (answers.length < 1) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'FILL_IN_BLANK must have at least one non-empty correctAnswer',
      );
    }
    updateBody.options = [];
    updateBody.correctAnswers = answers;
  } else {
    updateBody.options = updateBody.options ?? [];
    updateBody.correctAnswers = undefined;
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
