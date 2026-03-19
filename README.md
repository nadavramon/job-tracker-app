<div align="center">

  <h1>Job Tracker App</h1>

  <p>
    <strong>A full-stack web application to track job applications, manage statuses, and optimize your job hunt — with AI-powered extraction.</strong>
  </p>

  <p>
    <a href="https://github.com/nadavramon/job-tracker-app/actions"><img src="https://img.shields.io/github/actions/workflow/status/nadavramon/job-tracker-app/ci.yml?branch=main" alt="Build Status"></a>
    <img src="https://img.shields.io/badge/Java-21-orange?logo=openjdk" alt="Java 21">
    <a href="https://spring.io/projects/spring-boot"><img src="https://img.shields.io/badge/Spring%20Boot-4-brightgreen?logo=springboot" alt="Spring Boot 4"></a>
    <a href="https://nextjs.org/"><img src="https://img.shields.io/badge/Next.js-16-black?logo=next.js" alt="Next.js 16"></a>
    <img src="https://img.shields.io/badge/TypeScript-5-blue?logo=typescript" alt="TypeScript">
    <img src="https://img.shields.io/badge/PostgreSQL-17-336791?logo=postgresql&logoColor=white" alt="PostgreSQL 17">
    <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License"></a>
  </p>
</div>

---

<details>
  <summary>Table of Contents</summary>
  <ol>
    <li><a href="#about-the-project">About The Project</a></li>
    <li><a href="#key-features">Key Features</a></li>
    <li><a href="#tech-stack">Tech Stack</a></li>
    <li><a href="#project-structure">Project Structure</a></li>
    <li><a href="#getting-started">Getting Started</a></li>
    <li><a href="#api-reference">API Reference</a></li>
    <li><a href="#roadmap">Roadmap</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
  </ol>
</details>

## About The Project

The Job Tracker App helps job seekers stay organized during their search. It provides a secure dashboard to log applications, track progress through hiring stages, view analytics, and even auto-extract job details from postings using AI.

## Key Features

- **AI-Powered Job Extraction** — Paste a job posting URL or raw text and let Claude automatically extract company, role, location, and more.
- **Interactive Dashboard** — Summary stats bar, monthly application trends, and status breakdown charts powered by Recharts.
- **Portal Credentials Vault** — Store login credentials for company portals, encrypted at rest with AES-256-GCM.
- **Secure Authentication** — JWT-based stateless auth with HttpOnly cookies. Supports email and username login.
- **Search, Filter & Sort** — Full-text search, status filtering, multi-column sorting, and server-side pagination.
- **Modern UI** — Responsive design with Light/Dark/System themes, Lucide React icons, custom toast notifications, and entrance animations.
- **Data Integrity** — Input validation (JSR 380), soft-delete for applications, and strict user data isolation.

## Tech Stack

### Frontend
| Category | Technologies |
|:---|:---|
| Core | Next.js 16 (Pages Router), React 19, TypeScript 5 |
| Styling & UI | Tailwind CSS 4, Recharts, Lucide React |
| AI | Anthropic SDK, Zod (structured outputs) |
| State & Fetching | Axios, React Context API |
| Testing | Jest 30, React Testing Library |

### Backend
| Category | Technologies |
|:---|:---|
| Core | Java 21, Spring Boot 4, Spring Security |
| Database | PostgreSQL 17, Hibernate / JPA |
| Auth & Security | JJWT 0.12, Bucket4j (rate limiting) |
| Testing | JUnit 5, Mockito, JaCoCo |

### DevOps
| Category | Technologies |
|:---|:---|
| CI | GitHub Actions — path-filtered backend + frontend jobs |

## Project Structure

