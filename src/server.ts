import app from './app';
import config from './config/config';
import logger from './config/logger';
import mongoose from 'mongoose';
import seedAdmin from './seed';

let server: any;

const startServer = async () => {
    try {
        await mongoose.connect(config.mongoose.url, config.mongoose.options);
        logger.info('Connected to MongoDB');
        await seedAdmin();
        server = app.listen(config.port, () => {
            logger.info(`Listening to port ${config.port}`);
        });
    } catch (error) {
        logger.error(error);
        process.exit(1);
    }
};

startServer();

const exitHandler = () => {
    if (server) {
        server.close(() => {
            logger.info('Server closed');
            process.exit(1);
        });
    } else {
        process.exit(1);
    }
};

const unexpectedErrorHandler = (error: unknown) => {
    logger.error(error);
    exitHandler();
};

process.on('uncaughtException', unexpectedErrorHandler);
process.on('unhandledRejection', unexpectedErrorHandler);

process.on('SIGTERM', () => {
    logger.info('SIGTERM received');
    if (server) {
        server.close();
    }
});
