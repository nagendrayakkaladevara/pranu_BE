import httpStatus from 'http-status';
import { Request, Response } from 'express';
import catchAsync from '../utils/catchAsync';
import classService from '../services/class.service';

const createClass = catchAsync(async (req: Request, res: Response) => {
  const result = await classService.createClass(req.body);
  res.status(httpStatus.CREATED).send(result);
});

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

const getClass = catchAsync(async (req: Request, res: Response) => {
  const result = await classService.getClassById(Number(req.params.classId));
  if (!result) {
    res.status(httpStatus.NOT_FOUND).send({ message: 'Class not found' });
    return;
  }
  res.send(result);
});

const updateClass = catchAsync(async (req: Request, res: Response) => {
  const result = await classService.updateClassById(Number(req.params.classId), req.body);
  res.send(result);
});

const deleteClass = catchAsync(async (req: Request, res: Response) => {
  await classService.deleteClassById(Number(req.params.classId));
  res.status(httpStatus.NO_CONTENT).send();
});

const assignStudents = catchAsync(async (req: Request, res: Response) => {
  const result = await classService.assignStudentsToClass(
    Number(req.params.classId),
    req.body.studentIds,
  );
  res.send(result);
});

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
