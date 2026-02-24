# Job Tracker App

A full-stack web application that helps job seekers track their job applications, manage application statuses, and never miss a follow-up opportunity.

## Tech Stack

### Frontend
- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS v4
- **HTTP Client:** Axios
- **Charts:** Recharts
- **Testing:** Jest 30 + React Testing Library

### Backend
- **Framework:** Spring Boot 4 (Java 21)
- **Database:** PostgreSQL 17
- **Security:** Spring Security & JWT (Stateless Authentication)
- **Testing:** JUnit 5, Mockito, JaCoCo (Code Coverage)
- **Validation:** Jakarta Bean Validation (JSR 380)

### DevOps
- **CI/CD:** GitHub Actions (Automated Testing & Coverage Reports)
- **Containerization:** Docker (planned)

## Features

### ✅ Completed
- **User Authentication** — Secure registration & login with JWT (supports email or username)
- **Application Management** — Full CRUD API to track companies, roles, statuses, and dates
- **Data Security** — User data isolation (users can only access their own applications)
- **Robust Validation** — Strict input validation with standardized error handling
- **Soft Delete** — Applications are soft-deleted (recoverable), filtered automatically via Hibernate
- **CI/CD Pipelines** — Automated testing for both backend and frontend on every push/PR

### 🚧 In Progress
- **Dashboard** — Summary stats, charts (monthly applications, status breakdown), and paginated applications table
- **Theme System** — Light, Dark, and System-default modes with cross-device persistence
- **Inline Editing** — Quick status updates directly from the table
- **Responsive Design** — Mobile card layout with collapsible sidebar navigation
- **Settings Page** — Theme preferences, profile management, account deletion
- **Toast Notifications** — Custom notification system for all CRUD operations
- **Network Resilience** — Offline detection banner, retry on failed requests

### 📋 Planned
- Automatic status transitions (Applied → Waiting → Ghosted)
- Reapply notifications after 6 months
- Docker containerization

## Project Structure

```
job-tracker-app/
├── backend/                    # Spring Boot REST API
│   ├── src/main/java/com/nadavramon/job_tracker/
│   │   ├── config/             # Security, JWT filter, CORS
│   │   ├── controller/         # Auth & Application endpoints
│   │   ├── service/            # Business logic
│   │   ├── repository/         # JPA repositories
│   │   ├── entity/             # User, Application (JPA entities)
│   │   ├── dto/                # Request/Response objects
│   │   ├── enums/              # Status, JobType
│   │   └── exception/          # Custom exceptions & global handler
│   └── src/test/               # Unit tests (WebMvcTest + Mockito)
├── frontend/                   # Next.js SPA
│   ├── app/                    # App Router pages
│   ├── components/             # Custom UI components
│   ├── context/                # React contexts (Theme, Toast, Auth)
│   ├── lib/                    # API client, services, utilities
│   ├── types/                  # TypeScript interfaces
│   └── __tests__/              # Jest + React Testing Library
└── .github/workflows/          # CI pipelines
```

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

### Environment Variables

#### Backend
| Variable | Description | Default |
|:---|:---|:---|
| `DB_URL` | PostgreSQL JDBC URL | `jdbc:postgresql://localhost:5432/job_tracker` |
| `DB_USERNAME` | Database username | — |
| `DB_PASSWORD` | Database password | — |
| `JWT_SECRET` | JWT signing key (min 32 chars) | — |
| `JWT_EXPIRATION` | Token TTL in milliseconds | `86400000` (24h) |

Local dev overrides: `backend/src/main/resources/application-local.properties` (gitignored)

#### Frontend
| Variable | Description | Default |
|:---|:---|:---|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | — |

Set in `frontend/.env.local` (gitignored)

## API Endpoints

### Auth (Public)
| Method | Endpoint | Description |
|:---|:---|:---|
| `POST` | `/auth/register` | Register a new user |
| `POST` | `/auth/login` | Login (email or username) and receive JWT |

### Applications (Authenticated)
| Method | Endpoint | Description |
|:---|:---|:---|
| `GET` | `/applications` | Get paginated applications for logged-in user |
| `GET` | `/applications/{id}` | Get a single application |
| `POST` | `/applications` | Create a new application |
| `PATCH` | `/applications/{id}` | Update specific fields (partial update) |
| `DELETE` | `/applications/{id}` | Soft-delete an application |
| `GET` | `/applications/stats` | Get aggregated statistics |

### User Profile (Authenticated)
| Method | Endpoint | Description |
|:---|:---|:---|
| `GET` | `/me` | Get current user profile & preferences |
| `PATCH` | `/me` | Update profile (username, email, password, theme) |
| `DELETE` | `/me` | Delete user account |

## Author
Nadav Ramon