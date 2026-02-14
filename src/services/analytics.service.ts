
import httpStatus from 'http-status';
import Quiz from '../models/quiz.model';
import QuizAttempt, { AttemptStatus } from '../models/attempt.model';
import User from '../models/user.model';
import { ApiError } from '../middlewares/error';

/**
 * Get quiz results and statistics
 * @param {string} quizId
 * @returns {Promise<Object>}
 */
const getQuizResults = async (quizId: string) => {
  const quiz = await Quiz.findById(quizId).populate('questions');

  if (!quiz) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Quiz not found');
  }

  const attemptsDocs = await QuizAttempt.find({
    quiz: quizId,
    status: AttemptStatus.SUBMITTED,
  })
    .populate('student', 'id name email')
    .sort({ score: -1 });

  // Map to include student properly (toJSON handles _id -> id)
  const attempts = attemptsDocs.map((doc) => {
    const obj = doc.toJSON();
    // student is populated
    return {
      ...obj,
      student: (doc.student as any).toJSON(),
    };
  });

  // Calculate Statistics
  const totalAttempts = attempts.length;
  const averageScore =
    totalAttempts > 0
      ? attempts.reduce((acc: number, curr: any) => acc + (curr.score || 0), 0) / totalAttempts
      : 0;

  const highestScore = totalAttempts > 0 ? Math.max(...attempts.map((a: any) => a.score || 0)) : 0;

  const passedCount = quiz.passMarks
    ? attempts.filter((a: any) => (a.score || 0) >= (quiz.passMarks || 0)).length
    : 0;

  return {
    quiz: {
      title: quiz.title,
      totalMarks: quiz.totalMarks,
      passMarks: quiz.passMarks,
    },
    stats: {
      totalAttempts,
      averageScore: parseFloat(averageScore.toFixed(2)),
      highestScore,
      passedCount,
      passRate:
        totalAttempts > 0 ? parseFloat(((passedCount / totalAttempts) * 100).toFixed(2)) : 0,
    },
    results: attempts,
  };
};

/**
 * Get student statistics
 * @param {string} studentId
 * @returns {Promise<Object>}
 */
const getStudentStats = async (studentId: string) => {
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

  return {
    student: {
      id: student.id,
      name: student.name,
      email: student.email,
    },
    attempts: attemptsDocs.map((a) => {
      const quiz = (a.quiz as any);
      return {
        id: a.id,
        quizTitle: quiz?.title || 'Unknown Quiz',
        score: a.score,
        totalMarks: quiz?.totalMarks || 0,
        passed: quiz?.passMarks ? (a.score || 0) >= quiz.passMarks : null,
        date: a.endTime,
      };
    }),
  };
};

export default {
  getQuizResults,
  getStudentStats,
};
