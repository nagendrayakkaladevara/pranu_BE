# System Architecture

## Overview

The ECQES backend follows a **Layered Architecture** (Controller-Service-Repository) to ensure separation of concerns, scalability, and maintainability.

## Tech Stack

- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Language**: TypeScript (Strict)
- **Database**: PostgreSQL (Prisma ORM)
- **Validation**: Zod
- **Auth**: JWT (JSON Web Tokens)

## Data Flow

`Request` -> `Middleware (Auth/Validation)` -> `Controller` -> `Service` -> `Prisma Client` -> `Database`

## Database Schema (Mental Model)

- **Users**: Can be ADMIN, LECTURER, or STUDENT.
- **Classes**: Group Students. link Lecturers.
- **Questions**: Bank of questions (MCQ).
- **Quizzes**: Collections of questions, assigned to Classes.
- **QuizAttempts**: Tracks the Student's session of a Quiz.
- **StudentResponses**: Detailed answers for analytics.

## Folder Structure

```
src/
├── config/         # Environment variables & Logger config
├── controllers/    # API Controllers (Req/Res handling)
├── middlewares/    # Express Interceptors (Auth, Validate, Error)
├── routes/         # Router Definitions
├── services/       # Business Logic (Complex calculations, DB calls)
├── utils/          # Helpers (catchAsync, constants)
├── validations/    # Zod Schemas for input validation
├── app.ts          # Express App Setup
├── server.ts       # Server Entry Point
└── client.ts       # Prisma Client Instance
```
