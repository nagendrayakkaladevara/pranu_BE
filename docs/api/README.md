# API Documentation

## Base URL

`http://localhost:3000/v1`

## Authentication

All endpoints except `/auth/*` and `/health` require a Bearer Token.
Header: `Authorization: Bearer <token>`

## Modules

### 1. Authentication

- `POST /auth/register`: Register a new user (`ADMIN` role creation might need restriction in real world).
- `POST /auth/login`: Login to receive JWT token.

### 2. User Management (Admin Only)

- `POST /users`: Create User (Lecturer/Student).
- `GET /users`: List Users (Allows filtering by role, name).
- `GET /users/:userId`: Get User Details.
- `PATCH /users/:userId`: Update User.
- `DELETE /users/:userId`: Delete User.

### 3. Class Management (Admin Only)

- `POST /classes`: Create Class.
- `GET /classes`: List Classes.
- `GET /classes/:classId`: Get Class Details.
- `PATCH /classes/:classId`: Update Class.
- `DELETE /classes/:classId`: Delete Class.
- `POST /classes/:classId/students`: Assign Students to Class.
- `POST /classes/:classId/lecturers`: Assign Lecturers to Class.

### 4. Question Bank (Lecturer/Admin)

- `POST /questions`: Create Question (MCQ).
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

- `GET /exam/quizzes`: List active/upcoming quizzes.
- `POST /exam/quizzes/:quizId/start`: Start a quiz attempt.
- `POST /exam/attempts/:attemptId/submit`: Submit exam answers.

### 7. Analytics (Lecturer/Admin)

- `GET /analytics/results/:quizId`: View quiz performance stats.
- `GET /analytics/student/:studentId`: View individual student history.
