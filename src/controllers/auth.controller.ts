import httpStatus from 'http-status';
import { Request, Response } from 'express';
import catchAsync from '../utils/catchAsync';
import authService from '../services/auth.service';
import userService from '../services/user.service';
import tokenService from '../services/token.service';

const register = catchAsync(async (req: Request, res: Response) => {
  const user = await userService.createUser(req.body);
  const tokens = await tokenService.generateAuthTokens(user);
  res.status(httpStatus.CREATED).send({ user, tokens });
});

const login = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = await authService.loginUserWithEmailAndPassword(email, password);
  const tokens = await tokenService.generateAuthTokens(user);
  res.send({ user, tokens });
});

const logout = catchAsync(async (req: Request, res: Response) => {
  await authService.logout(req.body.refreshToken);
  res.status(httpStatus.NO_CONTENT).send();
});

const refreshTokens = catchAsync(async (req: Request, res: Response) => {
  const { user, tokens } = await authService.refreshAuth(req.body.refreshToken);
  res.send({ user, tokens });
});

const getMe = catchAsync(async (req: Request, res: Response) => {
  const user = await userService.getUserById(req.user.id);
  if (!user) {
    res.status(httpStatus.NOT_FOUND).send({ message: 'User not found' });
    return;
  }
  res.send(user);
});

const updateMe = catchAsync(async (req: Request, res: Response) => {
  const user = await userService.updateUserById(req.user.id, req.body);
  res.send(user);
});

export default {
  register,
  login,
  logout,
  refreshTokens,
  getMe,
  updateMe,
};
