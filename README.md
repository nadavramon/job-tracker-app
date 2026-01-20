# Job Tracker App

## Description
A full-stack web application that helps job seekers track their job applications, manage application statuses, and never miss a follow-up opportunity.

## Tech Stack
### Frontend
- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **HTTP Client:** Axios

### Backend
- **Framework:** Spring Boot 3 (Java 21)
- **Database:** PostgreSQL 17
- **Security:** Spring Security & JWT (Stateless Authentication)
- **Testing:** JUnit 5, Mockito, JaCoCo (Code Coverage)
- **Validation:** Hibernate Validator (JSR 380)

### DevOps
- **CI/CD:** GitHub Actions (Automated Testing & Coverage Reports)
- **Containerization:** Docker (planned)

## Features
- [x] **User Authentication:** Secure Registration & Login with JWT support.
- [x] **Application Management:** CRUD API to track company details, roles, and statuses.
- [x] **Data Security:** User data isolation (users can only access their own applications).
- [x] **Robust Validation:** Strict input validation with standardized error handling.
- [ ] Dashboard with summarized progress overview (Frontend in progress).
- [ ] Automatic status transitions (Submitted → Waiting → Ghosted).
- [ ] Secure storage for company portal credentials.
- [ ] Reapply notifications after 6 months.

## Project Status
**Current Phase:** Phase 5 — Frontend Integration & Dashboard Implementation

The Backend API is fully functional, secured, and tested.
- ✅ **Core API:** `/auth` and `/applications` endpoints are production-ready.
- ✅ **Quality Assurance:** 100% pass rate on unit tests with automated CI pipelines.
- 🚧 **Frontend:** Currently building the authentication flows and main dashboard.

## Getting Started

### Prerequisites
- Java 21
- Node.js 20+
- PostgreSQL 17
- Maven (or use included `./mvnw`)

### 1. Setup Database
Ensure PostgreSQL is running and create a database named `job_tracker`.

### 2. Run Backend
```bash
cd backend
# Run tests to verify environment
./mvnw clean verify
# Start the server
./mvnw spring-boot:run
```
Server will start on http://localhost:8080
### 3. Run Frontend
```bash
cd frontend
npm install
npm run dev
```

Client will start on http://localhost:3000

### API Endpoints (Quick Reference)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/auth/register` | Register a new user |
| `POST` | `/auth/login` | Login and receive JWT |
| `GET` | `/applications` | Get all applications for logged-in user |
| `POST` | `/applications` | Create a new application |
| `PATCH` | `/applications/{id}` | Update specific fields |

### Author
Nadav Ramon

### **Summary of Changes**
1.  **Tech Stack:** Added **Axios**, **Spring Security**, **JUnit 5**, **Mockito**, **JaCoCo**, and **GitHub Actions** to reflect your professional tooling.
2.  **Features:** Marked Authentication, App Management, and Validation as **Completed (`[x]`)**.
3.  **Project Status:** Updated to "Phase 5" (Frontend Integration) and added a note about the stable backend API.
4.  **Quick Reference:** Added a small table of the core API endpoints you just built, which is very helpful for developers (and you) to reference quickly.