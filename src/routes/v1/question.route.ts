import express from 'express';
import auth from '../../middlewares/auth';
import validate from '../../middlewares/validate';
import questionValidation from '../../validations/question.validation';
import questionController from '../../controllers/question.controller';

const router = express.Router();

router
    .route('/')
    .post(auth('LECTURER', 'ADMIN'), validate(questionValidation.createQuestion), questionController.createQuestion)
    .get(auth('LECTURER', 'ADMIN'), validate(questionValidation.getQuestions), questionController.getQuestions);

router
    .route('/:questionId')
    .get(auth('LECTURER', 'ADMIN'), validate(questionValidation.getQuestion), questionController.getQuestion)
    .patch(auth('LECTURER', 'ADMIN'), validate(questionValidation.updateQuestion), questionController.updateQuestion)
    .delete(auth('LECTURER', 'ADMIN'), validate(questionValidation.deleteQuestion), questionController.deleteQuestion);

export default router;
