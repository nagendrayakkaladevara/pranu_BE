import jwt from 'jsonwebtoken';
import moment from 'moment';
import httpStatus from 'http-status';
import config from '../config/config';
import Token, { TokenType } from '../models/token.model';
import { IUser } from '../models/user.model';
import { ApiError } from '../middlewares/error';

const generateToken = (userId: string, expires: moment.Moment, type: string, secret = config.jwt.secret) => {
  const payload = {
    sub: userId,
    iat: moment().unix(),
    exp: expires.unix(),
    type,
  };
  return jwt.sign(payload, secret);
};

const saveToken = async (token: string, userId: string, expires: moment.Moment, type: TokenType) => {
  const tokenDoc = await Token.create({
    token,
    user: userId,
    type,
    expires: expires.toDate(),
  });
  return tokenDoc;
};

const verifyToken = async (token: string, type: TokenType) => {
  const payload = jwt.verify(token, config.jwt.secret) as jwt.JwtPayload;
  const tokenDoc = await Token.findOne({
    token,
    type,
    user: payload.sub,
    blacklisted: false,
  });
  if (!tokenDoc) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Token not found');
  }
  return tokenDoc;
};

const generateAuthTokens = async (user: IUser) => {
  const accessTokenExpires = moment().add(config.jwt.accessExpirationMinutes, 'minutes');
  const accessToken = generateToken(user._id.toString(), accessTokenExpires, TokenType.ACCESS);

  const refreshTokenExpires = moment().add(config.jwt.refreshExpirationDays, 'days');
  const refreshToken = generateToken(user._id.toString(), refreshTokenExpires, TokenType.REFRESH);
  await saveToken(refreshToken, user._id.toString(), refreshTokenExpires, TokenType.REFRESH);

  return {
    access: {
      token: accessToken,
      expires: accessTokenExpires.toDate(),
    },
    refresh: {
      token: refreshToken,
      expires: refreshTokenExpires.toDate(),
    },
  };
};

export default {
  generateToken,
  saveToken,
  verifyToken,
  generateAuthTokens,
};
