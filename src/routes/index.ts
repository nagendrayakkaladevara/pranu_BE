import express from 'express';
// import route implementation modules here

const router = express.Router();

router.get('/health', (req, res) => {
    res.send({ status: 'ok', timestamp: new Date().toISOString() });
});

// router.use('/users', userRoute);

export default router;
