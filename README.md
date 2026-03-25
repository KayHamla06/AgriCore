# AgriCore Backend API

Secure TypeScript/Express backend for the AgriCore agricultural intelligence platform.

## Tech Stack

- **Runtime:** Node.js + TypeScript
- **Framework:** Express.js
- **Database:** PostgreSQL (Supabase)
- **Storage:** Supabase Storage
- **Auth:** Supabase Auth + JWT
- **Weather:** Cron-based daily fetch
- **Validation:** Zod schemas

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy environment template
cp .env.example .env
# Fill in your Supabase credentials and secrets

# 3. Run database migration
# Copy src/database/migration.sql into the Supabase SQL editor and execute

# 4. Start development server
npm run dev
```

## Project Structure

```
backend/src/
├── server.ts              # Express app entry point
├── config/                # Supabase client + env config
├── middleware/             # Auth, RBAC, validation, error handling
│   ├── authMiddleware.ts  # JWT verification via Supabase
│   ├── roleMiddleware.ts  # Role-based access (farmer/gov)
│   ├── validateRequest.ts # Zod request validation
│   └── errorHandler.ts    # Global error handler
├── controllers/           # Request handlers
├── services/              # Business logic
├── routes/                # Express route definitions
├── models/                # TypeScript type definitions
├── weather/               # Weather fetch + cron system
│   ├── weatherService.ts  # API calls + DB storage
│   ├── weatherParser.ts   # Response parsing
│   └── weatherCron.ts     # Daily cron job
├── database/
│   └── migration.sql      # Full schema + RLS policies
└── utils/
    └── logger.ts          # Winston logging
```

## API Endpoints

### Auth (`/api/auth`)
| Method | Endpoint     | Auth | Description           |
|--------|-------------|------|-----------------------|
| POST   | `/signup`   | No   | Register new user     |
| POST   | `/login`    | No   | Login, returns JWT    |
| POST   | `/logout`   | Yes  | Invalidate session    |
| GET    | `/me`       | Yes  | Get current user      |
| POST   | `/refresh`  | No   | Refresh access token  |

### Farmers (`/api/farmers`)
| Method | Endpoint                     | Auth  | Role            |
|--------|------------------------------|-------|-----------------|
| GET    | `/`                          | Yes   | Government only |
| GET    | `/me`                        | Yes   | Farmer only     |
| GET    | `/:farmerId`                 | Yes   | Owner or Gov    |
| PUT    | `/:farmerId`                 | Yes   | Owner or Gov    |
| GET    | `/:farmerId/livestock`       | Yes   | Owner or Gov    |
| POST   | `/:farmerId/livestock`       | Yes   | Owner or Gov    |
| GET    | `/:farmerId/crops`           | Yes   | Owner or Gov    |
| POST   | `/:farmerId/crops`           | Yes   | Owner or Gov    |
| GET    | `/:farmerId/soil`            | Yes   | Owner or Gov    |
| POST   | `/:farmerId/soil`            | Yes   | Owner or Gov    |
| GET    | `/district/:district`        | Yes   | Government only |

### Upload (`/api/upload`)
| Method | Endpoint                       | Auth | Role         |
|--------|-------------------------------|------|--------------|
| POST   | `/:farmerId/farm-image`       | Yes  | Owner or Gov |
| POST   | `/:farmerId/id-document`      | Yes  | Owner or Gov |
| POST   | `/:farmerId/profile-image`    | Yes  | Owner or Gov |

### Plans (`/api/plans`)
| Method | Endpoint                  | Auth | Role            |
|--------|--------------------------|------|-----------------|
| GET    | `/`                      | Yes  | Government only |
| GET    | `/mine`                  | Yes  | Farmer only     |
| GET    | `/farmer/:farmerId`      | Yes  | Government only |
| POST   | `/`                      | Yes  | Any             |
| PUT    | `/:planId`               | Yes  | Any             |
| POST   | `/:planId/approve`       | Yes  | Government only |
| POST   | `/:planId/reject`        | Yes  | Government only |
| DELETE | `/:planId`               | Yes  | Creator only    |

### User (`/api/user`)
| Method | Endpoint     | Auth | Description           |
|--------|-------------|------|-----------------------|
| GET    | `/profile`  | Yes  | Get full profile      |
| PUT    | `/settings` | Yes  | Update settings       |
| PUT    | `/password` | Yes  | Change password       |
| DELETE | `/`         | Yes  | Delete account        |

### Weather (`/api/weather`)
| Method | Endpoint                | Auth | Role            |
|--------|------------------------|------|-----------------|
| GET    | `/:farmerId`           | Yes  | Owner or Gov    |
| GET    | `/:farmerId/latest`    | Yes  | Owner or Gov    |
| POST   | `/fetch-all`           | Yes  | Government only |

## Security

- All database access goes through the API — never from frontend directly
- JWT tokens verified via Supabase Auth on every protected route
- Role-based access control: `requireRole('farmer')`, `requireRole('government')`
- Owner-based access: farmers can only access their own data
- Zod validation on all request bodies
- Rate limiting (100 req/15min general, 10/15min for auth)
- Helmet security headers
- CORS restricted to allowed origins
- Supabase Row Level Security (RLS) as a second defense layer
- File type/size validation on uploads

## Environment Variables

See `.env.example` for the full list. Required:
- `SUPABASE_URL` / `SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY`
- `JWT_SECRET` (min 32 characters)
- `WEATHER_API_URL` / `WEATHER_API_KEY` (optional, disables cron if missing)
