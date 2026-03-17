# Notifications API Guide

Complete guide for the frontend team to integrate the notification system. Users receive notifications when new circulars/notices are published, quizzes are assigned, attempts are graded, or they are enrolled in a class.

**Base URL:** `http://localhost:4000/v1/notifications` (or your deployed API URL)

---

## Overview

| Concept | Description |
| :------ | :---------- |
| **Purpose** | In-app notifications for circulars, quiz publications, grading results, and class enrollments |
| **Delivery** | REST API only. Frontend should poll for updates (e.g. every 30–60 seconds) |
| **Access** | All authenticated users (ADMIN, LECTURER, STUDENT) see only their own notifications |

### Notification Types

| Type | Trigger | Typical Recipients |
| :--- | :------ | :----------------- |
| `CIRCULAR` | Lecturer creates a circular/notice/announcement | Students in target class/department/all |
| `QUIZ_PUBLISHED` | Lecturer publishes a quiz to classes | Students in assigned classes |
| `ATTEMPT_GRADED` | Lecturer grades a quiz attempt | The student who took the quiz |
| `CLASS_ENROLLED` | Admin assigns students to a class | The enrolled students |

---

## Authentication

All endpoints require a Bearer token:

```
Authorization: Bearer <access_token>
Content-Type: application/json
```

---

## Endpoints Summary

| Method | Path | Description |
| :----- | :--- | :---------- |
| `GET` | `/v1/notifications` | List notifications (paginated) |
| `GET` | `/v1/notifications/unread-count` | Get unread count |
| `PATCH` | `/v1/notifications/:notificationId/read` | Mark one as read |
| `PATCH` | `/v1/notifications/read-all` | Mark all as read |

---

## List Notifications (GET /v1/notifications)

**Auth:** ADMIN, LECTURER, or STUDENT

Returns paginated notifications for the authenticated user.

### Query Parameters

| Param | Type | Default | Notes |
| :---- | :--- | :----- | :---- |
| `page` | number | 1 | Page number |
| `limit` | number | 10 | Items per page |
| `read` | boolean | — | Filter: `true` = read only, `false` = unread only |
| `type` | string | — | Filter: `CIRCULAR`, `QUIZ_PUBLISHED`, `ATTEMPT_GRADED`, `CLASS_ENROLLED` |
| `sortBy` | string | — | Format: `field:asc` or `field:desc` (e.g. `createdAt:desc`) |

### Example Request

```
GET /v1/notifications?page=1&limit=10&read=false
```

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
      "metadata": {
        "circularId": "665a1b2c3d4e5f6a7b8c9d02"
      },
      "read": false,
      "readAt": null,
      "createdAt": "2026-03-17T10:00:00.000Z",
      "updatedAt": "2026-03-17T10:00:00.000Z"
    },
    {
      "id": "665a1b2c3d4e5f6a7b8c9d0f",
      "userId": "665a1b2c3d4e5f6a7b8c9d01",
      "type": "QUIZ_PUBLISHED",
      "title": "New quiz available: Math Quiz 1",
      "message": null,
      "link": "/exam/quizzes",
      "metadata": {
        "quizId": "665a1b2c3d4e5f6a7b8c9d03"
      },
      "read": false,
      "readAt": null,
      "createdAt": "2026-03-17T09:30:00.000Z",
      "updatedAt": "2026-03-17T09:30:00.000Z"
    }
  ],
  "page": 1,
  "limit": 10,
  "totalPages": 1,
  "totalResults": 2
}
```

### Notification Object Fields

| Field | Type | Description |
| :---- | :--- | :---------- |
| `id` | string | Notification ID |
| `userId` | string | Recipient user ID (always the current user) |
| `type` | string | `CIRCULAR`, `QUIZ_PUBLISHED`, `ATTEMPT_GRADED`, `CLASS_ENROLLED` |
| `title` | string | Short summary |
| `message` | string \| null | Optional detail (e.g. score for graded attempts) |
| `link` | string \| null | Deep link path (e.g. `/circulars/:id`, `/exam/quizzes`, `/exam/attempts/:id`) |
| `metadata` | object | Reference IDs for navigation |
| `read` | boolean | Whether the user has marked it as read |
| `readAt` | string \| null | ISO 8601 timestamp when marked read |
| `createdAt` | string | ISO 8601 timestamp |
| `updatedAt` | string | ISO 8601 timestamp |

### Metadata by Type

| Type | metadata fields | Use for |
| :--- | :-------------- | :------ |
| `CIRCULAR` | `circularId` | Navigate to circular detail |
| `QUIZ_PUBLISHED` | `quizId` | Navigate to exam/quizzes list or quiz |
| `ATTEMPT_GRADED` | `attemptId` | Navigate to attempt result |
| `CLASS_ENROLLED` | `classId` | Navigate to class detail |

---

## Unread Count (GET /v1/notifications/unread-count)

**Auth:** ADMIN, LECTURER, or STUDENT

Returns the number of unread notifications. Use this for a badge or indicator.

### Example Request

```
GET /v1/notifications/unread-count
```

### Response `200`

```json
{
  "count": 5
}
```

---

## Mark One as Read (PATCH /v1/notifications/:notificationId/read)

**Auth:** ADMIN, LECTURER, or STUDENT

Marks a single notification as read. Users can only mark their own notifications.

### Path Parameters

| Param | Type | Required |
| :---- | :--- | :------- |
| `notificationId` | string | Yes |

### Example Request

```
PATCH /v1/notifications/665a1b2c3d4e5f6a7b8c9d0e/read
```

No request body.

### Response `200`

Returns the updated notification object:

```json
{
  "id": "665a1b2c3d4e5f6a7b8c9d0e",
  "userId": "665a1b2c3d4e5f6a7b8c9d01",
  "type": "CIRCULAR",
  "title": "New notice: Exam Schedule Update",
  "message": "The mid-term exam has been rescheduled...",
  "link": "/circulars/665a1b2c3d4e5f6a7b8c9d02",
  "metadata": { "circularId": "665a1b2c3d4e5f6a7b8c9d02" },
  "read": true,
  "readAt": "2026-03-17T10:15:00.000Z",
  "createdAt": "2026-03-17T10:00:00.000Z",
  "updatedAt": "2026-03-17T10:15:00.000Z"
}
```

### Response `404`

```json
{
  "message": "Notification not found"
}
```

Returned when the notification does not exist or does not belong to the current user.

---

## Mark All as Read (PATCH /v1/notifications/read-all)

**Auth:** ADMIN, LECTURER, or STUDENT

Marks all notifications for the current user as read.

### Example Request

```
PATCH /v1/notifications/read-all
```

No request body.

### Response `204`

No content.

---

## Error Responses

| Status | When |
| :----- | :--- |
| `401` | Missing or invalid Bearer token |
| `403` | Forbidden (should not occur for notifications) |
| `404` | Notification not found (mark single as read) |
| `400` | Invalid query params (e.g. invalid `notificationId`) |

Error body format:

```json
{
  "message": "Please authenticate"
}
```

---

## Frontend Integration

### Polling Strategy

Since there is no real-time push, poll the API at a reasonable interval:

- **Unread badge:** Poll `GET /v1/notifications/unread-count` every 30–60 seconds when the user is active.
- **Notification list:** Poll `GET /v1/notifications` when the user opens the notifications panel, or on a longer interval (e.g. 60 seconds) if the panel is open.

### Example: Fetch Notifications

```javascript
const API_BASE = 'http://localhost:4000/v1';

