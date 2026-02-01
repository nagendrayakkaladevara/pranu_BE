import httpStatus from 'http-status';
import { Request, Response } from 'express';
import authService from '../services/auth.service';
import userService from '../services/user.service';
import tokenService from '../services/token.service';

const register = async (req: Request, res: Response) => {
  const user = await userService.createUser(req.body);
  const tokens = await tokenService.generateAuthTokens(user);
  res.status(httpStatus.CREATED).send({ user, tokens });
};

const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = await authService.loginUserWithEmailAndPassword(email, password);
  const tokens = await tokenService.generateAuthTokens(user);
  res.send({ user, tokens });
};

export default {
  register,
  login,
};
