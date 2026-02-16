import httpStatus from 'http-status';
import bcrypt from 'bcryptjs';
import tokenService from './token.service';
import userService from './user.service';
import Token, { TokenType } from '../models/token.model';
import { ApiError } from '../middlewares/error';

const loginUserWithEmailAndPassword = async (email: string, password: string) => {
  const user = await userService.getUserByEmail(email);
  if (!user || !user.password || !(await bcrypt.compare(password, user.password))) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect email or password');
  }
  return user;
};

const logout = async (refreshToken: string) => {
  const tokenDoc = await Token.findOne({
    token: refreshToken,
    type: TokenType.REFRESH,
    blacklisted: false,
  });
  if (!tokenDoc) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Token not found');
  }
  await tokenDoc.deleteOne();
};

const refreshAuth = async (refreshToken: string) => {
  const refreshTokenDoc = await tokenService.verifyToken(refreshToken, TokenType.REFRESH);
  const user = await userService.getUserById(refreshTokenDoc.user.toString());
  if (!user) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'User not found');
  }
  await refreshTokenDoc.deleteOne();
  const tokens = await tokenService.generateAuthTokens(user);
  return { user, tokens };
};

export default {
  loginUserWithEmailAndPassword,
  logout,
  refreshAuth,
};
