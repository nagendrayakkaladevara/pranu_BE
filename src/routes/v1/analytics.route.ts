import express from 'express';
import auth from '../../middlewares/auth';
import validate from '../../middlewares/validate';
import analyticsValidation from '../../validations/analytics.validation';
import analyticsController from '../../controllers/analytics.controller';

const router = express.Router();

router.get(
    '/results/:quizId',
    auth('ADMIN', 'LECTURER'),
    validate(analyticsValidation.getQuizResults),
    analyticsController.getQuizResults
);

router.get(
    '/student/:studentId',
    auth('ADMIN', 'LECTURER'),
    validate(analyticsValidation.getStudentStats),
    analyticsController.getStudentStats
);

export default router;
