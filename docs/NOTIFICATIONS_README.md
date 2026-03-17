# Notifications Service

In-app notifications for circulars, quiz publications, grading results, and class enrollments. Users receive notifications when relevant events occur; the frontend polls the API to display them.

**Base URL:** `http://localhost:4000/v1/notifications` (or your deployed API URL)

---

## Overview

| Concept | Description |
| :------ | :---------- |
| **Purpose** | In-app notifications for key platform events |
| **Delivery** | REST API only. Frontend polls for updates (e.g. every 30–60 seconds) |
| **Access** | All authenticated users see only their own notifications |

### Notification Types

| Type | Trigger | Recipients |
| :--- | :------ | :--------- |
| `CIRCULAR` | Lecturer creates a circular/notice/announcement | Students in target class/department/all |
| `QUIZ_PUBLISHED` | Lecturer publishes a quiz to classes | Students in assigned classes |
| `ATTEMPT_GRADED` | Lecturer grades a quiz attempt | The student who took the quiz |
| `CLASS_ENROLLED` | Admin assigns students to a class | The enrolled students |

---

## How It Works

### Backend Flow

1. **Event occurs** — Circular created, quiz published, attempt graded, or students enrolled.
2. **Service triggers notification** — `notification.service` is called (fire-and-forget; does not block the main operation).
3. **Target users resolved** — Based on event type (e.g. class students, department students, single student).
4. **Notifications created** — One document per recipient in the `Notification` collection.
5. **Frontend polls** — Client fetches notifications via REST API.

### Trigger Points (Backend)

| Event | Service | Method |
| :---- | :------ | :----- |
| Circular created | `circular.service` | `notifyCircularCreated()` |
| Quiz published | `quiz.service` | `notifyQuizPublished()` |
| Attempt graded | `exam.service` | `notifyAttemptGraded()` |
| Students enrolled | `class.service` | `notifyClassEnrolled()` |

Notification creation is **non-blocking**: if it fails, the main operation still succeeds. Errors are logged only.

---

## Authentication

All endpoints require a Bearer token:

```
Authorization: Bearer <access_token>
```

---

## Endpoints

| Method | Path | Description |
| :----- | :--- | :---------- |
| `GET` | `/v1/notifications` | List notifications (paginated) |
| `GET` | `/v1/notifications/unread-count` | Get unread count (for badge) |
| `PATCH` | `/v1/notifications/:notificationId/read` | Mark one as read |
| `PATCH` | `/v1/notifications/read-all` | Mark all as read |

---

## List (GET /v1/notifications)

**Auth:** ADMIN, LECTURER, or STUDENT

### Query Parameters

| Param | Type | Default | Notes |
| :---- | :--- | :----- | :---- |
| `page` | number | 1 | Page number |
| `limit` | number | 10 | Items per page |
| `read` | boolean | — | Filter: `true` = read only, `false` = unread only |
| `type` | string | — | Filter: `CIRCULAR`, `QUIZ_PUBLISHED`, `ATTEMPT_GRADED`, `CLASS_ENROLLED` |
| `sortBy` | string | — | Format: `field:asc` or `field:desc` (e.g. `createdAt:desc`) |

### Response `200`

```json
{
  "notifications": [
    {
      "id": "665a1b2c3d4e5f6a7b8c9d0e",
      "userId": "665a1b2c3d4e5f6a7b8c9d01",
      "type": "CIRCULAR",
      "title": "New notice: Exam Schedule Update",
      "message": "The mid-term exam has been rescheduled to next Friday.",
      "link": "/circulars/665a1b2c3d4e5f6a7b8c9d02",
      "metadata": { "circularId": "665a1b2c3d4e5f6a7b8c9d02" },
      "read": false,
      "readAt": null,
      "createdAt": "2026-03-17T10:00:00.000Z",
      "updatedAt": "2026-03-17T10:00:00.000Z"
    }
  ],
  "page": 1,
  "limit": 10,
  "totalPages": 1,
  "totalResults": 1
}
```

---

## Unread Count (GET /v1/notifications/unread-count)

**Auth:** ADMIN, LECTURER, or STUDENT

Use for badge or indicator.

### Response `200`

```json
{
  "count": 5
}
```

---

## Mark One as Read (PATCH /v1/notifications/:notificationId/read)

**Auth:** ADMIN, LECTURER, or STUDENT

### Response `200`

Returns the updated notification object with `read: true` and `readAt` set.

### Response `404`

Notification not found or does not belong to the current user.

---

## Mark All as Read (PATCH /v1/notifications/read-all)

**Auth:** ADMIN, LECTURER, or STUDENT

### Response `204`

No content.

---

## Notification Object

| Field | Type | Description |
| :---- | :--- | :---------- |
| `id` | string | Notification ID |
| `userId` | string | Recipient user ID |
| `type` | string | `CIRCULAR`, `QUIZ_PUBLISHED`, `ATTEMPT_GRADED`, `CLASS_ENROLLED` |
| `title` | string | Short summary |
| `message` | string \| null | Optional detail (e.g. score for graded attempts) |
| `link` | string \| null | Deep link path for navigation |
| `metadata` | object | Reference IDs (`circularId`, `quizId`, `attemptId`, `classId`) |
| `read` | boolean | Whether marked as read |
| `readAt` | string \| null | ISO 8601 when marked read |
| `createdAt` | string | ISO 8601 timestamp |
| `updatedAt` | string | ISO 8601 timestamp |

---

## Navigation from Notifications

Use `link` and `metadata` to route the user when they tap/click:

| Type | link | metadata |
| :--- | :--- | :------- |
| `CIRCULAR` | `/circulars/:id` | `circularId` |
| `QUIZ_PUBLISHED` | `/exam/quizzes` | `quizId` |
| `ATTEMPT_GRADED` | `/exam/attempts/:id` | `attemptId` |
| `CLASS_ENROLLED` | `/classes/:id` | `classId` |

---

## Frontend Integration

1. **Badge** — Poll `GET /v1/notifications/unread-count` every 30–60 seconds.
2. **List** — Call `GET /v1/notifications` when opening the notifications panel.
3. **Mark read** — Call `PATCH .../read` when a notification is opened; `PATCH .../read-all` for "Mark all as read".
4. **Navigate** — Use `link` or `metadata` to route on click.

---

## Further Reading

- **[NOTIFICATIONS_API_GUIDE.md](./NOTIFICATIONS_API_GUIDE.md)** — Full API reference, TypeScript types, React hook examples, and error handling.
