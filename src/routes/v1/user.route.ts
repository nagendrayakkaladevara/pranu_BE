import express from 'express';
import auth from '../../middlewares/auth';
import validate from '../../middlewares/validate';
import userValidation from '../../validations/user.validation';
import userController from '../../controllers/user.controller';

const router = express.Router();

router
    .route('/')
    .post(auth('ADMIN'), validate(userValidation.createUser), userController.createUser)
    .get(auth('ADMIN'), validate(userValidation.getUsers), userController.getUsers);

router
    .route('/:userId')
    .get(auth('ADMIN'), validate(userValidation.getUser), userController.getUser)
    .patch(auth('ADMIN'), validate(userValidation.updateUser), userController.updateUser)
    .delete(auth('ADMIN'), validate(userValidation.deleteUser), userController.deleteUser);

export default router;
