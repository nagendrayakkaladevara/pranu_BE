# API Documentation

## Base URL

`http://localhost:3000/v1`

## Authentication

All endpoints except `/auth/*` and `/health` require a Bearer Token.
Header: `Authorization: Bearer <token>`

Tokens: Login/Register return both access (30min) and refresh (30 days) tokens. Use the refresh token to obtain new tokens when the access token expires.

## Rate Limiting

- **General**: 100 requests per 15 minutes (production only)
- **Auth endpoints**: 20 requests per 15 minutes
- Returns `429` with `{ "message": "Too many requests, please try again later." }`

## Modules

### 1. Authentication

- `POST /auth/register`: Register a new user. Returns user + access & refresh tokens.
- `POST /auth/login`: Login to receive access & refresh tokens.
- `POST /auth/logout`: Revoke a refresh token. Body: `{ "refreshToken": "..." }`. Returns 204.
- `POST /auth/refresh-tokens`: Get new token pair. Body: `{ "refreshToken": "..." }`. Returns user + new tokens.

### 2. User Management (Admin Only)

- `POST /users`: Create User (Lecturer/Student).
- `GET /users`: List Users (allows filtering by role, name). Soft-deleted users are excluded.
- `GET /users/:userId`: Get User Details.
- `PATCH /users/:userId`: Update User.
- `DELETE /users/:userId`: Soft-delete User (sets `isDeleted: true`, `deletedAt` timestamp).

### 3. Class Management (Admin Only)

- `POST /classes`: Create Class.
- `GET /classes`: List Classes.
- `GET /classes/:classId`: Get Class Details.
- `PATCH /classes/:classId`: Update Class.
- `DELETE /classes/:classId`: Delete Class.
- `POST /classes/:classId/students`: Assign Students to Class.
- `POST /classes/:classId/lecturers`: Assign Lecturers to Class.

### 4. Question Bank (Lecturer/Admin)

- `POST /questions`: Create Question (MCQ or SUBJECTIVE).
- `GET /questions`: List Questions.
- `GET /questions/:questionId`: Get Question Details.
- `PATCH /questions/:questionId`: Update Question.
- `DELETE /questions/:questionId`: Delete Question.

### 5. Quiz Management (Lecturer/Admin)

- `POST /quizzes`: Create Quiz Draft.
- `GET /quizzes`: List Quizzes.
- `GET /quizzes/:quizId`: Get Quiz Details.
- `PATCH /quizzes/:quizId`: Update Quiz.
- `DELETE /quizzes/:quizId`: Delete Quiz.
- `POST /quizzes/:quizId/questions`: Add Questions to Quiz.
- `POST /quizzes/:quizId/publish`: Publish Quiz to Classes.

### 6. Examination (Student)

- `GET /exam/quizzes`: List active/upcoming quizzes for the student.
- `POST /exam/quizzes/:quizId/start`: Start a quiz attempt. Returns questions (MCQ options without answers, SUBJECTIVE with empty options).
- `POST /exam/attempts/:attemptId/submit`: Submit answers (MCQ: `selectedOptionId`, SUBJECTIVE: `textAnswer`). MCQ auto-scored, subjective pending grading.

### 7. Grading (Lecturer/Admin)

- `POST /exam/attempts/:attemptId/grade`: Grade subjective responses. Body: `{ "grades": [{ "questionId": "...", "awardedMarks": 5 }] }`.

### 8. Analytics (Lecturer/Admin)

- `GET /analytics/results/:quizId`: Quiz performance stats (average, highest, lowest, pass/fail rate).
- `GET /analytics/student/:studentId`: Student history with summary stats.
- `GET /analytics/questions/:quizId`: Per-question analysis (correctRate, averageMarks, difficulty).
- `GET /analytics/difficulty/:quizId`: Difficulty-wise performance breakdown.

## Security

- All inputs sanitized against XSS attacks
- Request body size limited to 1MB
- Helmet security headers enabled
- CORS enabled
