import express from 'express';
import validate from '../../middlewares/validate';
import authValidation from '../../validations/auth.validation';
import authController from '../../controllers/auth.controller';

const router = express.Router();

// Route: POST /v1/auth/register
// Description: Create a new user account (student/lecturer/admin)
router.post('/register', validate(authValidation.register), authController.register);

// Route: POST /v1/auth/login
// Description: Authenticate user and return access token
router.post('/login', validate(authValidation.login), authController.login);

export default router;
