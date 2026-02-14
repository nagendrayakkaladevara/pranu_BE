# Product Requirement Document (PRD)

## 1. Product Overview

### 1.1 Product Name

Engineering College Quiz Examination System (ECQES)

### 1.2 Purpose

The purpose of this product is to provide a centralized, secure, and scalable platform for engineering colleges to conduct quiz-based examinations. The system supports role-based access for Admins, Lecturers, and Students, enabling efficient exam creation, distribution, evaluation, and analytics.

### 1.3 Goals

- Digitize quiz examinations across the college
- Reduce manual effort for exam creation and evaluation
- Provide detailed performance analytics at class, lecturer, and student levels
- Ensure exam integrity, fairness, and scalability

### 1.4 Target Users

- College Administrators
- Lecturers / Faculty
- Students

---

## 2. User Roles & Permissions

### 2.1 Admin

**Responsibilities:**

- Overall system management
- User and class administration
- Organization-wide analytics

**Permissions:**

- Create, edit, activate, deactivate Lecturers
- Create, edit, activate, deactivate Students
- Create classes (e.g., CSE-3A, ECE-2B)
- Assign students to classes
- Assign lecturers to classes
- View analytics across:
  - All lecturers
  - All classes
  - All students

- View historical performance data
- Manage academic years and semesters

---

### 2.2 Lecturer

**Responsibilities:**

- Exam creation and evaluation
- Class-level performance tracking

**Permissions:**

- Create question banks
- Create question papers (quizzes)
- Configure quiz settings:
  - Duration
  - Total marks
  - Negative marking (optional)
  - Randomization (questions/options)

- Publish quizzes to assigned classes
- View quiz attempt status
- View analytics:
  - Per quiz
  - Per class
  - Per student

- View historical performance trends

---

### 2.3 Student

**Responsibilities:**

- Attempt quizzes

**Permissions:**

- View assigned quizzes
- Attempt quizzes within scheduled time
- Submit quizzes
- View:
  - Quiz scores
  - Correct / incorrect answers (if enabled)
  - Personal performance history

---

## 3. Functional Requirements

### 3.1 Authentication & Authorization

- Secure login for all roles
- Role-based access control (RBAC)
- Password reset and account recovery

---

### 3.2 User Management

#### Admin

- Create and manage users (Lecturers, Students)
- Bulk upload students via CSV
- Activate / deactivate accounts

#### Lecturer

- View assigned classes and students

---

### 3.3 Class Management

- Admin can create classes
- Admin can assign:
  - Students to classes
  - Lecturers to classes

- Support multiple semesters and academic years

---

### 3.4 Question Bank Management (Lecturer)

- Create questions with:
  - Multiple Choice Questions (MCQs)
  - Single correct answer (initial phase)

- Define:
  - Difficulty level (Easy / Medium / Hard)
  - Marks per question

- Organize questions by subject and topic

---

### 3.5 Quiz / Exam Management

- Lecturer can create quizzes using question bank
- Quiz configuration options:
  - Time limit
  - Total marks
  - Pass criteria
  - Shuffle questions
  - Shuffle options

- Schedule quiz availability (start & end time)
- Publish quiz to selected class(es)

---

### 3.6 Quiz Attempt (Student)

- Student can view available quizzes
- Start quiz within allowed time window
- Auto-submit on time expiration
- Manual submission option
- Prevent multiple attempts (configurable)

---

### 3.7 Evaluation & Results

- Automatic evaluation for MCQs
- Immediate or delayed result publishing (configurable)
- Score calculation
- Rank calculation (optional)

---

### 3.8 Analytics & Reports

#### Admin Analytics

- Overall college performance
- Class-wise performance comparison
- Lecturer-wise performance
- Student performance distribution

#### Lecturer Analytics

- Quiz-wise analysis
- Class average vs individual performance
- Question-wise analysis (most wrong questions)

#### Student Analytics

- Personal performance trend
- Strengths and weaknesses

---

## 4. Non-Functional Requirements

### 4.1 Performance

- Support concurrent quiz attempts by large number of students
- Low latency during quiz submission

### 4.2 Security

- Secure data storage
- Role-based authorization
- Prevent question leakage
- Secure exam submission

### 4.3 Scalability

- Should support multiple departments and years
- Easily scalable to support more students and exams

### 4.4 Availability

- High availability during exam times
- Minimal downtime

### 4.5 Audit & Logs

- Track quiz creation, publishing, and submissions
- Maintain activity logs for compliance

---

## 5. Assumptions

- Initial version supports only MCQ-based quizzes
- Internet access is available for all users
- One lecturer can manage multiple classes

---

## 6. Future Enhancements (Out of Scope for MVP)

- Subjective / descriptive questions
- Proctoring (camera, tab-switch detection)
- Mobile application
- AI-based performance insights
- Integration with college ERP/LMS

---

## 7. Success Metrics

- Number of quizzes conducted per semester
- Reduction in manual exam effort
- Student and lecturer adoption rate
- System uptime during exams

---

## 8. Risks & Mitigation

| Risk                   | Mitigation                        |
| ---------------------- | --------------------------------- |
| High load during exams | Load testing & auto-scaling       |
| Cheating               | Randomization & future proctoring |
| Data loss              | Regular backups                   |

---

## 9. Conclusion

This system aims to modernize quiz examinations in engineering colleges by providing a secure, scalable, and analytics-driven platform that benefits administrators, lecturers, and students alike.
