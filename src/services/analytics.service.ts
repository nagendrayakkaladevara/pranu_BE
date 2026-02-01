import httpStatus from 'http-status';
import prisma from '../client';
import { ApiError } from '../middlewares/error';
import { AttemptStatus } from '@prisma/client';

/**
 * Get quiz results and statistics
 * @param {number} quizId
 * @returns {Promise<Object>}
 */
const getQuizResults = async (quizId: number) => {
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: {
      questions: true,
    },
  });

  if (!quiz) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Quiz not found');
  }

  const attempts = await prisma.quizAttempt.findMany({
    where: {
      quizId,
      status: AttemptStatus.SUBMITTED,
    },
    include: {
      student: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: { score: 'desc' },
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
 * @param {number} studentId
 * @returns {Promise<Object>}
 */
const getStudentStats = async (studentId: number) => {
  const student = await prisma.user.findUnique({
    where: { id: studentId },
  });

  if (!student) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Student not found');
  }

  const attempts = await prisma.quizAttempt.findMany({
    where: {
      studentId,
      status: AttemptStatus.SUBMITTED,
    },
    include: {
      quiz: {
        select: { title: true, totalMarks: true, passMarks: true },
      },
    },
    orderBy: { startTime: 'desc' },
  });

  return {
    student: {
      id: student.id,
      name: student.name,
      email: student.email,
    },
    attempts: attempts.map((a) => ({
      id: a.id,
      quizTitle: a.quiz.title,
      score: a.score,
      totalMarks: a.quiz.totalMarks,
      passed: a.quiz.passMarks ? (a.score || 0) >= a.quiz.passMarks : null,
      date: a.endTime,
    })),
  };
};

export default {
  getQuizResults,
  getStudentStats,
};
