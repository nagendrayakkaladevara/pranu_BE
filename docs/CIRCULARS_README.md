# Circulars, Notices & Announcements

Lecturers can publish circulars, notices, and announcements to students. Students see only items targeted to their classes, department, or all users.

**Base URL:** `http://localhost:4000/v1/circulars`

---

## Overview

| Concept | Values |
| :------ | :----- |
| **Types** | `CIRCULAR`, `NOTICE`, `ANNOUNCEMENT` |
| **Target types** | `CLASS` (specific class), `DEPARTMENT` (all students in department), `ALL` (everyone) |
| **Priority** | `LOW`, `NORMAL`, `HIGH`, `URGENT` |

### Role-based access

| Role | Create | Read | Update | Delete |
| :--- | :----- | :--- | :----- | :----- |
| **LECTURER** | Yes | All | Own only | Own only |
| **ADMIN** | No | All | No | No |
| **STUDENT** | No | Targeted only | No | No |

---

## Authentication

All endpoints require a Bearer token:

```
Authorization: Bearer <access_token>
```

---

## Create (POST /v1/circulars)

**Auth:** LECTURER only

### Request

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

### Fields

| Field | Type | Required | Notes |
| :---- | :--- | :------- | :---- |
| `type` | string | Yes | `CIRCULAR`, `NOTICE`, or `ANNOUNCEMENT` |
| `title` | string | Yes | Max 200 chars |
| `content` | string | Yes | |
| `targetType` | string | Yes | `CLASS`, `DEPARTMENT`, or `ALL` |
| `targetClassId` | string | When `targetType` = `CLASS` | Class ID |
| `targetDepartment` | string | When `targetType` = `DEPARTMENT` | Department name |
| `priority` | string | No | `LOW`, `NORMAL` (default), `HIGH`, `URGENT` |
| `isPinned` | boolean | No | Default: false. Pinned items appear first. |

### Response `201`

Returns the created circular with `publishedBy` populated.

---

## List (GET /v1/circulars)

**Auth:** ADMIN, LECTURER, or STUDENT

> **Role-based visibility:** Students see only circulars targeted to their classes, department, or all. Lecturers and admins see all circulars.

### Query parameters

| Param | Type | Notes |
| :---- | :--- | :---- |
| `page` | number | Default: 1 |
| `limit` | number | Default: 10 |
| `type` | string | Filter: `CIRCULAR`, `NOTICE`, `ANNOUNCEMENT` |
| `targetType` | string | Filter: `CLASS`, `DEPARTMENT`, `ALL` |
| `targetClassId` | string | Filter by class |
| `targetDepartment` | string | Filter by department (partial match) |
| `priority` | string | Filter: `LOW`, `NORMAL`, `HIGH`, `URGENT` |
| `isPinned` | boolean | Filter by pinned status |
| `myOnly` | boolean | Lecturers only: show only circulars they published |
| `sortBy` | string | Format: `field:asc` or `field:desc` (default: pinned first, then by date) |

### Response `200`

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

---

## Get by ID (GET /v1/circulars/:circularId)

**Auth:** ADMIN, LECTURER, or STUDENT

Students receive `403` if the circular is not targeted to them.

### Response `200`

Circular object with populated `publishedBy` and `targetClassId`.

---

## Update (PATCH /v1/circulars/:circularId)

**Auth:** LECTURER only (must be the publisher)

### Request (at least one field)

```json
{
  "title": "Updated Title",
  "content": "Updated content",
  "priority": "URGENT",
  "isPinned": true
}
```

### Response `200`

Updated circular object.

---

## Delete (DELETE /v1/circulars/:circularId)

**Auth:** LECTURER only (must be the publisher)

### Response `204`

No content.

---

## Examples

### Class-specific announcement

```json
POST /v1/circulars
{
  "type": "ANNOUNCEMENT",
  "title": "Homework Due Date",
  "content": "Assignment 3 is due by Friday 5 PM.",
  "targetType": "CLASS",
  "targetClassId": "665a1b2c3d4e5f6a7b8c9d0e",
  "priority": "NORMAL"
}
```

### Department-wide notice

```json
POST /v1/circulars
{
  "type": "NOTICE",
  "title": "Lab Maintenance",
  "content": "The Computer Science lab will be closed on Saturday for maintenance.",
  "targetType": "DEPARTMENT",
  "targetDepartment": "Computer Science",
  "priority": "HIGH",
  "isPinned": true
}
```

### Broadcast to all students

```json
POST /v1/circulars
{
  "type": "CIRCULAR",
  "title": "Holiday Notice",
  "content": "The campus will be closed on March 25 for the holiday.",
  "targetType": "ALL",
  "priority": "URGENT"
}
```

### Lecturer: list only my circulars

```
GET /v1/circulars?myOnly=true
```

### Student: list circulars (auto-filtered)

Students automatically see only circulars targeted to their classes, department, or all. No extra query params needed.

```
GET /v1/circulars
```
