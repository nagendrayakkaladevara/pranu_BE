import httpStatus from 'http-status';
import { Request, Response } from 'express';
import catchAsync from '../utils/catchAsync';
import circularService from '../services/circular.service';

/**
 * Create a new circular/notice/announcement (Lecturer only)
 */
const createCircular = catchAsync(async (req: Request, res: Response) => {
  const result = await circularService.createCircular(req.body, req.user!.id);
  res.status(httpStatus.CREATED).send(result);
});

/**
 * Get all circulars with optional filtering
 * Students see only circulars relevant to their classes/department
 */
const getCirculars = catchAsync(async (req: Request, res: Response) => {
  const filter: any = {
    type: req.query.type,
    targetType: req.query.targetType,
    targetClassId: req.query.targetClassId,
    targetDepartment: req.query.targetDepartment,
    priority: req.query.priority,
    isPinned: req.query.isPinned,
    myOnly: req.query.myOnly,
  };
  const options = {
    limit: Number(req.query.limit) || 10,
    page: Number(req.query.page) || 1,
    sortBy: req.query.sortBy,
  };
  const result = await circularService.queryCirculars(
    filter,
    options,
    req.user!.id,
    req.user!.role,
  );
  res.send(result);
});

/**
 * Get circular by ID
 */
const getCircular = catchAsync(async (req: Request, res: Response) => {
  const result = await circularService.getCircularById(
    req.params.circularId,
    req.user!.id,
    req.user!.role,
  );
  if (!result) {
    res.status(httpStatus.NOT_FOUND).send({ message: 'Circular not found' });
    return;
  }
  res.send(result);
});

/**
 * Update circular (Lecturer who published it only)
 */
const updateCircular = catchAsync(async (req: Request, res: Response) => {
  const result = await circularService.updateCircularById(
    req.params.circularId,
    req.body,
    req.user!.id,
  );
  res.send(result);
});

/**
 * Delete circular (Lecturer who published it only)
 */
const deleteCircular = catchAsync(async (req: Request, res: Response) => {
  await circularService.deleteCircularById(req.params.circularId, req.user!.id);
  res.status(httpStatus.NO_CONTENT).send();
});

export default {
  createCircular,
  getCirculars,
  getCircular,
  updateCircular,
  deleteCircular,
};
