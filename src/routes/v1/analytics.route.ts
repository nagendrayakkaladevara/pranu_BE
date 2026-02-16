import express from 'express';
import auth from '../../middlewares/auth';
import validate from '../../middlewares/validate';
import analyticsValidation from '../../validations/analytics.validation';
import analyticsController from '../../controllers/analytics.controller';

const router = express.Router();

// Route: GET /v1/analytics/results/:quizId
// Description: View statistics and results for a specific quiz
router.get(
  '/results/:quizId',
  auth('ADMIN', 'LECTURER'),
  validate(analyticsValidation.getQuizResults),
  analyticsController.getQuizResults,
);

// Route: GET /v1/analytics/student/:studentId
// Description: View performance history for a specific student
router.get(
  '/student/:studentId',
  auth('ADMIN', 'LECTURER'),
  validate(analyticsValidation.getStudentStats),
  analyticsController.getStudentStats,
);

// Route: GET /v1/analytics/questions/:quizId
// Description: View question-wise analysis for a quiz
router.get(
  '/questions/:quizId',
  auth('ADMIN', 'LECTURER'),
  validate(analyticsValidation.getQuestionAnalysis),
  analyticsController.getQuestionAnalysis,
);

// Route: GET /v1/analytics/difficulty/:quizId
// Description: View difficulty-wise performance breakdown for a quiz
router.get(
  '/difficulty/:quizId',
  auth('ADMIN', 'LECTURER'),
  validate(analyticsValidation.getDifficultyAnalysis),
  analyticsController.getDifficultyAnalysis,
);

export default router;
