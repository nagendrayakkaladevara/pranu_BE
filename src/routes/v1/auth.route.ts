import express from 'express';
import auth from '../../middlewares/auth';
import validate from '../../middlewares/validate';
import { authLimiter } from '../../middlewares/rateLimiter';
import authValidation from '../../validations/auth.validation';
import authController from '../../controllers/auth.controller';

const router = express.Router();

// Route: GET /v1/auth/me
// Description: Get the logged-in user's profile
router.get('/me', auth(), authController.getMe);

// Route: PATCH /v1/auth/me
// Description: Update the logged-in user's profile (name, email, password)
router.patch('/me', auth(), validate(authValidation.updateMe), authController.updateMe);

// Apply stricter rate limiting to auth endpoints below
router.use(authLimiter);

// Route: POST /v1/auth/register
// Description: Create a new user account (student/lecturer/admin)
router.post('/register', validate(authValidation.register), authController.register);

// Route: POST /v1/auth/login
// Description: Authenticate user and return access + refresh tokens
router.post('/login', validate(authValidation.login), authController.login);

// Route: POST /v1/auth/logout
// Description: Revoke refresh token (logout)
router.post('/logout', validate(authValidation.logout), authController.logout);

// Route: POST /v1/auth/refresh-tokens
// Description: Generate new access + refresh tokens using a valid refresh token
router.post('/refresh-tokens', validate(authValidation.refreshTokens), authController.refreshTokens);

export default router;
