import httpStatus from 'http-status';
import bcrypt from 'bcryptjs';
import tokenService from './token.service';
import userService from './user.service';
import { ApiError } from '../middlewares/error';

/**
 * Login with email and password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<User>}
 */
const loginUserWithEmailAndPassword = async (email: string, password: string) => {
  const user = await userService.getUserByEmail(email);
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect email or password');
  }
  return user;
};

export default {
  loginUserWithEmailAndPassword,
};
