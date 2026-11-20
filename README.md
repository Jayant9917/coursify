# Coursify

Coursify is a learning management application with a React frontend and an Express/MongoDB backend. The current user interface is branded **Skillnest**. Students can discover courses and track their learning, instructors can manage course content, and administrators can manage the platform.

## Features

- **Students:** course discovery, course details, checkout, enrolled courses, lesson playback, progress tracking, wishlists, reviews, profiles, and order history.
- **Course creators:** course editing, sections and lessons, media uploads, previews, dashboards, and statistics. Access depends on the account role and backend authorization rules.
- **Administrators:** user, course, category, coupon, and order management, plus administrative audit APIs.
- **Learning tools:** notes, focus playlists, notifications, and dashboard APIs.
- **Authentication:** JWT access and refresh tokens, role-based access, registration, and password recovery.
- **Integrations:** Lemon Squeezy payments, S3 media storage, Cloudinary configuration, Resend email, and optional Redis caching and BullMQ jobs.
- **Operations:** structured logging, health endpoints, Prometheus metrics, automated tests, and GitHub Actions CI.

## Technology

| Area | Stack |
| --- | --- |
| Frontend | React 18, Vite 5, React Router, Tailwind CSS, TanStack Query, Zustand, React Hook Form, Zod |
| Backend | Node.js, Express, Mongoose, JWT, Zod |
| Database | MongoDB |
| Optional background services | Redis, BullMQ |
| Testing | Node test runner, Vitest, Testing Library, Playwright |
| Tooling | ESLint, Prettier, Docker, GitHub Actions |

## Repository structure

```text
Backend/
  controllers/       Request handlers
  models/            Mongoose data models
  routes/            API routes
  middlewares/       Authentication, errors, security, and request logging
  services/          Application services and integrations
  jobs/              Maintenance tasks and queue workers
  scripts/           Database and payment maintenance commands
  validators/        Request validation
  utils/             Shared backend utilities
  test/              Unit, integration, and load tests
  API_DOCUMENTATION.md
  Dockerfile
Frontend/
  src/
    pages/           Public, student, instructor, and admin screens
    components/      Reusable interface components
    layouts/         Role-specific layouts
    routes/          Route definitions and access guards
    services/        API client
    hooks/           React hooks
    store/           Client state
    utils/           Shared frontend utilities and branding
  e2e/               Playwright smoke tests
.github/workflows/   Continuous integration
document/            Design notes, implementation plans, and integration guides
email-functionality/ Email-related documentation
panding/             Additional project notes
docker-compose.scaling.yml
package.json         Convenience scripts for the backend and frontend
```

## Local development

### Requirements

- Node.js 20 and npm (matching the CI configuration).
- A reachable MongoDB instance or MongoDB Atlas database. Use a replica set for workflows that require transactions; the backend environment example uses `replicaSet=rs0`.
- Docker Desktop with Linux containers if using the container commands below.

### Install dependencies

From the repository root:

```powershell
npm --prefix Backend ci
npm --prefix Frontend ci
```

The two applications have separate dependency lockfiles. The root `install-all` script currently installs backend dependencies only; install the frontend separately.

### Configure the environment

Copy the tracked backend template if you do not already have a local environment file:

```powershell
Copy-Item Backend/.env.example Backend/.env
```

Edit `Backend/.env` with your database URL and separate access/refresh secrets. A minimal local configuration is:

```dotenv
NODE_ENV=development
PORT=3002
MONGODB_URL=mongodb://127.0.0.1:27017/coursify?replicaSet=rs0
JWT_ACCESS_SECRET=replace-with-a-long-random-access-secret
JWT_REFRESH_SECRET=replace-with-a-different-long-random-refresh-secret
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
FRONTEND_URL=http://localhost:5173
EMAIL_PROVIDER=console
MEDIA_STORAGE_PROVIDER=local
QUEUE_ENABLED=false
REDIS_URL=
```

The example MongoDB URL assumes a running replica set named `rs0`; adjust it to match your database. `EMAIL_PROVIDER=console` logs development emails, and `MEDIA_STORAGE_PROVIDER=local` stores media locally. Redis is optional with the configuration above.

Create `Frontend/.env` containing:

```dotenv
VITE_API_BASE_URL=http://localhost:3002/api
```

Only put browser-safe configuration in `VITE_*` variables. Local `.env` files are ignored by Git; keep credentials out of commits.

### Start the application

Run each command in a separate terminal from the repository root:

```powershell
# Terminal 1: Express API with nodemon
npm run dev
```

```powershell
# Terminal 2: Vite development server
npm run frontend:dev
```

- Application: http://localhost:5173
- API: http://localhost:3002/api
- Liveness: http://localhost:3002/health/live
- Database readiness: http://localhost:3002/health/ready

The API waits for its MongoDB connection before it starts listening.

## Docker development

Run the following from the repository root in **PowerShell**, with Docker Desktop running. These commands mount your source code, keep container dependencies in named volumes, and enable file watching. MongoDB must already be available.

If MongoDB runs on your Windows host, change the hostname in `Backend/.env` from `127.0.0.1` or `localhost` to `host.docker.internal`. An Atlas URL can remain as configured. Replica-set member addresses must also be reachable from the container.

Start the backend in one terminal:

