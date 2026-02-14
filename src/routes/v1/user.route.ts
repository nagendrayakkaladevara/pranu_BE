import express from 'express';
import auth from '../../middlewares/auth';
import validate from '../../middlewares/validate';
import userValidation from '../../validations/user.validation';
import userController from '../../controllers/user.controller';

const router = express.Router();

// User Management Routes (Admin Only)

// Route: POST /v1/users
// Description: Create a new user
// Route: GET /v1/users
// Description: List users with filtering and pagination
router
  .route('/')
  .post(auth('ADMIN'), validate(userValidation.createUser), userController.createUser)
  .get(auth('ADMIN'), validate(userValidation.getUsers), userController.getUsers);

// Route: GET /v1/users/:userId
// Description: Get specific user details
// Route: PATCH /v1/users/:userId
// Description: Update user details
// Route: DELETE /v1/users/:userId
// Description: Soft delete a user
router
  .route('/:userId')
  .get(auth('ADMIN'), validate(userValidation.getUser), userController.getUser)
  .patch(auth('ADMIN'), validate(userValidation.updateUser), userController.updateUser)
  .delete(auth('ADMIN'), validate(userValidation.deleteUser), userController.deleteUser);

export default router;
