import httpStatus from 'http-status';
import Quiz from '../models/quiz.model';
import QuizAttempt, { AttemptStatus } from '../models/attempt.model';
import Question from '../models/question.model';
import User from '../models/user.model';
import { ApiError } from '../middlewares/error';

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

  const attempts = attemptsDocs.map((doc) => {
    const obj = doc.toJSON();
    return {
      ...obj,
      student: (doc.student as any).toJSON(),
    };
  });

  const totalAttempts = attempts.length;
  const averageScore =
    totalAttempts > 0
      ? attempts.reduce((acc: number, curr: any) => acc + (curr.score || 0), 0) / totalAttempts
      : 0;

  const highestScore = totalAttempts > 0 ? Math.max(...attempts.map((a: any) => a.score || 0)) : 0;
  const lowestScore = totalAttempts > 0 ? Math.min(...attempts.map((a: any) => a.score || 0)) : 0;

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
      lowestScore,
      passedCount,
      failedCount: totalAttempts - passedCount,
      passRate:
        totalAttempts > 0 ? parseFloat(((passedCount / totalAttempts) * 100).toFixed(2)) : 0,
    },
    results: attempts,
  };
};

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

  const attempts = attemptsDocs.map((a) => {
    const quiz = a.quiz as any;
    return {
      id: a.id,
      quizTitle: quiz?.title || 'Unknown Quiz',
      score: a.score,
      totalMarks: quiz?.totalMarks || 0,
      percentage: quiz?.totalMarks ? parseFloat((((a.score || 0) / quiz.totalMarks) * 100).toFixed(2)) : 0,
      passed: quiz?.passMarks ? (a.score || 0) >= quiz.passMarks : null,
      date: a.endTime,
    };
  });

  const totalAttempts = attempts.length;
  const averagePercentage =
    totalAttempts > 0
      ? parseFloat(
          (attempts.reduce((acc, a) => acc + a.percentage, 0) / totalAttempts).toFixed(2)
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

const getQuestionAnalysis = async (quizId: string) => {
  const quiz = await Quiz.findById(quizId).populate('questions');
  if (!quiz) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Quiz not found');
  }

  const attempts = await QuizAttempt.find({
    quiz: quizId,
    status: AttemptStatus.SUBMITTED,
  });

  const totalAttempts = attempts.length;
  if (totalAttempts === 0) {
    return { quiz: { title: quiz.title }, questions: [], totalAttempts: 0 };
  }

  const questions = quiz.questions as any[];
  const analysis = questions.map((q) => {
    let correctCount = 0;
    let attemptedCount = 0;
    let totalAwarded = 0;

    for (const attempt of attempts) {
      const response = attempt.responses.find(
        (r) => r.questionId.toString() === q._id.toString()
      );
      if (response) {
        attemptedCount++;
        if (response.isGraded && response.awardedMarks) {
          totalAwarded += response.awardedMarks;
          if (response.awardedMarks === q.marks) {
            correctCount++;
          }
        }
      }
    }

    return {
      questionId: q._id,
      text: q.text,
      type: q.type,
      difficulty: q.difficulty,
      marks: q.marks,
      attemptedCount,
      correctCount,
      correctRate: attemptedCount > 0 ? parseFloat(((correctCount / attemptedCount) * 100).toFixed(2)) : 0,
      averageMarks: attemptedCount > 0 ? parseFloat((totalAwarded / attemptedCount).toFixed(2)) : 0,
    };
  });

  return {
    quiz: { title: quiz.title },
    totalAttempts,
    questions: analysis,
  };
};

const getDifficultyAnalysis = async (quizId: string) => {
  const quiz = await Quiz.findById(quizId).populate('questions');
  if (!quiz) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Quiz not found');
  }

  const attempts = await QuizAttempt.find({
    quiz: quizId,
    status: AttemptStatus.SUBMITTED,
  });

  const totalAttempts = attempts.length;
  const questions = quiz.questions as any[];

  const difficultyMap: Record<string, { total: number; correct: number; attempted: number; totalMarks: number; awardedMarks: number }> = {};

  for (const q of questions) {
    const difficulty = q.difficulty || 'MEDIUM';
    if (!difficultyMap[difficulty]) {
      difficultyMap[difficulty] = { total: 0, correct: 0, attempted: 0, totalMarks: 0, awardedMarks: 0 };
    }
    difficultyMap[difficulty].total++;
    difficultyMap[difficulty].totalMarks += q.marks;

    for (const attempt of attempts) {
      const response = attempt.responses.find(
        (r) => r.questionId.toString() === q._id.toString()
      );
      if (response) {
        difficultyMap[difficulty].attempted++;
        if (response.isGraded && response.awardedMarks) {
          difficultyMap[difficulty].awardedMarks += response.awardedMarks;
          if (response.awardedMarks === q.marks) {
            difficultyMap[difficulty].correct++;
          }
        }
      }
    }
  }

  const analysis = Object.entries(difficultyMap).map(([difficulty, data]) => ({
    difficulty,
    questionCount: data.total,
    totalMarks: data.totalMarks,
    correctRate: data.attempted > 0 ? parseFloat(((data.correct / data.attempted) * 100).toFixed(2)) : 0,
    averageScore: data.attempted > 0 ? parseFloat((data.awardedMarks / data.attempted).toFixed(2)) : 0,
  }));

  return {
    quiz: { title: quiz.title },
    totalAttempts,
    difficultyBreakdown: analysis,
  };
};

export default {
  getQuizResults,
  getStudentStats,
  getQuestionAnalysis,
  getDifficultyAnalysis,
};
