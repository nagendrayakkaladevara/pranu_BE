import express from 'express';
// import route implementation modules here

const router = express.Router();

router.get('/health', (req, res) => {
    res.send({ status: 'ok', timestamp: new Date().toISOString(), message: 'Server is running', data: { version: '1.0.0' } });
});

// router.use('/users', userRoute);

export default router;
