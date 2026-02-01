import express from 'express';
import auth from '../../middlewares/auth';
import validate from '../../middlewares/validate';
import examValidation from '../../validations/exam.validation';
import examController from '../../controllers/exam.controller';

const router = express.Router();

router.get('/quizzes', auth('STUDENT'), examController.listQuizzes);

router.post(
    '/quizzes/:quizId/start',
    auth('STUDENT'),
    validate(examValidation.startAttempt),
    examController.startAttempt
);

router.post(
    '/attempts/:attemptId/submit',
    auth('STUDENT'),
    validate(examValidation.submitAttempt),
    examController.submitAttempt
);

export default router;
