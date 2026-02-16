import httpStatus from 'http-status';
import mongoose from 'mongoose';
import Quiz, { QuizStatus } from '../models/quiz.model';
import Class from '../models/class.model';
import QuizAttempt, { AttemptStatus } from '../models/attempt.model';
import Question, { QuestionType } from '../models/question.model';
import User from '../models/user.model';
import { ApiError } from '../middlewares/error';

/**
 * Expire stale attempts where quiz endTime has passed or duration has been exceeded
 */
const expireStaleAttempts = async () => {
  const now = new Date();

  // Find all STARTED attempts and check if they should be expired
  const startedAttempts = await QuizAttempt.find({ status: AttemptStatus.STARTED }).populate('quiz');

  for (const attempt of startedAttempts) {
    const quiz = attempt.quiz as any;
    if (!quiz) continue;

    let shouldExpire = false;

    // Check if quiz end time has passed
    if (quiz.endTime && now > quiz.endTime) {
      shouldExpire = true;
    }

    // Check if attempt duration has been exceeded
    if (quiz.durationMinutes && attempt.startTime) {
      const expiryTime = new Date(attempt.startTime.getTime() + quiz.durationMinutes * 60 * 1000);
      if (now > expiryTime) {
        shouldExpire = true;
      }
    }

    if (shouldExpire) {
      attempt.status = AttemptStatus.EXPIRED;
      attempt.endTime = now;
      await attempt.save();
    }
  }
};

const listAvailableQuizzes = async (studentId: string) => {
  await expireStaleAttempts();
  const classes = await Class.find({ students: studentId }).select('_id');
  const classIds = classes.map((c) => c._id);

  const now = new Date();

  const quizzes = await Quiz.find({
    status: QuizStatus.PUBLISHED,
    assignedClasses: { $in: classIds },
    $and: [
      { $or: [{ startTime: { $lte: now } }, { startTime: null }] },
      { $or: [{ endTime: { $gte: now } }, { endTime: null }] },
    ],
  });

  return quizzes;
};

const startAttempt = async (quizId: string, studentId: string) => {
  await expireStaleAttempts();
  const quiz = await Quiz.findById(quizId).populate('questions');
  if (!quiz) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Quiz not found');
  }

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

  const attempt = await QuizAttempt.create({
    quiz: quizId,
    student: studentId,
    status: AttemptStatus.STARTED,
  });

  const questions = (quiz.questions as any[]).map((q) => ({
    id: q._id,
    text: q.text,
    type: q.type,
    marks: q.marks,
    options:
      q.type === QuestionType.MCQ
        ? q.options.map((opt: any) => ({
            id: opt._id,
            text: opt.text,
          }))
        : [],
  }));

  return { attempt, questions };
};

const submitAttempt = async (attemptId: string, studentId: string, responses: any[]) => {
  await expireStaleAttempts();
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

  if (attempt.status === AttemptStatus.EXPIRED) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Attempt has expired');
  }

  let mcqScore = 0;
  let hasSubjective = false;

  const questionIds = responses.map((r) => r.questionId);
  const questions = await Question.find({ _id: { $in: questionIds } });

  const responseData: any[] = [];

  for (const resp of responses) {
    const question = questions.find((q) => q._id.toString() === resp.questionId.toString());
    if (!question) continue;

    if (question.type === QuestionType.MCQ) {
      const selectedOption = question.options.find(
        (o: any) => o._id.toString() === resp.selectedOptionId?.toString()
      );
      const isCorrect = selectedOption && (selectedOption as any).isCorrect;
      if (isCorrect) {
        mcqScore += question.marks;
      }
      responseData.push({
        questionId: resp.questionId,
        selectedOptionId: resp.selectedOptionId,
        isGraded: true,
        awardedMarks: isCorrect ? question.marks : 0,
      });
    } else {
      hasSubjective = true;
      responseData.push({
        questionId: resp.questionId,
        textAnswer: resp.textAnswer || '',
        isGraded: false,
        awardedMarks: 0,
      });
    }
  }

  attempt.responses = responseData;
  attempt.status = AttemptStatus.SUBMITTED;
  attempt.score = mcqScore;
  attempt.endTime = new Date();
  await attempt.save();

  const totalMarks = (attempt.quiz as any).totalMarks;

  return {
    message: 'Quiz submitted successfully',
    score: mcqScore,
    totalMarks,
    pendingGrading: hasSubjective,
  };
};

