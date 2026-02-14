# Frontend Integration & Workflow Guide

This document walks through common integration workflows with the Backend API.

For the full endpoint reference, see [FRONTEND_API_GUIDE.md](./FRONTEND_API_GUIDE.md).

## 1. Base Configuration

- **Base URL**: `http://localhost:3000/v1`
- **CORS**: Enabled for all origins (during development)
- All IDs are MongoDB ObjectId strings (24-character hex, e.g. `"665a1b2c3d4e5f6a7b8c9d0e"`)

## 2. Authentication & Authorization

The application uses JWT (JSON Web Tokens) for authentication.

### Token Handling
- After a successful login/register, you will receive an `access` token inside a `tokens` object.
- **Header Requirement**: For all protected routes, include the token in the `Authorization` header:
  ```
  Authorization: Bearer <your_access_token>
  ```
- Tokens expire after 30 minutes (configurable). Handle `401` responses by redirecting to login.

### Roles
- `ADMIN`: Full access (user management, class management, analytics)
- `LECTURER`: Manage questions, quizzes, view analytics
- `STUDENT`: Take exams, view own results

---

## 3. Key Enums

| Enum | Values | Notes |
| :--- | :--- | :--- |
| **Role** | `ADMIN`, `LECTURER`, `STUDENT` | |
| **QuestionType** | `MCQ`, `SUBJECTIVE` | Only MCQ currently used |
| **Difficulty** | `EASY`, `MEDIUM`, `HARD` | |
| **QuizStatus** | `DRAFT`, `PUBLISHED`, `ARCHIVED` | |
| **AttemptStatus** | `STARTED`, `SUBMITTED`, `EXPIRED` | |

---

## 4. Workflow: Student Taking an Exam

**Step 1: List Available Quizzes**
- `GET /exam/quizzes`
- Returns published quizzes assigned to the student's class and within the active time window.

**Step 2: Start Attempt**
- `POST /exam/quizzes/:quizId/start`
- Response:
  ```json
  {
    "attempt": { "id": "665a...", "status": "STARTED", ... },
    "questions": [
      {
        "id": "665b...",
        "text": "What is 2+2?",
        "type": "MCQ",
        "marks": 1,
        "options": [
          { "id": "665c...", "text": "3" },
          { "id": "665d...", "text": "4" }
        ]
      }
    ]
  }
  ```
- Options do NOT include `isCorrect` — answers are hidden from the student.
- Store `attempt.id` for submission.

**Step 3: Submit Answers**
- `POST /exam/attempts/:attemptId/submit`
- Body:
  ```json
  {
    "responses": [
      { "questionId": "665b...", "selectedOptionId": "665d..." }
    ]
  }
  ```
- Response:
  ```json
  { "message": "Quiz submitted successfully", "score": 8, "totalMarks": 10 }
  ```

---

## 5. Workflow: Lecturer Managing Quizzes

**Step 1: Create Questions** — `POST /questions`

**Step 2: Create a Quiz (Draft)** — `POST /quizzes`
```json
{
  "title": "Mid-term Exam",
  "totalMarks": 100,
  "durationMinutes": 60,
  "shuffleQuestions": true
}
```

**Step 3: Add Questions to Quiz** — `POST /quizzes/:quizId/questions`
```json
{ "questionIds": ["665b...", "665c...", "665d..."] }
```

**Step 4: Set Time Window** — `PATCH /quizzes/:quizId`
```json
{
  "startTime": "2026-03-01T09:00:00.000Z",
  "endTime": "2026-03-01T11:00:00.000Z"
}
```

**Step 5: Publish** — `POST /quizzes/:quizId/publish`
```json
{ "classIds": ["665e...", "665f..."] }
```
Requirements: quiz must have questions AND startTime/endTime set.

---

## 6. Workflow: Admin Managing Classes

1. **Create Class** — `POST /classes`
2. **Assign Students** — `POST /classes/:classId/students` with `{ "studentIds": [...] }`
3. **Assign Lecturers** — `POST /classes/:classId/lecturers` with `{ "lecturerIds": [...] }`

Uses `$addToSet` internally, so duplicate assignments are safely ignored.

---

## 7. Error Handling

All errors return:
```json
{
  "code": 400,
  "message": "Descriptive error message",
  "stack": "..."
}
```
`stack` is only included in development mode.

**Common Codes:**
| Code | Meaning | Frontend Action |
| :--- | :--- | :--- |
| `400` | Validation error or bad request | Show message to user |
| `401` | Token missing/invalid/expired | Redirect to login |
| `403` | Insufficient role permissions | Show "access denied" |
| `404` | Resource not found | Show "not found" or redirect |
