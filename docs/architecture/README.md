# System Architecture

## Overview

The ECQES backend follows a **Layered Architecture** (Controller-Service-Repository) to ensure separation of concerns, scalability, and maintainability.

## Tech Stack

- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Language**: TypeScript (Strict)
- **Database**: MongoDB (Mongoose ODM)
- **Validation**: Zod
- **Auth**: JWT (Access + Refresh Tokens)
- **Security**: Helmet, XSS sanitization, Rate limiting

## Data Flow

`Request` -> `Rate Limiter` -> `Sanitization` -> `Middleware (Auth/Validation)` -> `Controller` -> `Service` -> `Mongoose Model` -> `MongoDB`

## Database Schema (Mental Model)

- **Users**: Can be ADMIN, LECTURER, or STUDENT. Supports soft-delete.
- **Tokens**: Stores refresh tokens for session management.
- **Classes**: Group Students. Link Lecturers.
- **Questions**: Bank of questions (MCQ and SUBJECTIVE).
- **Quizzes**: Collections of questions, assigned to Classes.
- **QuizAttempts**: Tracks the Student's session of a Quiz with auto-expiration.

## Security Layers

1. **Helmet**: Security HTTP headers
2. **Rate Limiting**: Global (100 req/15min) + Auth-specific (20 req/15min)
3. **XSS Sanitization**: All request data (body, query, params) sanitized
4. **Body Size Limit**: 1MB max request payload
5. **JWT Auth**: Access tokens (30min) + Refresh tokens (30 days)
6. **RBAC**: Role-based access control (ADMIN, LECTURER, STUDENT)

## Folder Structure

```
src/
├── config/         # Environment variables & Logger config
├── controllers/    # API Controllers (Req/Res handling)
├── middlewares/     # Express Interceptors (Auth, Validate, Error, RateLimiter, Sanitize)
├── models/         # Mongoose Schemas & Interfaces
├── routes/         # Router Definitions
├── services/       # Business Logic (Complex calculations, DB calls)
├── utils/          # Helpers (catchAsync, constants)
├── validations/    # Zod Schemas for input validation
├── app.ts          # Express App Setup
├── server.ts       # Server Entry Point
└── seed.ts         # Admin user seeding
```
