import httpStatus from 'http-status';
import { Request, Response } from 'express';
import catchAsync from '../utils/catchAsync';
import classService from '../services/class.service';

/**
 * Create a new class
 * @param req Request object containing class details
 * @param res Response object to send created class
 */
const createClass = catchAsync(async (req: Request, res: Response) => {
  const result = await classService.createClass(req.body);
  res.status(httpStatus.CREATED).send(result);
});

/**
 * Get all classes with optional filtering
 * @param req Request object containing query filters
 * @param res Response object to send list of classes
 */
const getClasses = catchAsync(async (req: Request, res: Response) => {
  const filter = {
    name: req.query.name ? String(req.query.name) : undefined,
    department: req.query.department ? String(req.query.department) : undefined,
  };
  const options = {
    limit: Number(req.query.limit) || 10,
    page: Number(req.query.page) || 1,
    sortBy: req.query.sortBy,
  };
  const result = await classService.queryClasses(filter, options);
  res.send(result);
});

/**
 * Get class details by ID
 * @param req Request object containing classId params
 * @param res Response object to send class details
 */
const getClass = catchAsync(async (req: Request, res: Response) => {
  const result = await classService.getClassById(Number(req.params.classId));
  if (!result) {
    res.status(httpStatus.NOT_FOUND).send({ message: 'Class not found' });
    return;
  }
  res.send(result);
});

/**
 * Update class details by ID
 * @param req Request object containing classId params and update body
 * @param res Response object to send updated class
 */
const updateClass = catchAsync(async (req: Request, res: Response) => {
  const result = await classService.updateClassById(Number(req.params.classId), req.body);
  res.send(result);
});

/**
 * Delete class by ID
 * @param req Request object containing classId params
 * @param res Response object (No Content)
 */
const deleteClass = catchAsync(async (req: Request, res: Response) => {
  await classService.deleteClassById(Number(req.params.classId));
  res.status(httpStatus.NO_CONTENT).send();
});

/**
 * Assign students to a class
 * @param req Request object containing classId params and list of student IDs
 * @param res Response object to send updated class
 */
const assignStudents = catchAsync(async (req: Request, res: Response) => {
  const result = await classService.assignStudentsToClass(
    Number(req.params.classId),
    req.body.studentIds,
  );
  res.send(result);
});

/**
 * Assign lecturers to a class
 * @param req Request object containing classId params and list of lecturer IDs
 * @param res Response object to send updated class
 */
const assignLecturers = catchAsync(async (req: Request, res: Response) => {
  const result = await classService.assignLecturersToClass(
    Number(req.params.classId),
    req.body.lecturerIds,
  );
  res.send(result);
});

export default {
  createClass,
  getClasses,
  getClass,
  updateClass,
  deleteClass,
  assignStudents,
  assignLecturers,
};
