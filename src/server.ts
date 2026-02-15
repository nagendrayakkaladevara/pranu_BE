import app from './app';
import config from './config/config';
import logger from './config/logger';
import mongoose from 'mongoose';
import seedAdmin from './seed';

let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;
  try {
    await mongoose.connect(config.mongoose.url, config.mongoose.options);
    isConnected = true;
    logger.info('Connected to MongoDB');
    await seedAdmin();
  } catch (error) {
    logger.error(error);
    throw error;
  }
};

// For local development
if (config.env !== 'production') {
  const startServer = async () => {
    await connectDB();
    app.listen(config.port, () => {
      logger.info(`Listening to port ${config.port}`);
    });
  };
  startServer();
}

// For Vercel serverless: connect to DB on each cold start, then handle request
const handler = async (req: any, res: any) => {
  await connectDB();
  return app(req, res);
};

export default handler;

const exitHandler = () => {
  logger.info('Server closed');
  process.exit(1);
};

const unexpectedErrorHandler = (error: unknown) => {
  logger.error(error);
  exitHandler();
};

process.on('uncaughtException', unexpectedErrorHandler);
process.on('unhandledRejection', unexpectedErrorHandler);
