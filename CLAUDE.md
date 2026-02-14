# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server with hot reload (ts-node-dev)
npm run build        # Clean dist/ and compile TypeScript
npm start            # Run compiled production build (dist/server.js)
npm run lint         # ESLint check
npm run lint:fix     # ESLint auto-fix
npm run format       # Prettier format
```

No test framework is currently configured.

## Architecture

Educational platform backend (Express + TypeScript + MongoDB/Mongoose). Three user roles: ADMIN, LECTURER, STUDENT.

**Request flow:** Route → validate middleware (Zod) → auth middleware (JWT + RBAC) → Controller (catchAsync wrapper) → Service → Mongoose Model → MongoDB

**Key layers:**
- `src/routes/v1/*.route.ts` — Define endpoints, apply `auth(...roles)` and `validate(schema)` middleware
- `src/controllers/` — Thin handlers that extract request data, call services, send responses
- `src/services/` — All business logic and database operations; throw `ApiError` for errors
- `src/models/` — Mongoose schemas with interfaces (IUser, IQuiz, etc.), pre-save hooks (password hashing), JSON transforms (strip `_id`, `__v`, password)
- `src/validations/` — Zod schemas exported as objects with `body`, `params`, `query` keys

**Auth:** JWT Bearer tokens, no refresh tokens. `auth()` middleware is variadic: `auth('LECTURER', 'ADMIN')` allows both roles. User attached to `req.user` after authentication.

**Error handling:** Custom `ApiError` class in `src/middlewares/error.ts`. `errorConverter` normalizes all errors to ApiError, `errorHandler` sends the response. Stack traces shown only in development.

**Entry points:** `src/app.ts` sets up Express middleware and routes. `src/server.ts` connects to MongoDB then starts listening.

## Environment

Requires Node.js >=18. Config loaded via `src/config/config.ts` using Zod-validated env vars:
- `PORT` (default 3000)
- `DATABASE_URL` (MongoDB connection string)
- `JWT_SECRET`
- `JWT_ACCESS_EXPIRATION_MINUTES` (default 30)
- `NODE_ENV`

## Code Style

- TypeScript strict mode, ES2020 target, CommonJS modules
- Prettier: single quotes, trailing commas, semicolons, 100 char width, 2-space indent
- ESLint: @typescript-eslint with explicit return types off, no-any as warning
- All async controller handlers wrapped with `catchAsync` from `src/utils/catchAsync.ts`

## Database Note

A Prisma schema exists at `prisma/schema.prisma` (PostgreSQL) but is **not actively used**. The app uses Mongoose models in `src/models/`. The Prisma schema may represent a planned migration target.
