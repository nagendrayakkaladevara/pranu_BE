# Pending Implementation Specifications

This document outlines the specific requirements and API specifications for the remaining modules of the ECQES system.

## 1. User Management Module (Admin Only)

**Goal**: Allow admins to manage lecturers and students.

- **Endpoints**:
  - `POST /v1/users`: Create a user (Admin/Lecturer/Student).
  - `GET /v1/users`: List users with pagination and role filtering.
  - `GET /v1/users/:userId`: Get user details.
  - `PATCH /v1/users/:userId`: Update user details.
  - `DELETE /v1/users/:userId`: Soft delete/deactivate user.
- **Validation**: Ensure email uniqueness, valid role.

## 2. Class Management Module (Admin Only)

**Goal**: Organize students into classes and assign lecturers.

- **Endpoints**:
  - `POST /v1/classes`: Create a new class (e.g., "CSE-3A").
  - `GET /v1/classes`: List classes.
  - `GET /v1/classes/:classId`: Get class details (incl. student/lecturer counts).
  - `POST /v1/classes/:classId/students`: Bulk assign students to a class.
  - `POST /v1/classes/:classId/lecturers`: Assign a lecturer to a class.
- **Logic**: A student can belong to multiple classes (electives).

## 3. Question Bank Module (Lecturer)

**Goal**: Create a repository of questions for quizzes.

- **Endpoints**:
  - `POST /v1/questions`: Create a question.
  - `GET /v1/questions`: List questions (filter by subject, topic, difficulty).
  - `PATCH /v1/questions/:questionId`: Update question.
  - `DELETE /v1/questions/:questionId`: Delete question.
- **Specs**:
  - Support MCQ type initially.
  - options must be provided for MCQs.

## 4. Quiz Management Module (Lecturer)

**Goal**: Create and publish quizzes.

- **Endpoints**:
  - `POST /v1/quizzes`: Create a quiz draft (metadata like title, duration).
  - `POST /v1/quizzes/:quizId/questions`: Add questions to the quiz.
  - `PATCH /v1/quizzes/:quizId/publish`: Publish quiz (set status to PUBLISHED).
  - `GET /v1/quizzes`: List quizzes created by the lecturer.
- **Logic**:
  - Validate total marks matches sum of question marks.
  - Ensure start time < end time.

## 5. Quiz Attempt Module (Student)

**Goal**: Allow students to take exams.

- **Endpoints**:
  - `GET /v1/exam/quizzes`: List available quizzes for the student (based on class assignment).
  - `POST /v1/exam/quizzes/:quizId/start`: Start an attempt (returns questions without correct answers).
  - `POST /v1/exam/attempts/:attemptId/submit`: Submit answers & finish.
- **Logic**:
  - Validate student belongs to the class assigned to the quiz.
  - Check current time is within quiz start/end time.
  - Calculate score immediately upon submission (for objective type).

## 6. Analytics Module (Admin & Lecturer)

**Goal**: View performance.

- **Endpoints**:
  - `GET /v1/analytics/results/:quizId`: Get all student results for a quiz.
  - `GET /v1/analytics/student/:studentId`: Get performance history for a student.
