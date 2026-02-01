import express from 'express';
import auth from '../../middlewares/auth';
import validate from '../../middlewares/validate';
import classValidation from '../../validations/class.validation';
import classController from '../../controllers/class.controller';

const router = express.Router();

router
    .route('/')
    .post(auth('ADMIN'), validate(classValidation.createClass), classController.createClass)
    .get(auth('ADMIN', 'LECTURER'), validate(classValidation.getClasses), classController.getClasses);

router
    .route('/:classId')
    .get(auth('ADMIN', 'LECTURER', 'STUDENT'), validate(classValidation.getClass), classController.getClass)
    .patch(auth('ADMIN'), validate(classValidation.updateClass), classController.updateClass)
    .delete(auth('ADMIN'), validate(classValidation.deleteClass), classController.deleteClass);

router.post(
    '/:classId/students',
    auth('ADMIN'),
    validate(classValidation.assignStudents),
    classController.assignStudents
);

router.post(
    '/:classId/lecturers',
    auth('ADMIN'),
    validate(classValidation.assignLecturers),
    classController.assignLecturers
);

export default router;
