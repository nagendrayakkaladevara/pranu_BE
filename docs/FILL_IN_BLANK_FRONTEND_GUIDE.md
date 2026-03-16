# Fill-in-the-Blank Questions — Frontend Integration Guide

Complete guide for the frontend team to integrate fill-in-the-blank questions, question type selection, and case-insensitive answer checking.

**Base URL:** `http://localhost:3000/v1` (or your deployed API URL)

---

## Table of Contents

1. [Overview](#1-overview)
2. [Question Types](#2-question-types)
3. [Creating Questions](#3-creating-questions)
4. [Filtering Questions by Type](#4-filtering-questions-by-type)
5. [Quiz Creation Workflow](#5-quiz-creation-workflow)
6. [Student Exam Flow](#6-student-exam-flow)
7. [Data Models](#7-data-models)
8. [Answer Checking Rules](#8-answer-checking-rules)
9. [UI/UX Recommendations](#9-uiux-recommendations)
10. [Edge Cases & Validation](#10-edge-cases--validation)
11. [Code Examples](#11-code-examples)

---

## 1. Overview

The backend now supports **three question types**:

| Type           | Description                    | Auto-graded | Student Input      |
| :------------- | :----------------------------- | :---------- | :----------------- |
| `MCQ`          | Multiple choice (single/multi) | Yes         | Select option(s)   |
| `SUBJECTIVE`   | Open-ended text answer         | No          | Text area          |
| `FILL_IN_BLANK`| Fill in the blank              | Yes         | Text input         |

**Key points:**

- **Question paper creator** selects the question type when creating each question.
- **Fill-in-the-blank** answers are checked **case-insensitively** (e.g. "Paris", "paris", "PARIS" all match).
- **Multiple acceptable answers** are supported (e.g. "Paris", "France's capital").
- **FILL_IN_BLANK** is auto-graded like MCQ — no manual grading needed.

---

## 2. Question Types

### Enum: `QuestionType`

```typescript
type QuestionType = 'MCQ' | 'SUBJECTIVE' | 'FILL_IN_BLANK';
```

### Type-Specific Requirements

| Type           | Required Fields              | Optional Fields   |
| :------------- | :--------------------------- | :----------------- |
| `MCQ`          | `options` (min 2)            | `multipleCorrect` |
| `SUBJECTIVE`   | —                            | —                  |
| `FILL_IN_BLANK`| `correctAnswers` (min 1)      | —                  |

---

## 3. Creating Questions

### POST /v1/questions

**Auth:** LECTURER or ADMIN

### MCQ Question

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
    { "text": "5", "isCorrect": false }
  ],
  "multipleCorrect": false
}
```

### SUBJECTIVE Question

```json
{
  "text": "Explain the concept of polymorphism in object-oriented programming.",
  "type": "SUBJECTIVE",
  "difficulty": "HARD",
  "marks": 5,
  "subject": "Computer Science",
  "topic": "OOP"
}
```

### FILL_IN_BLANK Question

```json
{
  "text": "The capital of France is ___.",
  "type": "FILL_IN_BLANK",
  "difficulty": "EASY",
  "marks": 1,
  "subject": "Geography",
  "topic": "Europe",
  "correctAnswers": ["Paris", "paris"]
}
```

| Field            | Type     | Required | Notes                                                                 |
| :--------------- | :------- | :------- | :-------------------------------------------------------------------- |
| `text`           | string   | Yes      | Question text. Use `___` or similar placeholder for the blank.        |
| `type`           | string   | No       | `MCQ` (default), `SUBJECTIVE`, or `FILL_IN_BLANK`                     |
| `correctAnswers` | string[] | Yes*     | *Required for FILL_IN_BLANK. Min 1 non-empty. Multiple = alternatives. |
| `options`        | array    | Yes*     | *Required for MCQ. Not used for FILL_IN_BLANK.                        |

**Multiple acceptable answers:** Add variants to `correctAnswers` (e.g. `["USA", "U.S.A.", "United States"]`). Any match (case-insensitive) is correct.

---

## 4. Filtering Questions by Type

### GET /v1/questions

**Query Parameters:**

| Param        | Type   | Notes                                    |
| :----------- | :----- | :--------------------------------------- |
| `type`       | string | `MCQ`, `SUBJECTIVE`, or `FILL_IN_BLANK`  |
| `subject`    | string | Filter by subject                        |
| `topic`      | string | Filter by topic                          |
| `difficulty` | string | `EASY`, `MEDIUM`, `HARD`                  |
| `search`     | string | Search in question text                  |
| `page`       | number | Default: 1                                |
| `limit`      | number | Default: 10                               |

**Examples:**

```
GET /v1/questions?type=FILL_IN_BLANK
GET /v1/questions?type=MCQ&subject=Mathematics
GET /v1/questions?type=SUBJECTIVE&difficulty=HARD
```

---

## 5. Quiz Creation Workflow

### Step 1: Create Questions (Mixed Types)

Create MCQ, SUBJECTIVE, and FILL_IN_BLANK questions as needed.

### Step 2: Create Quiz (Draft)

```json
POST /v1/quizzes
{
  "title": "Geography & History Quiz",
  "totalMarks": 15,
  "durationMinutes": 30,
  "shuffleQuestions": true
}
```

### Step 3: Add Questions to Quiz

Filter questions by type when building the question picker:

```javascript
// Fetch FILL_IN_BLANK questions for the picker
const fillInBlankQuestions = await api.get('/v1/questions', {
  params: { type: 'FILL_IN_BLANK', subject: 'Geography' },
});

// Add selected questions to quiz
await api.post(`/v1/quizzes/${quizId}/questions`, {
  questionIds: ['665b...', '665c...', '665d...'],
});
```

### Step 4: Set Time Window & Publish

Same as existing flow. See [FRONTEND_INTEGRATION.md](./FRONTEND_INTEGRATION.md#6-workflow-lecturer-managing-quizzes).

---

## 6. Student Exam Flow

### Start Attempt: POST /v1/exam/quizzes/:quizId/start

**Response:** Questions array with sanitized data (no correct answers sent to students).

**Question shape by type:**

```json
{
  "questions": [
    {
      "id": "665b...",
      "text": "What is 2+2?",
      "type": "MCQ",
      "marks": 1,
      "multipleCorrect": false,
      "options": [
        { "id": "665c01...", "text": "3" },
        { "id": "665c02...", "text": "4" }
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
      "text": "Explain polymorphism.",
      "type": "SUBJECTIVE",
      "marks": 5,
      "options": []
    }
  ]
}
```

**Rendering logic:**

| Type           | Render                                      |
| :------------- | :------------------------------------------- |
| `MCQ`          | Radio/checkbox list from `options`            |
| `FILL_IN_BLANK`| Single-line text input (no options)          |
| `SUBJECTIVE`   | Multi-line textarea                          |

### Submit Attempt: POST /v1/exam/attempts/:attemptId/submit

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

| Type           | Response Field        | Example Value                    |
| :------------- | :-------------------- | :------------------------------- |
| `MCQ`          | `selectedOptionId`    | `"665c02..."`                    |
| `MCQ` (multi)  | `selectedOptionIds`   | `["665c02...", "665c03..."]`     |
| `FILL_IN_BLANK`| `textAnswer`          | `"Paris"`                        |
| `SUBJECTIVE`   | `textAnswer`          | `"Polymorphism is..."`           |

**Important:** For FILL_IN_BLANK, use `textAnswer` (same as SUBJECTIVE). The backend auto-grades it.

---

## 7. Data Models

### Question (Full — Lecturer View)

```typescript
interface Question {
  id: string;
  text: string;
  type: 'MCQ' | 'SUBJECTIVE' | 'FILL_IN_BLANK';
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  marks: number;
  subject: string;
  topic?: string;
  options?: { _id: string; text: string; isCorrect: boolean }[];
  multipleCorrect?: boolean;
  correctAnswers?: string[];  // Only for FILL_IN_BLANK; never sent to students
  createdAt: string;
  updatedAt: string;
}
```

### Question (Student View — Start Attempt)

```typescript
interface ExamQuestion {
  id: string;
  text: string;
  type: 'MCQ' | 'SUBJECTIVE' | 'FILL_IN_BLANK';
  marks: number;
  multipleCorrect?: boolean;  // Only for MCQ
  options: { id: string; text: string }[];  // Empty for SUBJECTIVE and FILL_IN_BLANK
  // correctAnswers is NEVER sent to students
}
```

### Response (Submit)

```typescript
interface SubmitResponse {
  questionId: string;
  selectedOptionId?: string;   // MCQ (single)
  selectedOptionIds?: string[]; // MCQ (multiple)
  textAnswer?: string;          // SUBJECTIVE or FILL_IN_BLANK
}
```

---

## 8. Answer Checking Rules

Fill-in-the-blank answers are checked as follows:

| Rule                | Behavior                                                |
| :------------------ | :------------------------------------------------------ |
| **Case insensitive**| "Paris", "paris", "PARIS" all match "Paris"            |
| **Trim whitespace** | Leading/trailing spaces are ignored                    |
| **Multiple answers**| If any `correctAnswers` entry matches, answer is correct |
| **Empty answer**   | Empty or whitespace-only = incorrect                    |

**Examples:**

| correctAnswers        | Student Input   | Result   |
| :-------------------- | :--------------- | :------- |
| `["Paris"]`           | `"Paris"`        | Correct  |
| `["Paris"]`           | `"  Paris  "`    | Correct  |
| `["Paris"]`           | `"paris"`        | Correct  |
| `["Paris"]`           | `""`             | Incorrect|
| `["USA", "U.S.A."]`   | `"usa"`          | Correct  |

---

## 9. UI/UX Recommendations

### Question Creator (Lecturer)

1. **Type selector** — Dropdown or tabs: MCQ | SUBJECTIVE | FILL_IN_BLANK.
2. **Conditional form:**
   - **MCQ:** Show options editor (add/remove, mark correct).
   - **SUBJECTIVE:** No extra fields.
   - **FILL_IN_BLANK:** Show `correctAnswers` input (add multiple acceptable answers).
3. **Placeholder hint** — Suggest using `___` in the question text for the blank.
4. **Question picker** — Filter by `type` when adding questions to a quiz.

### Student (Exam)

1. **FILL_IN_BLANK** — Single-line `<input type="text">` (not textarea).
2. **Optional placeholder** — e.g. `placeholder="Your answer"`.
3. **No client-side validation** — Backend handles case and trimming.
4. **Submit** — Include `textAnswer` for FILL_IN_BLANK same as SUBJECTIVE.

---

## 10. Edge Cases & Validation

### Create Question

| Scenario                          | Result                                  |
| :-------------------------------- | :-------------------------------------- |
| FILL_IN_BLANK with no correctAnswers | 400: "at least one non-empty correctAnswer required" |
| FILL_IN_BLANK with options        | 400: "FILL_IN_BLANK should not have options" |
| MCQ with &lt; 2 options           | 400: "MCQ must have at least 2 options" |
| Empty string in correctAnswers    | Trimmed and filtered; need ≥1 non-empty |

### Submit Attempt

| Scenario                    | Result                                  |
| :-------------------------- | :-------------------------------------- |
| FILL_IN_BLANK with textAnswer | Auto-graded, case-insensitive           |
| FILL_IN_BLANK with selectedOptionId | Ignored; use textAnswer only       |
| Missing response for a question | Question skipped (no error)             |

---

## 11. Code Examples

### Create FILL_IN_BLANK Question

```javascript
async function createFillInBlankQuestion(data) {
  const response = await fetch(`${API_BASE}/v1/questions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      text: data.text,
      type: 'FILL_IN_BLANK',
      difficulty: data.difficulty || 'MEDIUM',
      marks: data.marks || 1,
      subject: data.subject,
      topic: data.topic,
      correctAnswers: data.correctAnswers, // e.g. ["Paris", "paris"]
    }),
  });
  if (!response.ok) throw new Error((await response.json()).message);
  return response.json();
}
```

### Filter Questions by Type (Question Picker)

```javascript
async function getQuestionsByType(type, filters = {}) {
  const params = new URLSearchParams({ type, ...filters });
  const response = await fetch(`${API_BASE}/v1/questions?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) throw new Error('Failed to fetch questions');
  const { questions } = await response.json();
  return questions;
}

// Usage: Get fill-in-blank questions for Geography
const fillInBlankQuestions = await getQuestionsByType('FILL_IN_BLANK', {
  subject: 'Geography',
});
```

### Render Question by Type (React)

```jsx
function QuestionRenderer({ question, value, onChange }) {
  if (question.type === 'MCQ') {
    return (
      <div>
        {question.options.map((opt) => (
          <label key={opt.id}>
            <input
              type={question.multipleCorrect ? 'checkbox' : 'radio'}
              name={question.id}
              value={opt.id}
              checked={
                question.multipleCorrect
                  ? value?.includes?.(opt.id)
                  : value === opt.id
              }
              onChange={(e) => onChange(question.id, opt.id, question.multipleCorrect)}
            />
            {opt.text}
          </label>
        ))}
      </div>
    );
  }

  if (question.type === 'FILL_IN_BLANK') {
    return (
      <input
        type="text"
        placeholder="Your answer"
        value={value || ''}
        onChange={(e) => onChange(question.id, e.target.value)}
        className="fill-in-blank-input"
      />
    );
  }

  // SUBJECTIVE
  return (
    <textarea
      placeholder="Your answer"
      value={value || ''}
      onChange={(e) => onChange(question.id, e.target.value)}
      rows={5}
    />
  );
}
```

### Build Submit Payload

```javascript
function buildSubmitResponses(questions, answers) {
  return questions.map((q) => {
    const ans = answers[q.id];
    if (q.type === 'MCQ') {
      return {
        questionId: q.id,
        ...(q.multipleCorrect
          ? { selectedOptionIds: ans || [] }
          : { selectedOptionId: ans || null }),
      };
    }
    // SUBJECTIVE and FILL_IN_BLANK both use textAnswer
    return {
      questionId: q.id,
      textAnswer: ans || '',
    };
  });
}

// Usage
const responses = buildSubmitResponses(questions, studentAnswers);
await fetch(`${API_BASE}/v1/exam/attempts/${attemptId}/submit`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${accessToken}`,
  },
  body: JSON.stringify({ responses }),
});
```

---

## Quick Reference

| Action                    | Endpoint                               | Key Fields                          |
| :------------------------ | :------------------------------------- | :---------------------------------- |
| Create FILL_IN_BLANK      | `POST /v1/questions`                   | `type`, `correctAnswers`            |
| Filter by type            | `GET /v1/questions?type=FILL_IN_BLANK` | `type`                              |
| Start attempt             | `POST /v1/exam/quizzes/:id/start`      | Questions include `type`            |
| Submit FILL_IN_BLANK      | `POST /v1/exam/attempts/:id/submit`    | `textAnswer` in responses           |

---

For the full API reference, see [FRONTEND_API_GUIDE.md](./FRONTEND_API_GUIDE.md).  
For general workflows, see [FRONTEND_INTEGRATION.md](./FRONTEND_INTEGRATION.md).
