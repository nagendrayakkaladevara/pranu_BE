# Upcoming Quizzes with Countdown — Frontend Guide

Quick reference for displaying active and upcoming quizzes to students with a countdown timer.

---

## Endpoint

```
GET /v1/exam/quizzes
```

**Auth:** Bearer token (STUDENT role)

---

## Response

```json
{
  "active": [
    {
      "id": "665a...",
      "title": "Math Quiz",
      "durationMinutes": 30,
      "totalMarks": 10,
      "startTime": "2026-03-01T09:00:00.000Z",
      "endTime": "2026-03-01T11:00:00.000Z",
      "createdBy": { "id": "...", "name": "Dr. Smith", "email": "..." }
    }
  ],
  "upcoming": [
    {
      "id": "665b...",
      "title": "Physics Exam",
      "durationMinutes": 60,
      "totalMarks": 20,
      "startTime": "2026-03-15T10:00:00.000Z",
      "endTime": "2026-03-15T12:00:00.000Z",
      "createdBy": { "id": "...", "name": "Dr. Jones", "email": "..." }
    }
  ],
  "completed": [
    {
      "id": "665c...",
      "title": "Chemistry Quiz",
      "durationMinutes": 20,
      "totalMarks": 15,
      "startTime": "2026-03-10T09:00:00.000Z",
      "endTime": "2026-03-10T10:00:00.000Z",
      "createdBy": { "id": "...", "name": "Dr. Brown", "email": "..." },
      "attemptId": "665d...",
      "score": 12,
      "totalMarks": 15
    }
  ]
}
```

| Array       | Use for                                                       |
| :---------- | :------------------------------------------------------------ |
| `active`    | Quizzes the student can start now — show "Start" button      |
| `upcoming`  | Quizzes not yet started — show countdown to `startTime`       |
| `completed` | Quizzes the student has submitted — show "View Results" link  |

---

## Countdown Logic

Use `startTime` (ISO 8601) to compute time until the quiz starts:

```javascript
function getCountdown(startTime) {
  const ms = new Date(startTime) - new Date();
  if (ms <= 0) return null; // Already started

  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);

  if (days > 0) return `Starts in ${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `Starts in ${hours}h ${minutes}m`;
  return `Starts in ${minutes}m`;
}
```

For a live countdown, update every minute (or second) with `setInterval`.

---

## UI Suggestion

1. **Active section** — List quizzes with a "Start Quiz" button.
2. **Upcoming section** — List quizzes with countdown text; disable or hide "Start" until `startTime` is reached.
3. **Completed section** — List quizzes the student has submitted. Show score (e.g. "12/15") and a "View Results" link to `GET /v1/exam/attempts/:attemptId`.
4. When countdown hits zero, refetch `GET /v1/exam/quizzes` — the quiz will move from `upcoming` to `active`.
5. After submitting a quiz, refetch — the quiz will move from `active` to `completed`.
