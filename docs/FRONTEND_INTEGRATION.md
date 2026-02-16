# Frontend Integration & Workflow Guide

This document walks through common integration workflows with the Backend API.

For the full endpoint reference, see [FRONTEND_API_GUIDE.md](./FRONTEND_API_GUIDE.md).

## 1. Base Configuration

- **Base URL**: `http://localhost:3000/v1`
- **CORS**: Enabled for all origins (during development)
- All IDs are MongoDB ObjectId strings (24-character hex, e.g. `"665a1b2c3d4e5f6a7b8c9d0e"`)
- **Request body limit**: 1MB. Payloads exceeding this will receive a `413` error.
- **XSS sanitization**: All inputs are sanitized server-side. Do not rely on this as a substitute for frontend sanitization, but be aware that stored content may have certain HTML/script tags stripped.

### Rate Limiting (Production)

| Scope | Limit | Window |
| :--- | :--- | :--- |
| Auth endpoints (`/v1/auth/*`) | 20 requests | 15 minutes |
| General API (all other routes) | 100 requests | 15 minutes |

When a limit is exceeded, the server responds with `429 Too Many Requests`. Frontend should:
- Show a "too many requests" message to the user.
- Read the `Retry-After` header (if present) and wait before retrying.
- Implement exponential backoff for automated retries.

---

## 2. Authentication & Authorization

The application uses JWT (JSON Web Tokens) for authentication.

### Token Handling
- After a successful login/register, you will receive both an `access` token (short-lived) and a `refresh` token (long-lived) inside a `tokens` object.
  ```json
  {
    "user": { "id": "665a...", "name": "...", "role": "STUDENT" },
    "tokens": {
      "access": {
        "token": "eyJhbG...",
        "expires": "2026-02-15T10:30:00.000Z"
      },
      "refresh": {
        "token": "eyJhbG...",
        "expires": "2026-03-17T10:00:00.000Z"
      }
    }
  }
  ```
- **Access token** expires after **30 minutes**. Use it for all API requests.
- **Refresh token** expires after **30 days**. Use it to obtain a new access token without forcing the user to log in again.
- **Storage**: Store both tokens securely. The refresh token should be stored in a secure, HttpOnly context if possible (e.g., secure cookie or encrypted storage). Avoid `localStorage` for the refresh token.
- **Header Requirement**: For all protected routes, include the access token in the `Authorization` header:
  ```
  Authorization: Bearer <your_access_token>
  ```
- Handle `401` responses by attempting a token refresh first. Only redirect to login if the refresh also fails.

### Auth Endpoints

| Method | Endpoint | Body | Response |
| :--- | :--- | :--- | :--- |
| `POST` | `/v1/auth/register` | `{ name, email, password, role }` | `{ user, tokens }` |
| `POST` | `/v1/auth/login` | `{ email, password }` | `{ user, tokens }` |
| `POST` | `/v1/auth/logout` | `{ "refreshToken": "..." }` | `204 No Content` |
| `POST` | `/v1/auth/refresh-tokens` | `{ "refreshToken": "..." }` | `{ user, tokens }` |

### Logout
- On logout, send the refresh token to `POST /v1/auth/logout` to invalidate it server-side.
- Clear both tokens from client storage.

### Roles
- `ADMIN`: Full access (user management, class management, analytics)
- `LECTURER`: Manage questions, quizzes, grade subjective answers, view analytics
- `STUDENT`: Take exams, view own results

---

## 3. Key Enums

| Enum | Values | Notes |
| :--- | :--- | :--- |
| **Role** | `ADMIN`, `LECTURER`, `STUDENT` | |
| **QuestionType** | `MCQ`, `SUBJECTIVE` | Both types are supported |
| **Difficulty** | `EASY`, `MEDIUM`, `HARD` | |
| **QuizStatus** | `DRAFT`, `PUBLISHED`, `ARCHIVED` | |
| **AttemptStatus** | `STARTED`, `SUBMITTED`, `EXPIRED` | `EXPIRED` set automatically by the server |

