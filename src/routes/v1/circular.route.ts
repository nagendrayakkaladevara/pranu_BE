import express from 'express';
import auth from '../../middlewares/auth';
import validate from '../../middlewares/validate';
import circularValidation from '../../validations/circular.validation';
import circularController from '../../controllers/circular.controller';

const router = express.Router();

// Circulars: Lecturers can create, update, delete. All authenticated users can read.
// Students see only circulars targeted to their classes/department/all.

// Route: POST /v1/circulars
// Description: Create a new circular/notice/announcement (Lecturer only)
router
  .route('/')
  .post(
    auth('LECTURER'),
    validate(circularValidation.createCircular),
    circularController.createCircular,
  )
  .get(
    auth('ADMIN', 'LECTURER', 'STUDENT'),
    validate(circularValidation.getCirculars),
    circularController.getCirculars,
  );

// Route: GET /v1/circulars/:circularId
// Description: Get circular by ID
// Route: PATCH /v1/circulars/:circularId
// Description: Update circular (Lecturer who published it only)
// Route: DELETE /v1/circulars/:circularId
// Description: Delete circular (Lecturer who published it only)
router
  .route('/:circularId')
  .get(
    auth('ADMIN', 'LECTURER', 'STUDENT'),
    validate(circularValidation.getCircular),
    circularController.getCircular,
  )
  .patch(
    auth('LECTURER'),
    validate(circularValidation.updateCircular),
    circularController.updateCircular,
  )
  .delete(
    auth('LECTURER'),
    validate(circularValidation.deleteCircular),
    circularController.deleteCircular,
  );

export default router;