async function getNotifications(accessToken, options = {}) {
  const { page = 1, limit = 10, read, type } = options;
  const params = new URLSearchParams({ page, limit });
  if (read !== undefined) params.set('read', read);
  if (type) params.set('type', type);

  const res = await fetch(`${API_BASE}/notifications?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error((await res.json()).message || 'Failed to fetch');
  return res.json();
}
```

### Example: Unread Count

```javascript
async function getUnreadCount(accessToken) {
  const res = await fetch(`${API_BASE}/notifications/unread-count`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error((await res.json()).message || 'Failed to fetch');
  const { count } = await res.json();
  return count;
}
```

### Example: Mark as Read

```javascript
async function markNotificationAsRead(accessToken, notificationId) {
  const res = await fetch(
    `${API_BASE}/notifications/${notificationId}/read`,
    {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  if (!res.ok) throw new Error((await res.json()).message || 'Failed to mark as read');
  return res.status === 204 ? null : res.json();
}
```

### Example: Mark All as Read

```javascript
async function markAllNotificationsAsRead(accessToken) {
  const res = await fetch(`${API_BASE}/notifications/read-all`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error((await res.json()).message || 'Failed to mark all as read');
}
```

### Example: React Hook for Polling Unread Count

```javascript
import { useState, useEffect, useCallback } from 'react';

function useUnreadCount(accessToken, pollIntervalMs = 45000) {
  const [count, setCount] = useState(0);
  const [error, setError] = useState(null);

  const fetchCount = useCallback(async () => {
    if (!accessToken) return;
    try {
      const res = await fetch(`${API_BASE}/notifications/unread-count`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const { count } = await res.json();
        setCount(count);
        setError(null);
      }
    } catch (err) {
      setError(err.message);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchCount();
    const id = setInterval(fetchCount, pollIntervalMs);
    return () => clearInterval(id);
  }, [fetchCount, pollIntervalMs]);

  return { count, error, refetch: fetchCount };
}
```

---

## Navigation from Notifications

Use the `link` and `metadata` fields to route the user when they tap/click a notification:

| Type | link | Suggested route |
| :--- | :--- | :--------------- |
| `CIRCULAR` | `/circulars/:id` | Circular detail page |
| `QUIZ_PUBLISHED` | `/exam/quizzes` | Exam/quizzes list |
| `ATTEMPT_GRADED` | `/exam/attempts/:id` | Attempt result page |
| `CLASS_ENROLLED` | `/classes/:id` | Class detail page |

If your app uses different paths, map from `metadata` (e.g. `metadata.circularId`) to build the correct URL.

---

## TypeScript Types

```typescript
type NotificationType =
  | 'CIRCULAR'
  | 'QUIZ_PUBLISHED'
  | 'ATTEMPT_GRADED'
  | 'CLASS_ENROLLED';

interface NotificationMetadata {
  circularId?: string;
  quizId?: string;
  attemptId?: string;
  classId?: string;
}

interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string | null;
  link: string | null;
  metadata?: NotificationMetadata;
  read: boolean;
  readAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface NotificationsResponse {
  notifications: Notification[];
  page: number;
  limit: number;
  totalPages: number;
  totalResults: number;
}

interface UnreadCountResponse {
  count: number;
}
```

---

## UI Recommendations

1. **Badge** – Show unread count from `GET /v1/notifications/unread-count` on the bell/notification icon.
2. **List** – Use `GET /v1/notifications` with `read=false` for unread-first view, or without filter for all.
3. **Mark read on click** – When the user opens a notification, call `PATCH /v1/notifications/:id/read` and refresh the list/count.
4. **"Mark all as read"** – Provide a button that calls `PATCH /v1/notifications/read-all`.
5. **Polling** – Poll unread count every 30–60 seconds when the app is in foreground; pause when tab is hidden or app is backgrounded.
6. **Empty state** – Show a friendly message when `notifications.length === 0`.