---

## 4. Workflow: Token Refresh Flow

When the access token expires, use the refresh token to obtain new tokens transparently.

**Step 1: Detect Expiry**
- Option A: Check the `access.expires` timestamp before each request and refresh proactively.
- Option B: Intercept `401` responses and trigger a refresh.

**Step 2: Request New Tokens**
- `POST /v1/auth/refresh-tokens`
- Body:
  ```json
  { "refreshToken": "eyJhbG..." }
  ```
- Response:
  ```json
  {
    "user": { "id": "665a...", "name": "...", "role": "STUDENT" },
    "tokens": {
      "access": { "token": "new_access_token", "expires": "..." },
      "refresh": { "token": "new_refresh_token", "expires": "..." }
    }
  }
  ```

**Step 3: Update Stored Tokens**
- Replace both the access and refresh tokens in storage with the new values.
- Retry the original failed request with the new access token.

**Step 4: Handle Refresh Failure**
- If the refresh request returns `401` (refresh token expired or revoked), redirect the user to the login page and clear all stored tokens.

**Recommended Pattern (Axios Example):**
```js
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const { data } = await api.post('/v1/auth/refresh-tokens', {
          refreshToken: getStoredRefreshToken(),
        });
        setTokens(data.tokens);
        originalRequest.headers.Authorization = `Bearer ${data.tokens.access.token}`;
        return api(originalRequest);
      } catch (refreshError) {
        clearTokens();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);
```

---

