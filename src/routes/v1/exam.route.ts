import express from 'express';
import auth from '../../middlewares/auth';
import validate from '../../middlewares/validate';
import examValidation from '../../validations/exam.validation';
import examController from '../../controllers/exam.controller';

const router = express.Router();

// Route: GET /v1/exam/attempts
// Description: List quiz attempts (scoped by role: student sees own, lecturer sees their quizzes, admin sees all)
router.get(
  '/attempts',
  auth('STUDENT', 'LECTURER', 'ADMIN'),
  validate(examValidation.getAttempts),
  examController.getAttempts,
);

// Route: GET /v1/exam/my-stats
// Description: Get the logged-in student's own performance stats
router.get('/my-stats', auth('STUDENT'), examController.getMyStats);

// Route: GET /v1/exam/attempts/:attemptId
// Description: Get a single attempt by ID (scoped by role)
router.get(
  '/attempts/:attemptId',
  auth('STUDENT', 'LECTURER', 'ADMIN'),
  validate(examValidation.getAttemptById),
  examController.getAttemptById,
);

// Student Routes

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

// Lecturer/Admin Routes

// Route: POST /v1/exam/attempts/:attemptId/grade
// Description: Grade subjective responses for an attempt
router.post(
  '/attempts/:attemptId/grade',
  auth('LECTURER', 'ADMIN'),
  validate(examValidation.gradeAttempt),
  examController.gradeAttempt,
);

export default router;
