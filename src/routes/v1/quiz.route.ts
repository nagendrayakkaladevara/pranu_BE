import express from 'express';
import auth from '../../middlewares/auth';
import validate from '../../middlewares/validate';
import quizValidation from '../../validations/quiz.validation';
import quizController from '../../controllers/quiz.controller';

const router = express.Router();

// Quiz Management Routes (Lecturer/Admin)

// Route: POST /v1/quizzes
// Description: Create a new quiz draft
// Route: GET /v1/quizzes
// Description: List all quizzes
router
  .route('/')
  .post(auth('LECTURER', 'ADMIN'), validate(quizValidation.createQuiz), quizController.createQuiz)
  .get(auth('LECTURER', 'ADMIN'), validate(quizValidation.getQuizzes), quizController.getQuizzes);

// Route: GET /v1/quizzes/:quizId
// Description: Get quiz details with questions
// Route: PATCH /v1/quizzes/:quizId
// Description: Update quiz settings
// Route: DELETE /v1/quizzes/:quizId
// Description: Delete a quiz
router
  .route('/:quizId')
  .get(auth('LECTURER', 'ADMIN'), validate(quizValidation.getQuiz), quizController.getQuiz)
  .patch(auth('LECTURER', 'ADMIN'), validate(quizValidation.updateQuiz), quizController.updateQuiz)
  .delete(
    auth('LECTURER', 'ADMIN'),
    validate(quizValidation.deleteQuiz),
    quizController.deleteQuiz,
  );

// Route: POST /v1/quizzes/:quizId/questions
// Description: Add questions to a quiz
router.post(
  '/:quizId/questions',
  auth('LECTURER', 'ADMIN'),
  validate(quizValidation.addQuestions),
  quizController.addQuestions,
);

// Route: POST /v1/quizzes/:quizId/publish
// Description: Publish a quiz to specific classes
router.post(
  '/:quizId/publish',
  auth('LECTURER', 'ADMIN'),
  validate(quizValidation.publishQuiz),
  quizController.publishQuiz,
);

export default router;
