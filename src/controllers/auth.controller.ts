import httpStatus from 'http-status';
import { Request, Response } from 'express';
import catchAsync from '../utils/catchAsync';
import authService from '../services/auth.service';
import userService from '../services/user.service';
import tokenService from '../services/token.service';

/**
 * Register a new user
 * @param req Request object containing user registration details
 * @param res Response object to send created user and access tokens
 */
const register = catchAsync(async (req: Request, res: Response) => {
  const user = await userService.createUser(req.body);
  const tokens = await tokenService.generateAuthTokens(user);
  res.status(httpStatus.CREATED).send({ user, tokens });
});

/**
 * Login user
 * @param req Request object containing email and password
 * @param res Response object to send user details and access tokens
 */
const login = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = await authService.loginUserWithEmailAndPassword(email, password);
  const tokens = await tokenService.generateAuthTokens(user);
  res.send({ user, tokens });
});

export default {
  register,
  login,
};
