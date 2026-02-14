
import httpStatus from 'http-status';
import mongoose from 'mongoose';
import Quiz, { QuizStatus } from '../models/quiz.model';
import Class from '../models/class.model';
import QuizAttempt, { AttemptStatus } from '../models/attempt.model';
import Question from '../models/question.model';
import { ApiError } from '../middlewares/error';

/**
 * List available quizzes for student
 * @param {string} studentId
 * @returns {Promise<Quiz[]>}
 */
const listAvailableQuizzes = async (studentId: string) => {
  // 1. Get classes student belongs to
  // In our model, Class has students array of IDs.
  const classes = await Class.find({ students: studentId }).select('_id');
  const classIds = classes.map((c) => c._id);

  // 2. Find published quizzes assigned to these classes
  const now = new Date();

  const quizzes = await Quiz.find({
    status: QuizStatus.PUBLISHED,
    assignedClasses: { $in: classIds },
    $or: [{ startTime: { $lte: now } }, { startTime: { $exists: false } }], // Handle checks
    // Combined time check:
    // (startTime <= now) AND (endTime >= now OR endTime is null)
  }).find({
    $and: [
      { $or: [{ startTime: { $lte: now } }, { startTime: null }] },
      { $or: [{ endTime: { $gte: now } }, { endTime: null }] },
    ],
  });

  return quizzes;
};

/**
 * Start quiz attempt
 * @param {string} quizId
 * @param {string} studentId
 * @returns {Promise<Object>}
 */
const startAttempt = async (quizId: string, studentId: string) => {
  const quiz = await Quiz.findById(quizId).populate('questions');
  if (!quiz) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Quiz not found');
  }

  // Validation
  const now = new Date();
  if (quiz.status !== QuizStatus.PUBLISHED) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Quiz is not active');
  }
  if (quiz.startTime && now < quiz.startTime) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Quiz has not started yet');
  }
  if (quiz.endTime && now > quiz.endTime) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Quiz has expired');
  }

  // Check if already attempted
  const existingAttempt = await QuizAttempt.findOne({
    quiz: quizId,
    student: studentId,
    status: { $in: [AttemptStatus.STARTED, AttemptStatus.SUBMITTED] },
  });

  if (existingAttempt) {
    if (existingAttempt.status === AttemptStatus.SUBMITTED) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'You have already submitted this quiz');
    }
  }

  // Create Attempt
  const attempt = await QuizAttempt.create({
    quiz: quizId,
    student: studentId,
    status: AttemptStatus.STARTED,
  });

  // Prepare response: Questions with options (sanitized)
  // quiz.questions is array of docs (populated)
  const questions = (quiz.questions as any[]).map((q) => ({
    id: q._id,
    text: q.text,
    type: q.type,
    marks: q.marks,
    options: q.options.map((opt: any) => ({
      id: opt._id,
      text: opt.text,
      // exclude isCorrect
    })),
  }));

  return { attempt, questions };
};

/**
 * Submit quiz attempt
 * @param {string} attemptId
 * @param {string} studentId
 * @param {Object[]} responses
 * @returns {Promise<Object>}
 */
const submitAttempt = async (attemptId: string, studentId: string, responses: any[]) => {
  const attempt = await QuizAttempt.findById(attemptId).populate('quiz');
  if (!attempt) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Attempt not found');
  }

  if (attempt.student.toString() !== studentId.toString()) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Not your attempt');
  }

  if (attempt.status === AttemptStatus.SUBMITTED) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Already submitted');
  }

  // Calculate score
  let score = 0;

  // Fetch valid answers
  const questionIds = responses.map((r) => r.questionId);
  const questions = await Question.find({ _id: { $in: questionIds } });

  const responseData: any[] = [];

  for (const resp of responses) {
    const question = questions.find((q) => q._id.toString() === resp.questionId.toString());
    if (question) {
      // Find selected option
      // In Mongoose subdocs have _id
      const selectedOption = question.options.find(
        (o: any) => o._id.toString() === resp.selectedOptionId.toString()
      );

      // Check correctness
      // question.options type is IOption which has isCorrect
      if (selectedOption && (selectedOption as any).isCorrect) {
        score += question.marks;
      }
      responseData.push({
        questionId: resp.questionId,
        selectedOptionId: resp.selectedOptionId,
      });
    }
  }

  // Update attempt
  attempt.responses = responseData;
  attempt.status = AttemptStatus.SUBMITTED;
  attempt.score = score;
  attempt.endTime = new Date();
  await attempt.save();

  // quiz is populated
  const totalMarks = (attempt.quiz as any).totalMarks;

  return { message: 'Quiz submitted successfully', score, totalMarks };
};

export default {
  listAvailableQuizzes,
  startAttempt,
  submitAttempt,
};
