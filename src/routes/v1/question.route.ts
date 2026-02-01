import express from 'express';
import auth from '../../middlewares/auth';
import validate from '../../middlewares/validate';
import questionValidation from '../../validations/question.validation';
import questionController from '../../controllers/question.controller';

const router = express.Router();

// Question Bank Routes (Lecturer/Admin)

// Route: POST /v1/questions
// Description: Add a new question to the bank
// Route: GET /v1/questions
// Description: List questions with filters
router
  .route('/')
  .post(
    auth('LECTURER', 'ADMIN'),
    validate(questionValidation.createQuestion),
    questionController.createQuestion,
  )
  .get(
    auth('LECTURER', 'ADMIN'),
    validate(questionValidation.getQuestions),
    questionController.getQuestions,
  );

// Route: GET /v1/questions/:questionId
// Description: Get specific question details
// Route: PATCH /v1/questions/:questionId
// Description: Update a question and its options
// Route: DELETE /v1/questions/:questionId
// Description: Delete a question
router
  .route('/:questionId')
  .get(
    auth('LECTURER', 'ADMIN'),
    validate(questionValidation.getQuestion),
    questionController.getQuestion,
  )
  .patch(
    auth('LECTURER', 'ADMIN'),
    validate(questionValidation.updateQuestion),
    questionController.updateQuestion,
  )
  .delete(
    auth('LECTURER', 'ADMIN'),
    validate(questionValidation.deleteQuestion),
    questionController.deleteQuestion,
  );

export default router;
