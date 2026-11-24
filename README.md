# CheckInn

CheckInn is a full-stack hotel room booking web application developed using React, TypeScript, Spring Boot, and PostgreSQL.

The system allows users to browse available rooms, register and log in, make room bookings, manage their bookings, and submit reviews. It also includes admin functionality for managing rooms and bookings.

## Tech Stack

### Frontend
- React
- TypeScript
- Vite
- HTML / CSS

### Backend
- Java 21
- Spring Boot
- Spring Web
- Spring Data JPA
- Spring Security
- JWT Authentication (io.jsonwebtoken)
- Maven

### Database
- PostgreSQL / Supabase
- Flyway (Schema Migrations)

## Project Architecture

```text
React + TypeScript (Vite)
        |
        | HTTP / JSON (REST API)
        v
Spring Boot REST API
        |
        | JPA / Hibernate
        v
PostgreSQL / Supabase
```

## Environment Configuration

The application uses environment variables for sensitive credentials and environment-specific settings. A template is provided in `.env.example`.

### Required & Configurable Environment Variables

| Variable | Description | Default (Local Dev) | Example |
| :--- | :--- | :--- | :--- |
| `DB_URL` | JDBC URL for PostgreSQL connection | `jdbc:postgresql://localhost:5432/checkinn_db` | `jdbc:postgresql://db.xxx.supabase.co:5432/postgres` |
| `DB_USERNAME` | Database username | `postgres` | `postgres` |
| `DB_PASSWORD` | Database password | `1234` | `your_secret_password` |
| `JWT_SECRET` | Secret key for signing JWT tokens (min 32 bytes) | Safe local development default | `4a8f9c0e2d1b5a7f8e3c6d9b0a1f2e4d` |
| `MAIL_HOST` | SMTP server host for sending emails | `smtp.gmail.com` | `smtp.gmail.com` |
| `MAIL_PORT` | SMTP server port | `587` | `587` |
| `MAIL_USERNAME` | SMTP username for email notifications | *(empty)* | `notifications@checkinn.com` |
| `MAIL_PASSWORD` | SMTP password / app password | *(empty)* | `app_password_here` |
| `FRONTEND_URL` | Allowed origin for backend CORS policy | `http://localhost:5173` | `https://checkinn.example.com` |
| `CHECKINN_INVENTORY_SEED_ENABLED` | Auto-seed sample rooms on startup | `true` | `false` |
| `VITE_API_BASE_URL` | Frontend API base URL | `http://localhost:8080/api` | `https://api.checkinn.example.com/api` |

> [!IMPORTANT]
> Never commit `.env` files or secrets to version control. The `.gitignore` file is configured to exclude environment files, certificates, credentials, and editor-specific directories.

## Getting Started

### Database & Schema Management

CheckInn manages its database schema using **Flyway migrations** (`db/migration/`) and uses Hibernate in **validate** mode (`spring.jpa.hibernate.ddl-auto=validate`). This guarantees reliable, version-controlled schema evolution across environments without unexpected runtime schema alterations.

#### Flyway Migrations
- `V1__initial_schema.sql`: Establishes the baseline relational schema including `users`, `rooms`, `room_amenities`, `bookings`, `reviews`, and `email_notifications` tables with primary keys, foreign keys, and unique constraints.
- `V2__add_performance_indexes.sql`: Adds targeted composite and lookup indexes for booking overlap checks, room availability and filtering, review lookups, and email retry scheduler processing.

#### Initializing a Fresh Database
1. Create an empty PostgreSQL database (e.g. `checkinn_db`):
   ```sql
   CREATE DATABASE checkinn_db;
   ```
2. Configure `DB_URL`, `DB_USERNAME`, and `DB_PASSWORD` in your `.env` or environment.
3. Start the application:
   ```bash
   ./mvnw spring-boot:run
   ```
   Flyway will automatically detect the clean database, execute all migrations in order (`V1`, `V2`), and populate the `flyway_schema_history` table. Hibernate will then validate the schema on startup.

#### Existing Development Database Migration Path
If you have an existing development database previously managed by Hibernate `ddl-auto=update`:
- **Safe in-place migration**: Flyway is configured with `spring.flyway.baseline-on-migrate=true` and `spring.flyway.baseline-version=0`.
- Migration scripts utilize `CREATE TABLE IF NOT EXISTS` and `CREATE INDEX IF NOT EXISTS`, ensuring that existing tables and user/booking data are safely preserved without data loss.
- Alternatively, if you already have existing tables and want to mark the current schema baseline manually:
  ```bash
  # Flyway will baseline existing unversioned tables and apply subsequent migrations (V2+)
  ./mvnw flyway:baseline -Dflyway.baselineVersion=1
  ```

### Prerequisites
- Java 21+
- Node.js 18+ and npm
- PostgreSQL database (or local Docker container / Supabase instance)

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd checkinn-backend
   ```
2. Configure environment variables (optional for local defaults):
   ```bash
   cp .env.example .env
   # Edit .env with your PostgreSQL credentials, JWT secret, and mail configuration
   ```
3. Run unit tests:
   ```bash
   ./mvnw test -Dtest='!*IntegrationTest'
   ```
4. Run integration tests (requires Docker daemon for Testcontainers):
   ```bash
   ./mvnw test
   ```
5. Start the backend application:
   ```bash
   ./mvnw spring-boot:run
   ```
   The backend API will be available at `http://localhost:8080`.
   Swagger UI is accessible at `http://localhost:8080/swagger-ui.html`.

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd checkinn-frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables:
   ```bash
   cp .env.example .env.local
   # Set VITE_API_BASE_URL if your backend runs on a non-default URL
   ```
4. Start development server:
   ```bash
   npm run dev
   ```
   The frontend will be available at `http://localhost:5173`.
