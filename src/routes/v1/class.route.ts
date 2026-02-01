import express from 'express';
import auth from '../../middlewares/auth';
import validate from '../../middlewares/validate';
import classValidation from '../../validations/class.validation';
import classController from '../../controllers/class.controller';

const router = express.Router();

// Class Management Routes

// Route: POST /v1/classes
// Description: Create a new class (Admin only)
// Route: GET /v1/classes
// Description: List all classes (Admin/Lecturer)
router
  .route('/')
  .post(auth('ADMIN'), validate(classValidation.createClass), classController.createClass)
  .get(auth('ADMIN', 'LECTURER'), validate(classValidation.getClasses), classController.getClasses);

// Route: GET /v1/classes/:classId
// Description: Get class details including students and lecturers
// Route: PATCH /v1/classes/:classId
// Description: Update class details (Admin only)
// Route: DELETE /v1/classes/:classId
// Description: Delete a class (Admin only)
router
  .route('/:classId')
  .get(
    auth('ADMIN', 'LECTURER', 'STUDENT'),
    validate(classValidation.getClass),
    classController.getClass,
  )
  .patch(auth('ADMIN'), validate(classValidation.updateClass), classController.updateClass)
  .delete(auth('ADMIN'), validate(classValidation.deleteClass), classController.deleteClass);

// Route: POST /v1/classes/:classId/students
// Description: Bulk assign students to a class
router.post(
  '/:classId/students',
  auth('ADMIN'),
  validate(classValidation.assignStudents),
  classController.assignStudents,
);

// Route: POST /v1/classes/:classId/lecturers
// Description: Assign lecturers to a class
router.post(
  '/:classId/lecturers',
  auth('ADMIN'),
  validate(classValidation.assignLecturers),
  classController.assignLecturers,
);

export default router;
