import jwt from 'jsonwebtoken';
import moment from 'moment';
import config from '../config/config';
import { User } from '@prisma/client';

const generateToken = (userId: number, expires: moment.Moment, secret = config.jwt.secret) => {
    const payload = {
        sub: userId,
        iat: moment().unix(),
        exp: expires.unix(),
    };
    return jwt.sign(payload, secret);
};

const generateAuthTokens = async (user: User) => {
    const accessTokenExpires = moment().add(config.jwt.accessExpirationMinutes, 'minutes');
    const accessToken = generateToken(user.id, accessTokenExpires);

    return {
        access: {
            token: accessToken,
            expires: accessTokenExpires.toDate(),
        },
    };
};

export default {
    generateToken,
    generateAuthTokens,
};