const gradeAttempt = async (attemptId: string, grades: { questionId: string; awardedMarks: number }[]) => {
  const attempt = await QuizAttempt.findById(attemptId).populate('quiz');
  if (!attempt) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Attempt not found');
  }

  if (attempt.status !== AttemptStatus.SUBMITTED) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Attempt has not been submitted yet');
  }

  let additionalScore = 0;

  for (const grade of grades) {
    const response = attempt.responses.find(
      (r) => r.questionId.toString() === grade.questionId.toString()
    );
    if (!response) {
      throw new ApiError(httpStatus.BAD_REQUEST, `Response for question ${grade.questionId} not found`);
    }

    const question = await Question.findById(grade.questionId);
    if (!question) {
      throw new ApiError(httpStatus.NOT_FOUND, `Question ${grade.questionId} not found`);
    }

    if (grade.awardedMarks > question.marks) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Awarded marks (${grade.awardedMarks}) cannot exceed question marks (${question.marks})`
      );
    }

    const previousMarks = response.awardedMarks || 0;
    response.awardedMarks = grade.awardedMarks;
    response.isGraded = true;
    additionalScore += grade.awardedMarks - previousMarks;
  }

  attempt.score = (attempt.score || 0) + additionalScore;
  await attempt.save();

  const allGraded = attempt.responses.every((r) => r.isGraded);

  return {
    message: allGraded ? 'All responses graded' : 'Partial grading saved',
    score: attempt.score,
    totalMarks: (attempt.quiz as any).totalMarks,
    allGraded,
  };
};

const getAttemptById = async (attemptId: string, userId: string, userRole: string) => {
  const attempt = await QuizAttempt.findById(attemptId)
    .populate('quiz', 'title totalMarks passMarks durationMinutes')
    .populate('student', 'name email');

  if (!attempt) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Attempt not found');
  }

  // Students can only view their own attempts
  if (userRole === 'STUDENT' && attempt.student._id.toString() !== userId) {
    throw new ApiError(httpStatus.FORBIDDEN, 'You can only view your own attempts');
  }

  // Lecturers can only view attempts for quizzes they created
  if (userRole === 'LECTURER') {
    const quiz = await Quiz.findById(attempt.quiz._id);
    if (!quiz || quiz.createdBy.toString() !== userId) {
      throw new ApiError(httpStatus.FORBIDDEN, 'You can only view attempts for your own quizzes');
    }
  }

  const obj = attempt.toJSON();
  return {
    ...obj,
    quiz: (attempt.quiz as any)?.toJSON?.() || attempt.quiz,
    student: (attempt.student as any)?.toJSON?.() || attempt.student,
  };
};

const getMyStats = async (studentId: string) => {
  const student = await User.findById(studentId);
  if (!student) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Student not found');
  }

  const attemptsDocs = await QuizAttempt.find({
    student: studentId,
    status: AttemptStatus.SUBMITTED,
  })
    .populate('quiz', 'title totalMarks passMarks')
    .sort({ startTime: -1 });

  const attempts = attemptsDocs.map((a) => {
    const quiz = a.quiz as any;
    return {
      id: a.id,
      quizTitle: quiz?.title || 'Unknown Quiz',
      score: a.score,
      totalMarks: quiz?.totalMarks || 0,
      percentage: quiz?.totalMarks
        ? parseFloat((((a.score || 0) / quiz.totalMarks) * 100).toFixed(2))
        : 0,
      passed: quiz?.passMarks ? (a.score || 0) >= quiz.passMarks : null,
      date: a.endTime,
    };
  });

  const totalAttempts = attempts.length;
  const averagePercentage =
    totalAttempts > 0
      ? parseFloat(
          (attempts.reduce((acc, a) => acc + a.percentage, 0) / totalAttempts).toFixed(2),
        )
      : 0;

  return {
    student: {
      id: student.id,
      name: student.name,
      email: student.email,
    },
    summary: {
      totalAttempts,
      averagePercentage,
      quizzesPassed: attempts.filter((a) => a.passed === true).length,
      quizzesFailed: attempts.filter((a) => a.passed === false).length,
    },
    attempts,
  };
};

const queryAttempts = async (
  filter: { quizId?: string; studentId?: string; status?: string },
  options: { page?: number; limit?: number; sortBy?: string },
  userId: string,
  userRole: string
) => {
  const where: any = {};

  // Role-based scoping
  if (userRole === 'STUDENT') {
    where.student = userId;
  } else if (userRole === 'LECTURER') {
    // Lecturer sees attempts for quizzes they created
    const lecturerQuizzes = await Quiz.find({ createdBy: userId }).select('_id');
    const quizIds = lecturerQuizzes.map((q) => q._id);
    where.quiz = { $in: quizIds };
  }
  // ADMIN sees all — no additional filter

  if (filter.quizId) {
    where.quiz = filter.quizId;
  }
  if (filter.studentId && userRole !== 'STUDENT') {
    where.student = filter.studentId;
  }
  if (filter.status) {
    where.status = filter.status;
  }

  const page = options.page ?? 1;
  const limit = options.limit ?? 10;
  const skip = (page - 1) * limit;

  let sort = '-submittedAt';
  if (options.sortBy) {
    const [field, order] = options.sortBy.split(':');
    sort = (order === 'desc' ? '-' : '') + field;
  }

  const attemptsDocs = await QuizAttempt.find(where)
    .populate('quiz', 'title totalMarks passMarks durationMinutes')
    .populate('student', 'name email')
    .sort(sort)
    .skip(skip)
    .limit(limit);

  const totalResults = await QuizAttempt.countDocuments(where);
  const totalPages = Math.ceil(totalResults / limit);

  const attempts = attemptsDocs.map((doc) => {
    const obj = doc.toJSON();
    return {
      ...obj,
      quiz: (doc.quiz as any)?.toJSON?.() || doc.quiz,
      student: (doc.student as any)?.toJSON?.() || doc.student,
    };
  });

  return { attempts, page, limit, totalPages, totalResults };
};

export default {
  listAvailableQuizzes,
  startAttempt,
  submitAttempt,
  gradeAttempt,
  queryAttempts,
  getAttemptById,
  getMyStats,
};
