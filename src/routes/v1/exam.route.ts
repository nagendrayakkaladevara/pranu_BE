import express from 'express';
import auth from '../../middlewares/auth';
import validate from '../../middlewares/validate';
import examValidation from '../../validations/exam.validation';
import examController from '../../controllers/exam.controller';

const router = express.Router();

// Exam Routes (Student)

// Route: GET /v1/exam/quizzes
// Description: List available quizzes for the student
router.get('/quizzes', auth('STUDENT'), examController.listQuizzes);

// Route: POST /v1/exam/quizzes/:quizId/start
// Description: Start a quiz attempt
router.post(
  '/quizzes/:quizId/start',
  auth('STUDENT'),
  validate(examValidation.startAttempt),
  examController.startAttempt,
);

// Route: POST /v1/exam/attempts/:attemptId/submit
// Description: Submit quiz answers
router.post(
  '/attempts/:attemptId/submit',
  auth('STUDENT'),
  validate(examValidation.submitAttempt),
  examController.submitAttempt,
);

export default router;
