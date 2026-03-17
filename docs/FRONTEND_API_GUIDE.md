# Frontend API Guide

Complete API reference for the frontend team. All endpoints are prefixed with `/v1`.

**Base URL:** `http://localhost:3000`

## Table of Contents

- [Authentication](#authentication)
- [Profile (All Roles)](#profile-all-roles)
- [Users (Admin)](#users-admin-only)
- [Classes](#classes)
- [Circulars (Lecturer)](#circulars-lecturer)
- [Questions (Lecturer/Admin)](#questions-lectureadmin)
- [Quizzes (Lecturer/Admin)](#quizzes-lectureadmin)
- [Exam (Student)](#exam-student-only)
- [Student Stats](#student-stats)
- [Attempts (All Roles)](#attempts-all-roles)
- [Grading (Lecturer/Admin)](#grading-lectureadmin)
- [Analytics (Lecturer/Admin)](#analytics-lectureadmin)
- [Notifications (All Roles)](#notifications-all-roles) — see [NOTIFICATIONS_API_GUIDE.md](NOTIFICATIONS_API_GUIDE.md) for full details
- [Data Models](#data-models)
- [Pagination](#pagination)
- [Rate Limiting](#rate-limiting)
- [Error Responses](#error-responses)

---

## Authentication

All protected endpoints require:

```
Authorization: Bearer <access_token>
```

### POST /v1/auth/register

Create a new account. No auth required.

**Body:**

```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "role": "STUDENT"
}
```

| Field      | Type   | Required | Notes                                               |
| :--------- | :----- | :------- | :-------------------------------------------------- |
| `email`    | string | Yes      | Valid email format                                  |
| `password` | string | Yes      | Min 8 characters                                    |
| `name`     | string | Yes      |                                                     |
| `role`     | string | No       | `ADMIN`, `LECTURER`, `STUDENT` (default: `STUDENT`) |

**Response** `201`:

```json
{
  "user": {
    "id": "665a1b2c3d4e5f6a7b8c9d0e",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "STUDENT",
    "isActive": true,
    "createdAt": "2026-01-15T10:30:00.000Z",
    "updatedAt": "2026-01-15T10:30:00.000Z"
  },
  "tokens": {
    "access": {
      "token": "eyJhbGciOiJIUzI1NiIs...",
      "expires": "2026-01-15T11:00:00.000Z"
    },
    "refresh": {
      "token": "eyJhbGciOiJIUzI1NiIs...",
      "expires": "2026-02-14T10:30:00.000Z"
    }
  }
}
```

### POST /v1/auth/login

Authenticate an existing user. No auth required.

**Body:**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response** `200`: Same shape as register response (includes both access and refresh tokens).

### POST /v1/auth/logout

Invalidate a refresh token. No auth required.

**Body:**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

| Field          | Type   | Required |
| :------------- | :----- | :------- |
| `refreshToken` | string | Yes      |

**Response** `204`: No content.

### POST /v1/auth/refresh-tokens

Get new access and refresh tokens using a valid refresh token. No auth required.

**Body:**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

| Field          | Type   | Required |
| :------------- | :----- | :------- |
| `refreshToken` | string | Yes      |

**Response** `200`:

```json
{
  "user": {
    "id": "665a1b2c3d4e5f6a7b8c9d0e",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "STUDENT",
    "isActive": true,
    "createdAt": "2026-01-15T10:30:00.000Z",
    "updatedAt": "2026-01-15T10:30:00.000Z"
  },
  "tokens": {
    "access": {
      "token": "eyJhbGciOiJIUzI1NiIs...",
      "expires": "2026-01-15T11:30:00.000Z"
    },
    "refresh": {
      "token": "eyJhbGciOiJIUzI1NiIs...",
      "expires": "2026-02-14T11:00:00.000Z"
    }
  }
}
```

**Token Expiration:**

- Access tokens expire in **30 minutes** (default).
- Refresh tokens expire in **30 days** (default).

**Recommended frontend flow:**

1. On login/register, store both tokens.
2. Use the access token for API requests.
3. When a request returns `401`, call `/v1/auth/refresh-tokens` with the stored refresh token.
4. Replace both stored tokens with the new ones from the response.
5. On logout, call `/v1/auth/logout` with the refresh token and clear stored tokens.

> **Note:** Auth endpoints (register, login, logout, refresh) have stricter rate limiting (20 requests per 15 minutes). The `/me` endpoints use standard rate limiting. See [Rate Limiting](#rate-limiting).

---

## Profile (All Roles)

Self-service profile endpoints for any authenticated user.

### GET /v1/auth/me

**Auth:** Any authenticated user

Get the logged-in user's profile.

**Response** `200`: User object (same shape as register response's `user` field).

### PATCH /v1/auth/me

**Auth:** Any authenticated user

Update the logged-in user's own profile. Users cannot change their own role.

**Body** (at least one field):

```json
{
  "name": "New Name",
  "email": "newemail@example.com",
  "password": "newpassword123"
}
```

| Field      | Type   | Required | Notes                              |
| :--------- | :----- | :------- | :--------------------------------- |
| `name`     | string | No       |                                    |
| `email`    | string | No       | Valid email format, must be unique |
| `password` | string | No       | Min 8 characters                   |

**Response** `200`: Updated user object.

---

## Users (Admin Only)

All endpoints require `Authorization: Bearer <adminToken>`.

### POST /v1/users

**Body:**

```json
{
  "email": "newuser@example.com",
  "password": "password123",
  "name": "New User",
  "role": "STUDENT"
}
```

| Field      | Type   | Required                             |
| :--------- | :----- | :----------------------------------- |
| `email`    | string | Yes                                  |
| `password` | string | Yes (min 8 chars)                    |
| `name`     | string | Yes                                  |
| `role`     | string | Yes (`ADMIN`, `LECTURER`, `STUDENT`) |

**Response** `201`: User object.

### GET /v1/users

**Query Parameters:**

| Param    | Type   | Notes                                                           |
| :------- | :----- | :-------------------------------------------------------------- |
| `page`   | number | Default: 1                                                      |
| `limit`  | number | Default: 10                                                     |
| `role`   | string | Filter: `ADMIN`, `LECTURER`, `STUDENT`                          |
| `name`   | string | Filter: partial match (case-insensitive)                        |
| `sortBy` | string | Format: `field:asc` or `field:desc` (default: `createdAt:desc`) |

**Response** `200`:

```json
{
  "users": [ { "id": "...", "email": "...", "name": "...", "role": "...", ... } ],
  "page": 1,
  "limit": 10,
  "totalPages": 3,
  "totalResults": 25
}
```

> **Note:** Soft-deleted users are automatically filtered out from all query results.

### GET /v1/users/:userId

**Response** `200`: User object.

### PATCH /v1/users/:userId

**Body** (at least one field):

```json
{
  "name": "Updated Name",
  "email": "new@example.com",
  "password": "newpassword",
  "role": "LECTURER",
  "isActive": false
}
```

**Response** `200`: Updated user object.

### DELETE /v1/users/:userId

Soft-deletes the user. The user record is not physically removed from the database; instead, `isDeleted` is set to `true` and `deletedAt` is set to the current timestamp. Soft-deleted users are automatically excluded from all queries.

**Response** `204`: No content.

---

## Classes

### POST /v1/classes

**Auth:** ADMIN only

**Body:**

```json
{
  "name": "CS 101",
  "department": "Computer Science",
  "academicYear": "2025-2026",
  "semester": 1
}
```

| Field          | Type   | Required             |
| :------------- | :----- | :------------------- |
| `name`         | string | Yes                  |
| `department`   | string | Yes                  |
| `academicYear` | string | Yes                  |
| `semester`     | number | Yes (integer, min 1) |

**Response** `201`: Class object.

### GET /v1/classes

**Auth:** ADMIN, LECTURER, or STUDENT

> **Role-based filtering:** Students only see classes they are enrolled in. Admins and Lecturers see all classes.

**Query Parameters:**

| Param        | Type   | Notes                               |
| :----------- | :----- | :---------------------------------- |
| `page`       | number | Default: 1                          |
| `limit`      | number | Default: 10                         |
| `name`       | string | Filter: partial match               |
| `department` | string | Filter: partial match               |
| `sortBy`     | string | Format: `field:asc` or `field:desc` |

**Response** `200`: Paginated class list (same structure as users).

### GET /v1/classes/:classId

**Auth:** ADMIN, LECTURER, or STUDENT

**Response** `200`: Class object with populated `students` and `lecturers` arrays.

```json
{
  "id": "665a...",
  "name": "CS 101",
  "department": "Computer Science",
  "academicYear": "2025-2026",
  "semester": 1,
  "students": [
    { "id": "665b...", "name": "Student Name", "email": "student@example.com", ... }
  ],
  "lecturers": [
    { "id": "665c...", "name": "Lecturer Name", "email": "lecturer@example.com", ... }
  ],
  "createdAt": "...",
  "updatedAt": "..."
}
```

### PATCH /v1/classes/:classId

**Auth:** ADMIN only

**Body** (at least one field):

```json
{
  "name": "CS 101 - Intro to CS",
  "department": "Computer Science",
  "academicYear": "2025-2026",
  "semester": 2
}
```

**Response** `200`: Updated class object.

### DELETE /v1/classes/:classId

**Auth:** ADMIN only

**Response** `204`: No content.

### POST /v1/classes/:classId/students

**Auth:** ADMIN only

Assign students to a class. Duplicates are safely ignored.

**Body:**

```json
{
  "studentIds": ["665a...", "665b..."]
}
```

**Response** `200`: Updated class object.

### POST /v1/classes/:classId/lecturers

**Auth:** ADMIN only

Assign lecturers to a class. Duplicates are safely ignored.

**Body:**

```json
{
  "lecturerIds": ["665c..."]
}
```

**Response** `200`: Updated class object.

---

## Circulars (Lecturer)

Lecturers can publish circulars, notices, and announcements. Students see only circulars targeted to their classes, department, or all. Admins and lecturers can view all circulars.

**Types:** `CIRCULAR`, `NOTICE`, `ANNOUNCEMENT`  
**Target types:** `CLASS` (specific class), `DEPARTMENT` (all students in department), `ALL` (everyone)  
**Priority:** `LOW`, `NORMAL`, `HIGH`, `URGENT`

### POST /v1/circulars

**Auth:** LECTURER only

**Body:**

```json
{
  "type": "ANNOUNCEMENT",
  "title": "Exam Schedule Update",
  "content": "The mid-term exam has been rescheduled to next Friday.",
  "targetType": "CLASS",
  "targetClassId": "665a1b2c3d4e5f6a7b8c9d0e",
  "priority": "HIGH",
  "isPinned": true
}
```

| Field             | Type    | Required | Notes                                                                 |
| :---------------- | :------ | :------- | :-------------------------------------------------------------------- |
| `type`            | string  | Yes      | `CIRCULAR`, `NOTICE`, or `ANNOUNCEMENT`                               |
| `title`           | string  | Yes      | Max 200 chars                                                         |
| `content`         | string  | Yes      |                                                                       |
| `targetType`      | string  | Yes      | `CLASS`, `DEPARTMENT`, or `ALL`                                       |
| `targetClassId`   | string  | Cond.    | Required when `targetType` is `CLASS`                                 |
| `targetDepartment`| string  | Cond.    | Required when `targetType` is `DEPARTMENT`                            |
| `priority`        | string  | No       | `LOW`, `NORMAL` (default), `HIGH`, `URGENT`                           |
| `isPinned`        | boolean | No       | Default: false. Pinned items appear first.                             |

**Response** `201`: Created circular object with `publishedBy` populated.

### GET /v1/circulars

**Auth:** ADMIN, LECTURER, or STUDENT

> **Role-based visibility:** Students see only circulars targeted to their classes, department, or all. Lecturers and admins see all circulars.

**Query Parameters:**

| Param             | Type    | Notes                                                              |
| :---------------- | :------ | :----------------------------------------------------------------- |
| `page`            | number  | Default: 1                                                         |
| `limit`           | number  | Default: 10                                                         |
| `type`            | string  | Filter: `CIRCULAR`, `NOTICE`, `ANNOUNCEMENT`                        |
| `targetType`      | string  | Filter: `CLASS`, `DEPARTMENT`, `ALL`                                |
| `targetClassId`   | string  | Filter by class                                                    |
| `targetDepartment`| string  | Filter by department (partial match)                                |
| `priority`        | string  | Filter: `LOW`, `NORMAL`, `HIGH`, `URGENT`                           |
| `isPinned`        | boolean | Filter by pinned status                                            |
| `myOnly`          | boolean | Lecturers only: show only circulars they published                 |
| `sortBy`          | string  | Format: `field:asc` or `field:desc` (default: pinned first, then by date) |

**Response** `200`:

```json
{
  "circulars": [
    {
      "id": "665a...",
      "type": "ANNOUNCEMENT",
      "title": "Exam Schedule Update",
      "content": "The mid-term exam has been rescheduled...",
      "publishedBy": { "id": "...", "name": "Dr. Smith", "email": "smith@example.com" },
      "targetType": "CLASS",
      "targetClassId": { "id": "...", "name": "CS 101", "department": "Computer Science" },
      "priority": "HIGH",
      "isPinned": true,
      "createdAt": "2026-03-16T10:00:00.000Z",
      "updatedAt": "2026-03-16T10:00:00.000Z"
    }
  ],
  "page": 1,
  "limit": 10,
  "totalPages": 1,
  "totalResults": 1
}
```

### GET /v1/circulars/:circularId

**Auth:** ADMIN, LECTURER, or STUDENT

Students receive `403` if the circular is not targeted to them.

**Response** `200`: Circular object with populated `publishedBy` and `targetClassId`.

### PATCH /v1/circulars/:circularId

**Auth:** LECTURER only (must be the publisher)

**Body** (at least one field):

```json
{
  "title": "Updated Title",
  "content": "Updated content",
  "priority": "URGENT",
  "isPinned": true
}
```

**Response** `200`: Updated circular object.

### DELETE /v1/circulars/:circularId

**Auth:** LECTURER only (must be the publisher)

**Response** `204`: No content.

---

## Questions (Lecturer/Admin)

All endpoints require auth with `LECTURER` or `ADMIN` role.

### POST /v1/questions

**Body:**

```json
{
  "text": "What is 2 + 2?",
  "type": "MCQ",
  "difficulty": "EASY",
  "marks": 1,
  "subject": "Mathematics",
  "topic": "Arithmetic",
  "options": [
    { "text": "3", "isCorrect": false },
    { "text": "4", "isCorrect": true },
    { "text": "5", "isCorrect": false },
    { "text": "6", "isCorrect": false }
  ]
}
```

| Field        | Type   | Required | Notes                                                     |
| :----------- | :----- | :------- | :-------------------------------------------------------- |
| `text`       | string | Yes      |                                                           |
| `type`           | string   | No       | `MCQ` (default), `SUBJECTIVE`, or `FILL_IN_BLANK`         |
| `difficulty`     | string   | No       | `EASY`, `MEDIUM` (default), `HARD`                       |
| `marks`          | number   | No       | Integer, min 1 (default: 1)                              |
| `subject`        | string   | Yes      |                                                           |
| `topic`          | string   | No       |                                                           |
| `options`        | array    | Yes*     | *Required for MCQ. Min 2 items. Not used for FILL_IN_BLANK. |
| `correctAnswers` | string[] | Yes*     | *Required for FILL_IN_BLANK. Min 1 non-empty. Case-insensitive matching. |

**Response** `201`: Question object with generated option IDs.

> **Fill-in-the-Blank:** For `type: "FILL_IN_BLANK"`, use `correctAnswers` (array of strings) instead of `options`. Answers are checked case-insensitively. See [FILL_IN_BLANK_FRONTEND_GUIDE.md](./FILL_IN_BLANK_FRONTEND_GUIDE.md) for full integration details.

### GET /v1/questions

**Query Parameters:**

| Param        | Type   | Notes                               |
| :----------- | :----- | :---------------------------------- |
| `page`       | number | Default: 1                          |
| `limit`      | number | Default: 10                         |
| `subject`    | string | Filter by subject                   |
| `topic`      | string | Filter by topic                     |
| `difficulty`  | string | `EASY`, `MEDIUM`, `HARD`            |
| `type`        | string | `MCQ`, `SUBJECTIVE`, `FILL_IN_BLANK`|
| `search`      | string | Search in question text             |
| `sortBy`     | string | Format: `field:asc` or `field:desc` |

**Response** `200`: Paginated question list.

### GET /v1/questions/:questionId

**Response** `200`: Question object with all options (including `isCorrect`).

### PATCH /v1/questions/:questionId

**Body** (at least one field):

```json
{
  "text": "Updated question?",
  "difficulty": "HARD",
  "marks": 2,
  "subject": "Physics",
  "topic": "Mechanics",
  "options": [
    { "text": "Option A", "isCorrect": true },
    { "text": "Option B", "isCorrect": false }
  ]
}
```

**Response** `200`: Updated question object.

### DELETE /v1/questions/:questionId

**Response** `204`: No content.

---

## Quizzes (Lecturer/Admin)

All endpoints require auth with `LECTURER` or `ADMIN` role.

### POST /v1/quizzes

Creates a quiz in `DRAFT` status.

**Body:**

```json
{
  "title": "Math Quiz 1",
  "description": "Basic mathematics quiz",
  "totalMarks": 10,
  "durationMinutes": 30,
  "passMarks": 5,
  "shuffleQuestions": false,
  "startTime": "2026-03-01T09:00:00.000Z",
  "endTime": "2026-03-01T11:00:00.000Z"
}
```

| Field              | Type    | Required | Notes                        |
| :----------------- | :------ | :------- | :--------------------------- |
| `title`            | string  | Yes      |                              |
| `description`      | string  | No       |                              |
| `totalMarks`       | number  | Yes      | Integer, min 1               |
| `durationMinutes`  | number  | No       | Integer, min 1 (default: 60) |
| `passMarks`        | number  | No       | Integer                      |
| `shuffleQuestions` | boolean | No       | Default: false               |
| `startTime`        | string  | No       | ISO 8601 datetime            |
| `endTime`          | string  | No       | ISO 8601 datetime            |

**Response** `201`: Quiz object.

### GET /v1/quizzes

> **Role-based filtering:** Lecturers see only quizzes they created. Admins see all quizzes.

**Query Parameters:**

| Param    | Type   | Notes                               |
| :------- | :----- | :---------------------------------- |
| `page`   | number | Default: 1                          |
| `limit`  | number | Default: 10                         |
| `title`  | string | Filter: partial match               |
| `status` | string | `DRAFT`, `PUBLISHED`, `ARCHIVED`    |
| `sortBy` | string | Format: `field:asc` or `field:desc` |

**Response** `200`:

```json
{
  "quizzes": [
    {
      "id": "665a...",
      "title": "Math Quiz 1",
      "status": "DRAFT",
      "totalMarks": 10,
      "durationMinutes": 30,
      "_count": {
        "questions": 5,
        "assignedClasses": 2
      },
      ...
    }
  ],
  "page": 1,
  "limit": 10,
  "totalPages": 1,
  "totalResults": 3
}
```

Note: The list response includes `_count` with question and class counts.

### GET /v1/quizzes/:quizId

Returns quiz with populated questions and assigned classes.

**Response** `200`:

```json
{
  "id": "665a...",
  "title": "Math Quiz 1",
  "status": "PUBLISHED",
  "totalMarks": 10,
  "durationMinutes": 30,
  "questions": [
    {
      "question": {
        "id": "665b...",
        "text": "What is 2+2?",
        "options": [ ... ],
        ...
      }
    }
  ],
  "assignedClasses": [
    {
      "class": {
        "id": "665c...",
        "name": "CS 101",
        ...
      }
    }
  ],
  ...
}
```

Note: Questions and classes are wrapped as `{ question: {...} }` and `{ class: {...} }`.

### PATCH /v1/quizzes/:quizId

**Body** (at least one field):

```json
{
  "title": "Updated Title",
  "startTime": "2026-03-01T09:00:00.000Z",
  "endTime": "2026-03-01T11:00:00.000Z"
}
```

Validation: `startTime` must be before `endTime` when both are provided.

**Response** `200`: Updated quiz object.

### DELETE /v1/quizzes/:quizId

**Response** `204`: No content.

### POST /v1/quizzes/:quizId/questions

Add questions to a quiz. Duplicates are safely ignored.

**Body:**

```json
{
  "questionIds": ["665b...", "665c..."]
}
```

**Response** `200`: Updated quiz object (with populated questions and classes).

### POST /v1/quizzes/:quizId/publish

Publish a quiz to specific classes. Changes status to `PUBLISHED`.

**Prerequisites:**

- Quiz must have at least one question
- Quiz must have `startTime` and `endTime` set

**Body:**

```json
{
  "classIds": ["665d...", "665e..."]
}
```

**Response** `200`: Updated quiz object.

---

## Exam (Student Only)

All endpoints require auth with `STUDENT` role.

### GET /v1/exam/quizzes

List quizzes available for the logged-in student. Returns published quizzes assigned to the student's enrolled classes, split into **active** (can start now), **upcoming** (starts in the future), and **completed** (already submitted).

> **Note:** Stale attempts (where the quiz `endTime` has passed or the attempt duration has exceeded the quiz `durationMinutes`) are automatically expired when listing quizzes.

**Response** `200`:

```json
{
  "active": [
    {
      "id": "665a...",
      "title": "Math Quiz",
      "description": "...",
      "durationMinutes": 30,
      "totalMarks": 10,
      "passMarks": 6,
      "startTime": "2026-03-01T09:00:00.000Z",
      "endTime": "2026-03-01T11:00:00.000Z",
      "createdBy": { "id": "...", "name": "Dr. Smith", "email": "smith@example.com" },
      "createdAt": "...",
      "updatedAt": "..."
    }
  ],
  "upcoming": [
    {
      "id": "665b...",
      "title": "Physics Exam",
      "description": "...",
      "durationMinutes": 60,
      "totalMarks": 20,
      "passMarks": 12,
      "startTime": "2026-03-15T10:00:00.000Z",
      "endTime": "2026-03-15T12:00:00.000Z",
      "createdBy": { "id": "...", "name": "Dr. Jones", "email": "jones@example.com" },
      "createdAt": "...",
      "updatedAt": "..."
    }
  ],
  "completed": [
    {
      "id": "665c...",
      "title": "Chemistry Quiz",
      "description": "...",
      "durationMinutes": 20,
      "totalMarks": 15,
      "passMarks": 9,
      "startTime": "2026-03-10T09:00:00.000Z",
      "endTime": "2026-03-10T10:00:00.000Z",
      "createdBy": { "id": "...", "name": "Dr. Brown", "email": "brown@example.com" },
      "attemptId": "665d...",
      "score": 12,
      "totalMarks": 15
    }
  ]
}
```

| Field       | Type  | Description                                                                 |
| :---------- | :---- | :-------------------------------------------------------------------------- |
| `active`    | array | Quizzes that have started and not ended — student can start an attempt now  |
| `upcoming`  | array | Quizzes that have not started yet — use `startTime` for countdown display   |
| `completed` | array | Quizzes the student has submitted — includes `attemptId`, `score`; show "View Results" |

**Countdown for upcoming quizzes:** Use `startTime` (ISO 8601) to compute time until the quiz starts. Example:

```javascript
// Countdown until quiz starts
const startTime = new Date(quiz.startTime);
const now = new Date();
const msUntilStart = startTime - now;
if (msUntilStart > 0) {
  const days = Math.floor(msUntilStart / 86400000);
  const hours = Math.floor((msUntilStart % 86400000) / 3600000);
  const minutes = Math.floor((msUntilStart % 3600000) / 60000);
  // Display: "Starts in 2 days, 5 hours, 30 minutes"
}
```

### POST /v1/exam/quizzes/:quizId/start

Start a quiz attempt. Returns sanitized questions (without correct answers).

For `SUBJECTIVE` and `FILL_IN_BLANK` type questions, the `options` array will be empty. FILL_IN_BLANK uses `textAnswer` (same as SUBJECTIVE) and is auto-graded with case-insensitive matching.

> **Note:** Stale attempts for the quiz are automatically expired before starting a new attempt.

**Errors:**

- `400` "Quiz is not active" -- quiz not published
- `400` "Quiz has not started yet" -- before startTime
- `400` "Quiz has expired" -- after endTime
- `400` "You have already submitted this quiz" -- already submitted

**Response** `200`:

```json
{
  "attempt": {
    "id": "665f...",
    "quiz": "665a...",
    "student": "665g...",
    "status": "STARTED",
    "startTime": "2026-03-01T09:05:00.000Z",
    "responses": [],
    "createdAt": "...",
    "updatedAt": "..."
  },
  "questions": [
    {
      "id": "665b...",
      "text": "What is 2+2?",
      "type": "MCQ",
      "marks": 1,
      "options": [
        { "id": "665c01...", "text": "3" },
        { "id": "665c02...", "text": "4" },
        { "id": "665c03...", "text": "5" }
      ]
    },
    {
      "id": "665d...",
      "text": "The capital of France is ___.",
      "type": "FILL_IN_BLANK",
      "marks": 1,
      "options": []
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

### POST /v1/exam/attempts/:attemptId/submit

Submit answers for a quiz attempt. Supports MCQ, SUBJECTIVE, and FILL_IN_BLANK question types.

**Body:**

```json
{
  "responses": [
    { "questionId": "665b...", "selectedOptionId": "665c02..." },
    { "questionId": "665d...", "textAnswer": "Paris" },
    { "questionId": "665e...", "textAnswer": "Polymorphism is the ability of..." }
  ]
}
```

| Field                          | Type   | Required    | Notes                             |
| :----------------------------- | :----- | :---------- | :-------------------------------- |
| `responses`                    | array  | Yes         |                                   |
| `responses[].questionId`       | string | Yes         |                                   |
| `responses[].selectedOptionId` | string | Conditional | Required for MCQ (single correct)  |
| `responses[].selectedOptionIds`| array  | Conditional | Required for MCQ (multiple correct)|
| `responses[].textAnswer`      | string | Conditional | Required for SUBJECTIVE and FILL_IN_BLANK |

**Errors:**

- `400` "Attempt has expired" -- attempt auto-expired due to time limit

**Response** `200`:

```json
{
  "message": "Quiz submitted successfully",
  "score": 8,
  "totalMarks": 10,
  "pendingGrading": true
}
```

The `pendingGrading` flag is `true` when the quiz contains SUBJECTIVE questions that still need to be graded by a lecturer or admin. The `score` reflects MCQ and FILL_IN_BLANK (auto-graded) marks; it will update once subjective questions are graded.

---

## Student Stats

### GET /v1/exam/my-stats

**Auth:** STUDENT only

Get the logged-in student's own performance summary and attempt history across all quizzes.

**Response** `200`:

```json
{
  "student": {
    "id": "665g...",
    "name": "Student Name",
    "email": "student@example.com"
  },
  "summary": {
    "totalAttempts": 5,
    "averagePercentage": 76.4,
    "quizzesPassed": 4,
    "quizzesFailed": 1
  },
  "attempts": [
    {
      "id": "665f...",
      "quizTitle": "Math Quiz 1",
      "score": 8,
      "totalMarks": 10,
      "percentage": 80.0,
      "passed": true,
      "date": "2026-03-01T10:45:00.000Z"
    }
  ]
}
```

Attempts are sorted by date (most recent first). `passed` is `null` if the quiz has no `passMarks` set.

---

## Attempts (All Roles)

### GET /v1/exam/attempts

**Auth:** STUDENT, LECTURER, or ADMIN

**Role-based scoping:**

- **STUDENT**: sees only their own attempts
- **LECTURER**: sees attempts for quizzes they created
- **ADMIN**: sees all attempts

**Query Parameters:**

| Param       | Type   | Notes                                                           |
| :---------- | :----- | :-------------------------------------------------------------- |
| `page`      | number | Default: 1                                                      |
| `limit`     | number | Default: 10                                                     |
| `sortBy`    | string | Format: `field:asc` or `field:desc` (e.g., `submittedAt:desc`)  |
| `quizId`    | string | Filter by quiz ID                                               |
| `studentId` | string | Filter by student ID (LECTURER/ADMIN only, ignored for STUDENT) |
| `status`    | string | `STARTED`, `SUBMITTED`, `EXPIRED`                               |

**Response** `200`:

```json
{
  "attempts": [
    {
      "id": "665f...",
      "quiz": {
        "id": "665a...",
        "title": "Math Quiz 1",
        "totalMarks": 10,
        "passMarks": 5,
        "durationMinutes": 30
      },
      "student": {
        "id": "665g...",
        "name": "Student Name",
        "email": "student@example.com"
      },
      "status": "SUBMITTED",
      "score": 8,
      "startTime": "2026-03-01T09:05:00.000Z",
      "endTime": "2026-03-01T09:35:00.000Z",
      "responses": [ ... ],
      "createdAt": "...",
      "updatedAt": "..."
    }
  ],
  "page": 1,
  "limit": 10,
  "totalPages": 3,
  "totalResults": 25
}
```

### GET /v1/exam/attempts/:attemptId

**Auth:** STUDENT, LECTURER, or ADMIN

Get a single attempt by ID with populated quiz and student details.

**Role-based access:**

- **STUDENT**: can only view their own attempts
- **LECTURER**: can only view attempts for quizzes they created
- **ADMIN**: can view any attempt

**Response** `200`:

```json
{
  "id": "665f...",
  "quiz": {
    "id": "665a...",
    "title": "Math Quiz 1",
    "totalMarks": 10,
    "passMarks": 5,
    "durationMinutes": 30
  },
  "student": {
    "id": "665g...",
    "name": "Student Name",
    "email": "student@example.com"
  },
  "status": "SUBMITTED",
  "score": 8,
  "startTime": "2026-03-01T09:05:00.000Z",
  "endTime": "2026-03-01T09:35:00.000Z",
  "responses": [
    {
      "questionId": "665b...",
      "selectedOptionId": "665c02...",
      "isGraded": true,
      "awardedMarks": 1
    }
  ],
  "createdAt": "...",
  "updatedAt": "..."
}
```

**Errors:**

- `403` "You can only view your own attempts" (STUDENT accessing another student's attempt)
- `403` "You can only view attempts for your own quizzes" (LECTURER accessing another lecturer's quiz attempt)

---

## Grading (Lecturer/Admin)

All endpoints require auth with `LECTURER` or `ADMIN` role.

### POST /v1/exam/attempts/:attemptId/grade

Grade subjective questions for a submitted quiz attempt.

**Body:**

```json
{
  "grades": [
    { "questionId": "665d...", "awardedMarks": 5 },
    { "questionId": "665e...", "awardedMarks": 3 }
  ]
}
```

| Field                   | Type   | Required | Notes                          |
| :---------------------- | :----- | :------- | :----------------------------- |
| `grades`                | array  | Yes      |                                |
| `grades[].questionId`   | string | Yes      | ID of the subjective question  |
| `grades[].awardedMarks` | number | Yes      | Marks awarded for the response |

**Response** `200`:

```json
{
  "message": "All responses graded",
  "score": 8,
  "totalMarks": 10,
  "allGraded": true
}
```

| Field        | Type    | Notes                                                     |
| :----------- | :------ | :-------------------------------------------------------- |
| `message`    | string  | `"All responses graded"` or `"Partial grading saved"`     |
| `score`      | number  | Current total score (MCQ auto-scored + graded subjective) |
| `totalMarks` | number  | Maximum possible marks for the quiz                       |
| `allGraded`  | boolean | `true` when all subjective responses have been graded     |

---

## Analytics (Lecturer/Admin)

All endpoints require auth with `LECTURER` or `ADMIN` role.

### GET /v1/analytics/results/:quizId

Get statistics and all student results for a quiz.

**Response** `200`:

```json
{
  "quiz": {
    "title": "Math Quiz 1",
    "totalMarks": 10,
    "passMarks": 5
  },
  "stats": {
    "totalAttempts": 25,
    "averageScore": 7.52,
    "highestScore": 10,
    "lowestScore": 2,
    "passedCount": 20,
    "failedCount": 5,
    "passRate": 80.00
  },
  "results": [
    {
      "id": "665f...",
      "student": {
        "id": "665g...",
        "name": "Student Name",
        "email": "student@example.com"
      },
      "score": 10,
      "status": "SUBMITTED",
      "startTime": "...",
      "endTime": "...",
      "responses": [ ... ]
    }
  ]
}
```

Results are sorted by score (highest first).

### GET /v1/analytics/student/:studentId

Get a student's performance history across all quizzes.

**Response** `200`:

```json
{
  "student": {
    "id": "665g...",
    "name": "Student Name",
    "email": "student@example.com"
  },
  "attempts": [
    {
      "id": "665f...",
      "quizTitle": "Math Quiz 1",
      "score": 8,
      "totalMarks": 10,
      "percentage": 80.0,
      "passed": true,
      "date": "2026-03-01T10:45:00.000Z"
    }
  ],
  "summary": {
    "totalAttempts": 5,
    "averagePercentage": 76.4,
    "quizzesPassed": 4,
    "quizzesFailed": 1
  }
}
```

Attempts are sorted by date (most recent first). `passed` is `null` if the quiz has no `passMarks` set.

### GET /v1/analytics/questions/:quizId

Get per-question analysis for a quiz. Useful for identifying problematic questions.

**Response** `200`:

```json
{
  "quiz": {
    "title": "Math Quiz 1",
    "totalMarks": 10
  },
  "questions": [
    {
      "questionId": "665b...",
      "text": "What is 2+2?",
      "type": "MCQ",
      "difficulty": "EASY",
      "marks": 1,
      "attemptedCount": 25,
      "correctCount": 22,
      "correctRate": 88.0,
      "averageMarks": 0.88
    },
    {
      "questionId": "665d...",
      "text": "Explain polymorphism.",
      "type": "SUBJECTIVE",
      "difficulty": "HARD",
      "marks": 5,
      "attemptedCount": 25,
      "correctCount": 0,
      "correctRate": 0,
      "averageMarks": 3.2
    }
  ]
}
```

### GET /v1/analytics/difficulty/:quizId

Get difficulty-wise breakdown for a quiz. Shows how students performed across different difficulty levels.

**Response** `200`:

```json
{
  "quiz": {
    "title": "Math Quiz 1",
    "totalMarks": 10
  },
  "difficulties": [
    {
      "difficulty": "EASY",
      "questionCount": 3,
      "totalMarks": 3,
      "correctRate": 90.0,
      "averageScore": 2.7
    },
    {
      "difficulty": "MEDIUM",
      "questionCount": 4,
      "totalMarks": 4,
      "correctRate": 65.0,
      "averageScore": 2.6
    },
    {
      "difficulty": "HARD",
      "questionCount": 1,
      "totalMarks": 3,
      "correctRate": 40.0,
      "averageScore": 1.2
    }
  ]
}
```

---

## Health Check

### GET /health

No auth required. Returns `{ "status": "ok", "timestamp": "...", "message": "Server is running" }`.

### GET /v1/health

No auth required. Returns health check with version info.

---

## Notifications (All Roles)

Notifications are created automatically when circulars are published, quizzes are assigned, attempts are graded, or students are enrolled in classes. All authenticated users can list and manage their own notifications.

**See [NOTIFICATIONS_API_GUIDE.md](NOTIFICATIONS_API_GUIDE.md) for the complete API reference**, including:

- `GET /v1/notifications` — List notifications (paginated)
- `GET /v1/notifications/unread-count` — Unread count for badge
- `PATCH /v1/notifications/:notificationId/read` — Mark one as read
- `PATCH /v1/notifications/read-all` — Mark all as read

---

## Data Models

### User

```typescript
{
  id: string;            // MongoDB ObjectId
  email: string;
  name: string;
  role: "ADMIN" | "LECTURER" | "STUDENT";
  isActive: boolean;
  isDeleted: boolean;    // true if soft-deleted
  deletedAt?: string;    // ISO 8601, set when soft-deleted
  createdAt: string;     // ISO 8601
  updatedAt: string;
}
```

Note: `password` is never included in responses. Soft-deleted users (`isDeleted: true`) are automatically excluded from all API query results.

### Class

```typescript
{
  id: string;
  name: string;
  department: string;
  academicYear: string;
  semester: number;
  students: string[] | User[];    // ObjectId array or populated User objects
  lecturers: string[] | User[];
  createdAt: string;
  updatedAt: string;
}
```

### Question

```typescript
{
  id: string;
  text: string;
  type: "MCQ" | "SUBJECTIVE" | "FILL_IN_BLANK";
  difficulty: "EASY" | "MEDIUM" | "HARD";
  marks: number;
  subject: string;
  topic?: string;
  options?: {
    _id: string;       // Option ID (use this as selectedOptionId)
    text: string;
    isCorrect: boolean; // Hidden from students during exams
  }[];
  correctAnswers?: string[];  // FILL_IN_BLANK only; never sent to students
  createdAt: string;
  updatedAt: string;
}
```

### Quiz

```typescript
{
  id: string;
  title: string;
  description?: string;
  createdBy: string;         // User ID
  durationMinutes: number;
  totalMarks: number;
  passMarks?: number;
  shuffleQuestions: boolean;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  startTime?: string;        // ISO 8601
  endTime?: string;
  questions: string[];        // Question IDs (or populated objects on detail)
  assignedClasses: string[];  // Class IDs (or populated objects on detail)
  createdAt: string;
  updatedAt: string;
}
```

### QuizAttempt

```typescript
{
  id: string;
  quiz: string;              // Quiz ID
  student: string;           // User ID
  status: "STARTED" | "SUBMITTED" | "EXPIRED";
  score?: number;
  startTime: string;
  endTime?: string;
  responses: {
    questionId: string;
    selectedOptionId?: string;   // For MCQ (single correct)
    selectedOptionIds?: string[];// For MCQ (multiple correct)
    textAnswer?: string;         // For SUBJECTIVE and FILL_IN_BLANK
    awardedMarks?: number;      // Marks given (auto for MCQ/FILL_IN_BLANK, manual for SUBJECTIVE)
    isGraded: boolean;          // Whether this response has been graded
  }[];
  createdAt: string;
  updatedAt: string;
}
```

> **Note on auto-expiration:** Attempts with status `STARTED` are automatically moved to `EXPIRED` when the quiz `endTime` passes or when the elapsed time exceeds the quiz `durationMinutes`. This check runs automatically when listing quizzes, starting attempts, and submitting attempts. Expired attempts cannot be submitted.

### Tokens

```typescript
{
  access: {
    token: string; // JWT access token
    expires: string; // ISO 8601 (default: 30 minutes from issue)
  }
  refresh: {
    token: string; // JWT refresh token
    expires: string; // ISO 8601 (default: 30 days from issue)
  }
}
```

---

## Pagination

All list endpoints support pagination with consistent response format:

```json
{
  "<items_key>": [ ... ],
  "page": 1,
  "limit": 10,
  "totalPages": 5,
  "totalResults": 42
}
```

The items key varies: `users`, `quizzes`, etc. Default: page 1, limit 10.

**Sorting:** Use `sortBy=field:asc` or `sortBy=field:desc`. Default sort is `createdAt:desc`.

---

## Rate Limiting

Rate limiting is applied in **production** mode only.

| Scope                         | Limit        | Window     |
| :---------------------------- | :----------- | :--------- |
| General (all endpoints)       | 100 requests | 15 minutes |
| Auth endpoints (`/v1/auth/*`) | 20 requests  | 15 minutes |

When the limit is exceeded, the API returns:

**Response** `429`:

```json
{
  "message": "Too many requests, please try again later."
}
```

---

## Input Sanitization

All request data (body, query parameters, and URL parameters) is automatically sanitized against XSS attacks. Request body size is limited to **1 MB**.

---

## Error Responses

All errors follow this format:

```json
{
  "code": 400,
  "message": "Descriptive error message"
}
```

In development mode, a `stack` field with the stack trace is also included.

| Status | Meaning           | Typical Cause                             |
| :----- | :---------------- | :---------------------------------------- |
| `400`  | Bad Request       | Validation error, business rule violation |
| `401`  | Unauthorized      | Missing/invalid/expired token             |
| `403`  | Forbidden         | User lacks required role                  |
| `404`  | Not Found         | Resource doesn't exist                    |
| `429`  | Too Many Requests | Rate limit exceeded                       |
