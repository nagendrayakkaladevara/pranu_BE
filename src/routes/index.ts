import express from 'express';
import authRoute from './v1/auth.route';
import userRoute from './v1/user.route';
import classRoute from './v1/class.route';
import questionRoute from './v1/question.route';
import quizRoute from './v1/quiz.route';
import examRoute from './v1/exam.route';
import analyticsRoute from './v1/analytics.route';

const router = express.Router();

router.get('/health', (req, res) => {
    res.send({ status: 'ok', timestamp: new Date().toISOString(), message: 'Server is running', data: { version: '1.0.0' } });
});

router.use('/auth', authRoute);
router.use('/users', userRoute);
router.use('/classes', classRoute);
router.use('/questions', questionRoute);
router.use('/quizzes', quizRoute);
router.use('/exam', examRoute);
router.use('/analytics', analyticsRoute);

export default router;