```powershell
docker run --rm -it --name coursify-api-dev `
  -p 3002:3002 `
  --env-file ./Backend/.env `
  -e NODE_ENV=development `
  -e PORT=3002 `
  -e EMAIL_PROVIDER=console `
  -e MEDIA_STORAGE_PROVIDER=local `
  -e QUEUE_ENABLED=false `
  -e REDIS_URL= `
  -e CORS_ORIGINS=http://localhost:5173 `
  -e FRONTEND_URL=http://localhost:5173 `
  -v "${PWD}/Backend:/app" `
  -v coursify-backend-deps:/app/node_modules `
  -w /app node:20-alpine `
  sh -c "npm ci && npm run dev -- --legacy-watch"
```

Start the frontend in another terminal:

```powershell
docker run --rm -it --name coursify-web-dev `
  -p 5173:5173 `
  -e VITE_API_BASE_URL=http://localhost:3002/api `
  -e CHOKIDAR_USEPOLLING=true `
  -v "${PWD}/Frontend:/app" `
  -v coursify-frontend-deps:/app/node_modules `
  -w /app node:20-alpine `
  sh -c "npm ci && npm run dev -- --host 0.0.0.0"
```

Open http://localhost:5173. Stop each process with `Ctrl+C`; the containers are removed automatically. Dependency volumes and locally uploaded media remain available.

### Existing production Docker configuration

`Backend/Dockerfile` installs production dependencies and runs `node index.js`; it does not provide nodemon or frontend development hosting.

`docker-compose.scaling.yml` defines the API and Redis with production settings. It requires external MongoDB and integration credentials, and does not include the frontend. It also declares two API replicas with a fixed `3002:3002` host port, which can cause port conflicts on one host. Use one replica for a single-host deployment, or configure a reverse proxy and distinct/unpublished API ports before scaling. This file is not a ready-to-run development stack.

## Integrations and configuration

| Capability | Configuration |
| --- | --- |
| Payments | `LEMONSQUEEZY_API_KEY`, `LEMONSQUEEZY_STORE_ID`, `LEMONSQUEEZY_VARIANT_ID`, `LEMONSQUEEZY_WEBHOOK_SECRET`; optional product ID |
| S3 media | `MEDIA_STORAGE_PROVIDER=s3`, `AWS_REGION`, `AWS_S3_BUCKET`, and AWS credentials appropriate to your environment |
| Local media | `MEDIA_STORAGE_PROVIDER=local`; optional `LOCAL_MEDIA_ROOT` and upload size/chunk settings |
| Cloudinary | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` for features using that integration |
| Email | `EMAIL_PROVIDER=console` locally, or `resend` with `RESEND_API_KEY` and sender/reply-to settings |
| Redis and queues | `REDIS_URL`; set `QUEUE_ENABLED=true` to start queue workers |
| Metrics | `METRICS_ENABLED`, optional `METRICS_TOKEN`; endpoint `/metrics` |
| Course approval | `COURSE_APPROVAL_REQUIRED` |

Production configuration requires S3 media storage and Resend email. Payments, remote uploads, and external email delivery need valid provider configuration; running the application locally does not provision those services.

See [the backend environment template](Backend/.env.example) for configuration names and defaults, and [API documentation](Backend/API_DOCUMENTATION.md) for endpoint details. Use the source authorization rules as the authority if older documentation differs from current behavior.

## Development commands

Run these from the repository root:

| Command | Purpose |
| --- | --- |
| `npm run dev` | Backend with automatic reload |
| `npm start` | Backend without automatic reload |
| `npm run frontend:dev` | Frontend development server |
| `npm run frontend:build` | Build frontend into `Frontend/dist` |
| `npm run frontend:preview` | Preview the frontend build locally |
| `npm run backend:lint` | Backend lint |
| `npm run frontend:lint` | Frontend lint |
| `npm test` | Backend unit and integration tests |
| `npm run frontend:test` | Frontend unit tests |
| `npm run frontend:e2e` | Playwright smoke tests |
| `npm run backend:load` | Backend load test |
| `npm --prefix Backend run payment:verify` | Verify Lemon Squeezy configuration |
| `npm run seed` | Populate/update demo data in the configured database |
| `npm run db:reset` | Delete application records from the configured database |
| `npm run db:migrate:refunded-enrollments` | Run the refunded enrollment migration |

Use seeding, reset, and migration commands only against an intended development database after reviewing their scripts. Seeding rewrites parts of demo content; `db:reset` deletes records across application models.

For initial Playwright setup:

```powershell
npm --prefix Frontend exec -- playwright install chromium
npm run frontend:e2e
```

Playwright starts a local Vite server by default. Set `PLAYWRIGHT_BASE_URL` to test an already running frontend instead.

The [CI workflow](.github/workflows/ci.yml) runs backend lint/tests, frontend lint/tests/format checks/build, and Chromium smoke tests. Database integration tests run only when `TEST_MONGODB_URL` is set; otherwise they are skipped. Point this variable at a dedicated disposable test database: the integration setup deletes records from its test collections.

## Troubleshooting

- **API exits before listening:** check the required environment variables and MongoDB connectivity. `/health/ready` reports database readiness once the API is running.
- **Browser requests fail:** verify `VITE_API_BASE_URL`, backend port, and that the browser origin is included in `CORS_ORIGINS`. Restart Vite after environment changes.
- **Container cannot reach local MongoDB:** use `host.docker.internal` and verify the database and replica-set addresses are accessible from Docker.
- **Redis connection warnings:** leave `REDIS_URL` empty and `QUEUE_ENABLED=false` when developing without Redis.
- **Uploads or checkout fail:** verify the integration credentials and selected storage provider. Console email and local media work without external email/storage accounts; payments still require Lemon Squeezy configuration.
