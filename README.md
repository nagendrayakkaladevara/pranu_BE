# Backend API

Production-ready Node.js backend with Express, TypeScript, and Prisma.

## Setup

1. **Install Dependencies**

   ```bash
   npm install
   ```

2. **Environment Variables**
   Copy `.env.example` to `.env` (if not already done) and update `DATABASE_URL`.

   ```bash
   cp .env.example .env
   ```

3. **Database Setup**
   Ensure your PostgreSQL database is running and `DATABASE_URL` is correct.
   ```bash
   npx prisma generate
   npx prisma db push
   ```

## Running the App

- **Development**: `npm run dev`
- **Production Build**: `npm run build`
- **Start Production**: `npm start`

## API Endpoints

- **Health Check**: `GET /v1/health`

## Project Structure

- `src/app.ts`: Express application setup
- `src/config`: Configuration and environment variables
- `src/controllers`: Request handlers
- `src/middlewares`: Express middlewares (error handling, auth)
- `src/models`: Data models (Prisma schema in `prisma/schema.prisma`)
- `src/routes`: API route definitions
- `src/services`: Business logic
- `src/utils`: Utility functions
