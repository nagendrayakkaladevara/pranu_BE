import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import httpStatus from 'http-status';
import { errorHandler, errorConverter } from './middlewares/error';
import routes from './routes';
import config from './config/config';

const app = express();

if (config.env !== 'test') {
    app.use(morgan('combined'));
}

// set security HTTP headers
app.use(helmet());

// parse json request body
app.use(express.json());

// parse urlencoded request body
app.use(express.urlencoded({ extended: true }));

// enable cors
app.use(cors());
app.options('*', cors());

// v1 api routes
app.use('/v1', routes);

// send back a 404 error for any unknown api request
app.use((req, res, next) => {
    res.status(httpStatus.NOT_FOUND).send({ message: 'Not Found' });
});

// convert error to ApiError, if needed
app.use(errorConverter);

// handle error
app.use(errorHandler);

export default app;
