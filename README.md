# Backend API

Node.js backend for an educational platform built with Express, TypeScript, and MongoDB (Mongoose).

## Setup

1. **Install Dependencies**

   ```bash
   npm install
   ```

2. **Environment Variables**
   Create a `.env` file with:

   ```
   PORT=3000
   NODE_ENV=development
   DATABASE_URL=mongodb://localhost:27017/your-database
   JWT_SECRET=your-jwt-secret
   JWT_ACCESS_EXPIRATION_MINUTES=30
   ```

3. **Database**
   Ensure your MongoDB instance is running and `DATABASE_URL` is correct.

## Running the App

- **Development**: `npm run dev`
- **Production Build**: `npm run build`
- **Start Production**: `npm start`
- **Lint**: `npm run lint`
- **Format**: `npm run format`

## API Endpoints

- **Health Check**: `GET /health` and `GET /v1/health`
- Full API documentation: see `docs/FRONTEND_API_GUIDE.md`
- Postman collection: see `docs/postman_collection.json`

## Project Structure

- `src/app.ts` — Express application setup (middleware, routes, error handling)
- `src/server.ts` — Server entry point, MongoDB connection
- `src/config/` — Environment config (Zod-validated) and Winston logger
- `src/controllers/` — Request handlers (thin, delegate to services)
- `src/services/` — Business logic and database operations
- `src/models/` — Mongoose schemas and TypeScript interfaces
- `src/routes/v1/` — API v1 route definitions
- `src/middlewares/` — Auth (JWT + RBAC), validation (Zod), error handling
- `src/validations/` — Zod request validation schemas
- `src/utils/` — Utility functions (catchAsync)
