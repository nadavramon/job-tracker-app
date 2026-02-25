<div align="center">

  <h1>💼 Job Tracker App</h1>

  <p>
    <strong>A full-stack, enterprise-grade web application to help job seekers track applications, manage statuses, and optimize their job hunt.</strong>
  </p>

  <p>
    <a href="https://github.com/nadavramon/job-tracker-app/actions"><img src="https://img.shields.io/github/actions/workflow/status/nadavramon/job-tracker-app/build.yml?branch=main" alt="Build Status"></a>
    <a href="https://spring.io/projects/spring-boot"><img src="https://img.shields.io/badge/Spring%20Boot-3.2-brightgreen.svg?logo=springboot" alt="Spring Boot"></a>
    <a href="https://nextjs.org/"><img src="https://img.shields.io/badge/Next.js-14-black?logo=next.js" alt="Next.js"></a>
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
    <li><a href="#getting-started">Getting Started</a></li>
    <li><a href="#api-reference">API Reference</a></li>
    <li><a href="#roadmap">Roadmap</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
  </ol>
</details>

## About The Project

The Job Tracker App is designed to solve the chaos of modern job hunting. It provides a secure, fast, and intuitive dashboard for users to log applications, track their progress through different hiring stages, and maintain a clear history of interactions with companies. 

Built with scalability and clean architecture in mind, the backend strictly adheres to RESTful principles while the frontend leverages modern React server-side rendering patterns.

## Key Features

* 🔐 **Secure Authentication** — JWT-based stateless authentication supporting both email and username logins.
* 📊 **Interactive Dashboard** — Summary statistics, dynamic charts (monthly applications, status breakdowns), and a paginated table.
* 🛡️ **Robust Data Security** — Strict user data isolation; users cannot access or modify applications belonging to others.
* 🌗 **Modern UI/UX** — Fully responsive design with a persistent Light/Dark/System theme system and custom toast notifications.
* 🛑 **Data Integrity** — Strict input validation (JSR 380) and soft-deletion mechanisms for easy data recovery.

## Tech Stack

### Frontend
* **Core:** Next.js 16 (App Router), React, TypeScript (Strict Mode)
* **Styling & UI:** Tailwind CSS v4, Recharts
* **State & Fetching:** Axios, React Context API
* **Testing:** Jest 30, React Testing Library

### Backend
* **Core:** Java 21, Spring Boot 4
* **Database:** PostgreSQL 17, Hibernate/JPA
* **Security:** Spring Security, JWT
* **Testing:** JUnit 5, Mockito, JaCoCo

### DevOps
* **CI/CD:** GitHub Actions (Automated build, test, and coverage reporting)
* **Containerization:** Docker & Docker Compose *(Coming Soon)*

## Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing.

### Prerequisites

Ensure you have the following installed:
* Java 21
* Node.js 20+
* PostgreSQL 17

### Installation 

1. **Clone the repository**
   ```bash
   git clone https://github.com/nadavramon/job-tracker-app.git
   cd job-tracker-app
   ```

2. **Set up the Database**
   Ensure your local PostgreSQL instance is running and create a database:
   ```sql
   CREATE DATABASE job_tracker;
   ```

3. **Configure Environment Variables**
   * **Backend:** Create `backend/src/main/resources/application-local.properties` overriding defaults (e.g., `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET`).
   * **Frontend:** Create `frontend/.env.local` and set `NEXT_PUBLIC_API_URL=http://localhost:8080`.

4. **Run the Backend**
   ```bash
   cd backend
   ./mvnw clean verify # Run tests to ensure standard
   ./mvnw spring-boot:run
   ```
   *The API will start on `http://localhost:8080`*

5. **Run the Frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   *The client will start on `http://localhost:3000`*

## API Reference

<details>
<summary>Click to expand API Endpoints</summary>

### Auth (Public)
| Method | Endpoint | Description |
|:---|:---|:---|
| `POST` | `/auth/register` | Register a new user |
| `POST` | `/auth/login` | Login (email or username) and receive JWT |

### Applications (Authenticated)
| Method | Endpoint | Description |
|:---|:---|:---|
| `GET` | `/applications` | Get paginated applications |
| `GET` | `/applications/{id}` | Get a single application |
| `POST` | `/applications` | Create a new application |
| `PATCH` | `/applications/{id}` | Update specific fields |
| `DELETE` | `/applications/{id}` | Soft-delete an application |
| `GET` | `/applications/stats` | Get aggregated statistics |

### User Profile (Authenticated)
| Method | Endpoint | Description |
|:---|:---|:---|
| `GET` | `/me` | Get current user profile & preferences |
| `PATCH` | `/me` | Update profile (username, email, password, theme) |
| `DELETE` | `/me` | Delete user account |

</details>

## Roadmap

- [x] Phase 1: Core REST API & Spring Security implementations
- [x] Phase 2: Frontend Foundation, Theme System, and UI Primitives
- [ ] Phase 3: Interactive Dashboard and Recharts integration
- [ ] Phase 4: Automated status transitions & reminder cron jobs
- [ ] Phase 5: Dockerization and Cloud Deployment

## Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

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