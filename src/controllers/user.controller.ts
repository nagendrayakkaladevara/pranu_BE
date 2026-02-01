import httpStatus from 'http-status';
import { Request, Response } from 'express';
import userService from '../services/user.service';
import catchAsync from '../utils/catchAsync';

const createUser = catchAsync(async (req: Request, res: Response) => {
  const user = await userService.apiCreateUser(req.body);
  res.status(httpStatus.CREATED).send(user);
});

const getUsers = catchAsync(async (req: Request, res: Response) => {
  const filter = {
    role: req.query.role ? String(req.query.role) : undefined,
    name: req.query.name ? String(req.query.name) : undefined,
  };
  const options = {
    limit: Number(req.query.limit) || 10,
    page: Number(req.query.page) || 1,
    sortBy: req.query.sortBy,
  };
  const result = await userService.queryUsers(filter, options);
  res.send(result);
});

/**
 * Get a single user by ID
 * @param req Request object containing userId params
 * @param res Response object to send user details
 */
const getUser = catchAsync(async (req: Request, res: Response) => {
  const user = await userService.getUserById(Number(req.params.userId));
  if (!user) {
    res.status(httpStatus.NOT_FOUND).send({ message: 'User not found' });
    return;
  }
  res.send(user);
});

/**
 * Update user details by ID
 * @param req Request object containing userId params and update body
 * @param res Response object to send updated user
 */
const updateUser = catchAsync(async (req: Request, res: Response) => {
  const user = await userService.updateUserById(Number(req.params.userId), req.body);
  res.send(user);
});

/**
 * Delete user by ID
 * @param req Request object containing userId params
 * @param res Response object (No Content)
 */
const deleteUser = catchAsync(async (req: Request, res: Response) => {
  await userService.deleteUserById(Number(req.params.userId));
  res.status(httpStatus.NO_CONTENT).send();
});

export default {
  createUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
};