## 5. Workflow: Student Taking an Exam

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
      },
      {
        "id": "665e...",
        "text": "Explain the concept of polymorphism.",
        "type": "SUBJECTIVE",
        "marks": 5,
        "options": []
      }
    ]
  }
  ```
- **MCQ questions** include options (without `isCorrect` -- answers are hidden from the student).
- **SUBJECTIVE questions** return an empty `options` array. Render a text input/textarea for these.
- Store `attempt.id` for submission.

**Step 3: Submit Answers**
- `POST /exam/attempts/:attemptId/submit`
- Body (supports both MCQ and SUBJECTIVE responses):
  ```json
  {
    "responses": [
      { "questionId": "665b...", "selectedOptionId": "665d..." },
      { "questionId": "665e...", "textAnswer": "Polymorphism is the ability of..." }
    ]
  }
  ```
  - Use `selectedOptionId` for MCQ questions.
  - Use `textAnswer` for SUBJECTIVE questions.
- Response:
  ```json
  {
    "message": "Quiz submitted successfully",
    "score": 8,
    "totalMarks": 10,
    "pendingGrading": true
  }
  ```
  - `pendingGrading: true` indicates that subjective answers still need to be graded by a lecturer. The `score` reflects only auto-graded (MCQ) marks at this point.
  - `pendingGrading: false` means all questions were auto-graded and the score is final.

**Auto-Expiration:**
- Attempts automatically expire when the quiz time window ends or when the allowed duration is exceeded.
- Expired attempts cannot be submitted. If a student tries to submit an expired attempt, they will receive a `400` error.
- Frontend should implement a countdown timer based on the quiz duration and warn the user before time runs out.

**Step 5: Review Past Attempts**
- `GET /v1/exam/attempts` — List all own attempts with pagination and sorting (e.g., `?sortBy=submittedAt:desc`)
- `GET /v1/exam/attempts/:attemptId` — View a single attempt's full details including responses and scores

**Step 6: View Performance Stats**
- `GET /v1/exam/my-stats` — Get overall performance summary (total attempts, average percentage, pass/fail counts) and detailed per-quiz history

**Step 7: View Enrolled Classes**
- `GET /v1/classes` — Students see only classes they are enrolled in

**Step 8: View/Update Profile**
- `GET /v1/auth/me` — Get own profile
- `PATCH /v1/auth/me` — Update name, email, or password

---

## 6. Workflow: Lecturer Managing Quizzes

**Step 1: Create Questions** -- `POST /questions`
- Both MCQ and SUBJECTIVE question types are supported.

**Step 2: Create a Quiz (Draft)** -- `POST /quizzes`
```json
{
  "title": "Mid-term Exam",
  "totalMarks": 100,
  "durationMinutes": 60,
  "shuffleQuestions": true
}
```

**Step 3: Add Questions to Quiz** -- `POST /quizzes/:quizId/questions`
```json
{ "questionIds": ["665b...", "665c...", "665d..."] }
```

**Step 4: Set Time Window** -- `PATCH /quizzes/:quizId`
```json
{
  "startTime": "2026-03-01T09:00:00.000Z",
  "endTime": "2026-03-01T11:00:00.000Z"
}
```

**Step 5: Publish** -- `POST /quizzes/:quizId/publish`
```json
{ "classIds": ["665e...", "665f..."] }
```
Requirements: quiz must have questions AND startTime/endTime set.

---

## 7. Workflow: Lecturer Grading Subjective Answers

After students submit quizzes containing subjective questions, lecturers must manually grade those answers.

**Step 1: Identify Attempts with Pending Grading**
- Use `GET /v1/exam/attempts?status=SUBMITTED` to list submitted attempts. Lecturers will only see attempts for quizzes they created; admins see all.

**Step 2: Review and Grade**
- `POST /v1/exam/attempts/:attemptId/grade`
- Body:
  ```json
  {
    "grades": [
      { "questionId": "665e...", "awardedMarks": 5 },
      { "questionId": "665f...", "awardedMarks": 3 }
    ]
  }
  ```
  - `questionId`: The ID of the subjective question being graded.
  - `awardedMarks`: The marks awarded by the lecturer (must not exceed the question's max marks).

**Step 3: Confirm Updated Score**
- The response returns the updated attempt with the final score reflecting both auto-graded MCQ marks and manually graded subjective marks.
- After all subjective answers are graded, `pendingGrading` becomes `false`.

**UI Recommendations:**
- Show the student's text answer alongside the question text and maximum marks.
- Provide a numeric input constrained to `0` through the question's `marks` value.
- Highlight ungraded answers so lecturers can easily find remaining work.

---

## 8. Workflow: Admin Managing Classes

1. **Create Class** -- `POST /classes`
2. **Assign Students** -- `POST /classes/:classId/students` with `{ "studentIds": [...] }`
3. **Assign Lecturers** -- `POST /classes/:classId/lecturers` with `{ "lecturerIds": [...] }`

Uses `$addToSet` internally, so duplicate assignments are safely ignored.

### Soft Deletes

User deletion (`DELETE /users/:userId`) is now a **soft delete**:
- The user record is not removed from the database. Instead, `isDeleted` is set to `true` and `deletedAt` is set to the current timestamp.
- Soft-deleted users are automatically filtered out from all list/query endpoints.
- Soft-deleted users cannot log in.
- This allows data recovery and audit trail preservation.

---

## 9. Analytics (Lecturer / Admin)

### Existing Endpoints (Enhanced)

Existing analytics endpoints now return additional data fields:

| Field | Description |
| :--- | :--- |
| `lowestScore` | The lowest score across all attempts |
| `failedCount` | Number of students who failed |
| `percentage` | Pass/fail percentage breakdown |
| `summary` | Aggregated summary object |

### New Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/v1/analytics/questions/:quizId` | Per-question analytics (correct rate, average marks, common wrong answers) |
| `GET` | `/v1/analytics/difficulty/:quizId` | Difficulty distribution and analysis for the quiz |

These endpoints are available to LECTURER and ADMIN roles.

---

## 10. Error Handling

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
| `401` | Token missing/invalid/expired | Attempt token refresh; redirect to login if refresh fails |
| `403` | Insufficient role permissions | Show "access denied" |
| `404` | Resource not found | Show "not found" or redirect |
| `413` | Request body too large (>1MB) | Reduce payload size |
| `429` | Rate limit exceeded | Show "too many requests", wait and retry |