```
job-tracker-app/
├── backend/
│   └── src/main/java/com/jobtracker/
│       ├── controller/        # REST controllers (Auth, Application, User)
│       ├── service/           # Business logic
│       ├── repository/        # Spring Data JPA repositories
│       ├── model/             # JPA entities
│       ├── dto/               # Request/Response DTOs
│       ├── security/          # JWT filter, SecurityConfig
│       └── exception/         # Global exception handling
├── frontend/
│   ├── app/                   # Next.js pages (Pages Router)
│   │   ├── (app)/             # Authenticated pages (dashboard, applications, settings)
│   │   ├── (auth)/            # Public pages (login, register)
│   │   └── api/ai/            # AI extraction API route
│   ├── components/            # Reusable React components
│   ├── lib/                   # Services, utilities, AI agents
│   └── __tests__/             # Jest test files
├── .github/workflows/         # CI pipeline
└── dev.sh                     # Start both servers locally
```

## Getting Started

### Prerequisites

- Java 21
- Node.js 22+
- PostgreSQL 17

### Quick Start

The fastest way to start both backend and frontend:

```bash
git clone https://github.com/nadavramon/job-tracker-app.git
cd job-tracker-app
./dev.sh
```

This launches the API on `http://localhost:8080` and the client on `http://localhost:3000`.

### Environment Variables

**Backend** — set in `backend/src/main/resources/application-local.properties` or as env vars:

| Variable | Description |
|:---|:---|
| `DB_URL` | JDBC connection string (e.g. `jdbc:postgresql://localhost:5432/job_tracker`) |
| `DB_USERNAME` | Database username |
| `DB_PASSWORD` | Database password |
| `JWT_SECRET` | Secret key for signing JWTs |
| `ENCRYPTION_SECRET` | Secret key for AES-256-GCM credential encryption |

**Frontend** — set in `frontend/.env.local`:

| Variable | Description |
|:---|:---|
| `NEXT_PUBLIC_API_URL` | Backend URL (default: `http://localhost:8080`) |
| `ANTHROPIC_API_KEY` | API key for Claude AI extraction |

### Manual Start (alternative)

```bash
# Backend
cd backend
./mvnw spring-boot:run

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
```

## API Reference

<details>
<summary>Click to expand API Endpoints</summary>

### Auth (Public)
| Method | Endpoint | Description |
|:---|:---|:---|
| `POST` | `/auth/register` | Register a new user |
| `POST` | `/auth/login` | Login (email or username) and receive JWT cookie |
| `POST` | `/auth/logout` | Clear auth cookie and log out |

### Applications (Authenticated)
| Method | Endpoint | Description |
|:---|:---|:---|
| `GET` | `/applications` | List applications (supports `search`, `status`, pagination, sorting) |
| `GET` | `/applications/stats` | Get aggregated statistics (totals by status) |
| `GET` | `/applications/{id}` | Get a single application |
| `GET` | `/applications/{id}/credentials` | Get decrypted portal credentials |
| `POST` | `/applications` | Create a new application |
| `PATCH` | `/applications/{id}` | Update specific fields |
| `DELETE` | `/applications/{id}` | Soft-delete an application |

### User Profile (Authenticated)
| Method | Endpoint | Description |
|:---|:---|:---|
| `GET` | `/me` | Get current user profile & preferences |
| `PATCH` | `/me` | Update profile (username, email, password, theme) |
| `DELETE` | `/me` | Delete account (soft-deletes user and all applications) |

### AI (Authenticated via cookie)
| Method | Endpoint | Description |
|:---|:---|:---|
| `POST` | `/api/ai/extract` | Extract job details from text or URL (rate-limited) |

</details>

## Roadmap

- [x] Phase 1: Core REST API & Spring Security
- [x] Phase 2: Frontend Foundation, Theme System, and UI Primitives
- [x] Phase 3: Interactive Dashboard with Recharts
- [x] Phase 4: AI-Powered Smart Application Entry
- [x] Phase 5: Portal Credentials Vault (encrypted)
- [x] Phase 6: HttpOnly Cookie Auth & UI Refresh
- [ ] Phase 7: Refresh Token Rotation
- [ ] Phase 8: Dockerization & Cloud Deployment

## Contributing

Contributions are welcome!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

Distributed under the MIT License. See `LICENSE` for more information.

## Author

Nadav Ramon

Project Link: [https://github.com/nadavramon/job-tracker-app](https://github.com/nadavramon/job-tracker-app)
