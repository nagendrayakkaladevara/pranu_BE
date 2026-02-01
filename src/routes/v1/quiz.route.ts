import express from 'express';
import auth from '../../middlewares/auth';
import validate from '../../middlewares/validate';
import quizValidation from '../../validations/quiz.validation';
import quizController from '../../controllers/quiz.controller';

const router = express.Router();

router
    .route('/')
    .post(auth('LECTURER', 'ADMIN'), validate(quizValidation.createQuiz), quizController.createQuiz)
    .get(auth('LECTURER', 'ADMIN'), validate(quizValidation.getQuizzes), quizController.getQuizzes);

router
    .route('/:quizId')
    .get(auth('LECTURER', 'ADMIN'), validate(quizValidation.getQuiz), quizController.getQuiz)
    .patch(auth('LECTURER', 'ADMIN'), validate(quizValidation.updateQuiz), quizController.updateQuiz)
    .delete(auth('LECTURER', 'ADMIN'), validate(quizValidation.deleteQuiz), quizController.deleteQuiz);

router.post(
    '/:quizId/questions',
    auth('LECTURER', 'ADMIN'),
    validate(quizValidation.addQuestions),
    quizController.addQuestions
);

router.post(
    '/:quizId/publish',
    auth('LECTURER', 'ADMIN'),
    validate(quizValidation.publishQuiz),
    quizController.publishQuiz
);

export default router;
