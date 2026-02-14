# Frontend Integration & API Guide

This document is designed to assist the frontend team in integrating with the Backend API.

## 1. Base Configuration

- **Base URL**: `http://localhost:3000/v1`
- **CORS**: Enabled for all origins (during development).

## 2. Authentication & Authorization

The application uses JWT (JSON Web Tokens) for authentication.

### Token Handling
- After a successful login/register, you will receive an `access` token.
- **Header Requirement**: For all protected routes, include the token in the `Authorization` header.
  ```
  Authorization: Bearer <your_access_token>
  ```

### Roles (`Role` Enum)
Certain actions are restricted by role.
- `ADMIN`: Full access (User management, Class management, etc.)
- `LECTURER`: Managing Questions, Quizzes, and Viewing Analytics.
- `STUDENT`: Taking Exams, Viewing own history.

---

## 3. Key Data Constants (Enums)

Use these constants to match backend validation logic.

| Enum / Field | Values | Description |
| :--- | :--- | :--- |
| **Role** | `ADMIN`, `LECTURER`, `STUDENT` | User permissions |
| **QuestionType** | `MCQ` | Currently only Multiple Choice is supported |
| **Difficulty** | `EASY`, `MEDIUM`, `HARD` | Question difficulty level |
| **QuizStatus** | `DRAFT`, `PUBLISHED`, `ARCHIVED` | Lifecycle of a quiz |
| **AttemptStatus**| `STARTED`, `SUBMITTED` | Student's quiz attempt state |

---

## 4. API Endpoints & Usage Scenarios

### A. Authentication

**1. Login**
- **Endpoint**: `POST /auth/login`
- **Body**:
  ```json
  {
    "email": "teacher@example.com",
    "password": "password123"
  }
  ```
- **Response**:
  ```json
  {
    "user": { "id": 1, "name": "Teacher", "role": "LECTURER", ... },
    "token": { "access": { "token": "ey...", "expires": "..." } }
  }
  ```

**2. Register**
- **Endpoint**: `POST /auth/register`
- **Body**: `{ "name": "...", "email": "...", "password": "...", "role": "STUDENT" }`

---

### B. Student Implementation Flow (Examination)

**Step 1: Dashboard - List Available Quizzes**
- **Endpoint**: `GET /exam/quizzes`
- **Method**: Shows quizzes that are `PUBLISHED`, assigned to the student's class, and currently active (within start/end time).

**Step 2: Taking a Quiz - Start Attempt**
- **Endpoint**: `POST /exam/quizzes/:quizId/start`
- **Response**: Returns the attempt ID and **sanitized questions** (without correct answer flags).
  ```json
  {
    "attempt": { "id": 101, "status": "STARTED" },
    "questions": [
      {
        "id": 5,
        "text": "What is 2+2?",
        "options": [
          { "id": 20, "text": "3" },
          { "id": 21, "text": "4" }
        ]
      }
    ]
  }
  ```
- **FE Action**: Store `attempt.id` locally to use for submission.

**Step 3: Submission**
- **Endpoint**: `POST /exam/attempts/:attemptId/submit`
- **Body**:
  ```json
  {
    "responses": [
      { "questionId": 5, "selectedOptionId": 21 },
      { "questionId": 6, "selectedOptionId": 25 }
    ]
  }
  ```
- **Response**: Immediate result (Score).

---

### C. Lecturer Implementation Flow (Quiz Management)

**1. Create a Quiz (Draft)**
- **Endpoint**: `POST /quizzes`
- **Body**:
  ```json
  {
    "title": "Mid-term Exam",
    "totalMarks": 100,
    "durationMinutes": 60,
    "shuffleQuestions": true
  }
  ```

**2. Add Questions**
- First, ensure questions exist in the bank via `POST /questions`.
- Then, add them to the quiz:
- **Endpoint**: `POST /quizzes/:quizId/questions`
- **Body**: `{ "questionIds": [1, 2, 3, 4] }`

**3. Publish Quiz**
- Assign to classes and go live.
- **Endpoint**: `POST /quizzes/:quizId/publish`
- **Body**:
  ```json
  {
    "classIds": [1, 2] // The IDs of classes (e.g., 'CSE-A', 'CSE-B')
  }
  ```
- *Note:* The quiz must have `startTime` and `endTime` set before publishing. If not set during creation, use `PATCH /quizzes/:quizId` to set dates first.

---

### D. Analytics & Admin

**Get Quiz Results**
- **Endpoint**: `GET /analytics/results/:quizId`
- **Response**:
  ```json
  {
    "stats": {
      "averageScore": 75.5,
      "passedCount": 20,
      "passRate": 85.0
    },
    "results": [ ...list of all student attempts... ]
  }
  ```

---

## 5. Error Handling

API errors return a standard JSON structure.

**Format**:
```json
{
  "code": 400,
  "message": "\"email\" must be a valid email",
  "stack": "..." // Only in development
}
```

**Common Codes**:
- `401 Unauthorized`: Token missing or invalid. Redirect to Login.
- `403 Forbidden`: User does not have the required Role.
- `404 Not Found`: Resource (User/Quiz) does not exist.
