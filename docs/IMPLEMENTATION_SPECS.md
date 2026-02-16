# Implementation Specifications

This document outlines the implemented modules and their API specifications for the ECQES system.

## 1. Authentication Module

**Status**: Fully implemented

- **Endpoints**:
  - `POST /v1/auth/register`: Create a new user account. Returns user + access & refresh tokens.
  - `POST /v1/auth/login`: Authenticate user. Returns user + access & refresh tokens.
  - `POST /v1/auth/logout`: Revoke refresh token. Body: `{ "refreshToken": "..." }`. Returns 204.
  - `POST /v1/auth/refresh-tokens`: Get new token pair. Body: `{ "refreshToken": "..." }`. Returns user + new tokens.
- **Security**:
  - Access tokens expire in 30 minutes (configurable via `JWT_ACCESS_EXPIRATION_MINUTES`)
  - Refresh tokens expire in 30 days (configurable via `JWT_REFRESH_EXPIRATION_DAYS`)
  - Refresh tokens stored in DB and deleted on logout/refresh (rotation)
  - Auth endpoints rate-limited to 20 requests per 15 minutes

## 2. User Management Module (Admin Only)

**Status**: Fully implemented

- **Endpoints**:
  - `POST /v1/users`: Create a user (Admin/Lecturer/Student).
  - `GET /v1/users`: List users with pagination and role filtering. Soft-deleted users excluded.
  - `GET /v1/users/:userId`: Get user details.
  - `PATCH /v1/users/:userId`: Update user details.
  - `DELETE /v1/users/:userId`: Soft-delete user (sets `isDeleted: true`, `deletedAt` timestamp).
- **Validation**: Email uniqueness, valid role, min 8-char password.

## 3. Class Management Module (Admin Only)

**Status**: Fully implemented

- **Endpoints**:
  - `POST /v1/classes`: Create a new class.
  - `GET /v1/classes`: List classes with pagination.
  - `GET /v1/classes/:classId`: Get class details (includes populated students/lecturers).
  - `PATCH /v1/classes/:classId`: Update class.
  - `DELETE /v1/classes/:classId`: Delete class.
  - `POST /v1/classes/:classId/students`: Bulk assign students to a class.
  - `POST /v1/classes/:classId/lecturers`: Assign lecturers to a class.
- **Logic**: Uses `$addToSet` to prevent duplicate assignments.

## 4. Question Bank Module (Lecturer/Admin)

**Status**: Fully implemented

- **Endpoints**:
  - `POST /v1/questions`: Create a question (MCQ or SUBJECTIVE).
  - `GET /v1/questions`: List questions (filter by subject, topic, difficulty).
  - `GET /v1/questions/:questionId`: Get question details.
  - `PATCH /v1/questions/:questionId`: Update question.
  - `DELETE /v1/questions/:questionId`: Delete question.
- **Specs**:
  - Supports MCQ and SUBJECTIVE question types.
  - Options required for MCQ, at least one must be correct.

## 5. Quiz Management Module (Lecturer/Admin)

**Status**: Fully implemented

- **Endpoints**:
  - `POST /v1/quizzes`: Create a quiz draft.
  - `GET /v1/quizzes`: List quizzes with pagination and filters.
  - `GET /v1/quizzes/:quizId`: Get quiz details with populated questions and classes.
  - `PATCH /v1/quizzes/:quizId`: Update quiz.
  - `DELETE /v1/quizzes/:quizId`: Delete quiz.
  - `POST /v1/quizzes/:quizId/questions`: Add questions to quiz.
  - `POST /v1/quizzes/:quizId/publish`: Publish quiz to classes. Requires questions, startTime, endTime.

## 6. Quiz Attempt Module (Student)

**Status**: Fully implemented (MCQ auto-scored + subjective pending grading)

- **Endpoints**:
  - `GET /v1/exam/quizzes`: List available quizzes for student (class-based, time-window filtered).
  - `POST /v1/exam/quizzes/:quizId/start`: Start attempt. Returns sanitized questions (MCQ options without `isCorrect`, SUBJECTIVE with empty options).
  - `POST /v1/exam/attempts/:attemptId/submit`: Submit answers. MCQ uses `selectedOptionId`, SUBJECTIVE uses `textAnswer`. MCQ auto-scored, response includes `pendingGrading` flag.
- **Logic**:
  - Validates student class enrollment and quiz time window.
  - Auto-expires stale attempts (quiz endTime passed or duration exceeded).
  - Prevents duplicate submissions and expired attempt submissions.

## 7. Grading Module (Lecturer/Admin)

**Status**: Fully implemented

- **Endpoints**:
  - `POST /v1/exam/attempts/:attemptId/grade`: Grade subjective responses.
    - Body: `{ "grades": [{ "questionId": "...", "awardedMarks": 5 }] }`
    - Validates marks don't exceed question marks.
    - Returns grading status (`allGraded` flag) and updated score.

## 8. Analytics Module (Lecturer/Admin)

**Status**: Fully implemented

- **Endpoints**:
  - `GET /v1/analytics/results/:quizId`: Quiz results with stats (average, highest, lowest, pass/fail rate, all student results).
  - `GET /v1/analytics/student/:studentId`: Student performance history with summary (averagePercentage, quizzesPassed/Failed).
  - `GET /v1/analytics/questions/:quizId`: Per-question analysis (attemptedCount, correctCount, correctRate, averageMarks).
  - `GET /v1/analytics/difficulty/:quizId`: Difficulty-wise performance breakdown (correctRate, averageScore per difficulty level).

## 9. Security & Infrastructure

**Status**: Fully implemented

- **Rate Limiting**: 100 req/15min general (production), 20 req/15min for auth endpoints.
- **XSS Sanitization**: All request data (body, query, params) sanitized via `xss` library.
- **Body Size Limit**: 1MB maximum request payload.
- **Helmet**: Security HTTP headers.
- **CORS**: Enabled for all origins.
- **Error Handling**: Custom `ApiError` class, error converter, environment-aware stack traces.
