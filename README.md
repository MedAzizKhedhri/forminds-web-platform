# ForMinds Web Platform

A digital community engagement platform that connects students and graduates with recruiters and industry experts. ForMinds features intelligent matching, professional networking, and structured talent discovery — built to address fragmented job markets in Tunisia and Africa.

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | Next.js 16, React 19, TypeScript, Tailwind CSS 4, Radix UI, React Hook Form, Zod, next-intl |
| **Backend** | Express.js 4, TypeScript, Mongoose 8, MongoDB 7, JWT (RS256), Nodemailer, Multer |
| **AI Service** | Python 3.11, FastAPI, Uvicorn |
| **Infrastructure** | Docker, Nginx, GitHub Actions CI/CD |

## Project Structure

```
forminds-web-platform/
├── frontend/                 # Next.js web application
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/       # Login, register, verify, reset pages
│   │   │   ├── (dashboard)/  # Authenticated pages
│   │   │   │   ├── dashboard/
│   │   │   │   ├── feed/         # Social feed (posts, likes, comments)
│   │   │   │   ├── network/      # Connections & suggestions
│   │   │   │   ├── directory/    # Profile directory & search
│   │   │   │   ├── opportunities/# Job/internship listings & detail
│   │   │   │   ├── applications/ # Student application tracking
│   │   │   │   ├── recommendations/ # AI matching recommendations
│   │   │   │   ├── events/       # Events listing, detail, create, check-in
│   │   │   │   ├── admin/        # Admin dashboard & moderation
│   │   │   │   ├── applicants/   # Recruiter applicant management
│   │   │   │   ├── profile/      # User profile management
│   │   │   │   ├── projects/     # Portfolio projects
│   │   │   │   └── settings/     # Account settings & 2FA
│   │   │   └── page.tsx          # Landing page
│   │   ├── components/
│   │   │   ├── auth/         # Auth forms
│   │   │   ├── feed/         # PostCard, CommentSection, LikeButton
│   │   │   ├── network/      # ConnectionCard, SuggestionList
│   │   │   ├── directory/    # DirectoryGrid
│   │   │   ├── opportunities/# OpportunityDetail, OpportunityCard
│   │   │   ├── applications/ # ApplicationList
│   │   │   ├── events/       # EventForm, EventCard
│   │   │   ├── profile/      # ProfileForms, PublicProfileView
│   │   │   ├── layout/       # Navbar, Sidebar, LanguageSwitcher
│   │   │   └── ui/           # Radix UI primitives
│   │   ├── hooks/            # useAuth, useProfile, usePosts, useDirectory, useOpportunities, useMatching, useEvents, useAdmin
│   │   ├── lib/              # API client, auth helpers, validations
│   │   ├── i18n/             # Internationalization (French default)
│   │   ├── providers/        # Context providers
│   │   └── types/            # TypeScript type definitions
│   └── public/               # Static assets (logos, icons)
├── backend/                  # Express.js API server
│   ├── src/
│   │   ├── models/           # Mongoose schemas
│   │   │   ├── User.ts
│   │   │   ├── StudentProfile.ts / RecruiterProfile.ts
│   │   │   ├── Token.ts
│   │   │   ├── Connection.ts
│   │   │   ├── Opportunity.ts / Application.ts
│   │   │   ├── Event.ts / Registration.ts
│   │   │   ├── AuditLog.ts
│   │   │   └── Post.ts / Like.ts / Comment.ts
│   │   ├── controllers/      # Route handlers
│   │   ├── routes/           # API route definitions
│   │   ├── services/         # Business logic
│   │   │   ├── auth.service.ts       # Register, login, 2FA, password reset
│   │   │   ├── profile.service.ts    # Profile CRUD, account deletion
│   │   │   ├── connection.service.ts # Networking (send, accept, reject, remove)
│   │   │   ├── opportunity.service.ts# Job/internship listings
│   │   │   ├── application.service.ts# Candidatures
│   │   │   ├── post.service.ts       # Social feed (posts, likes, comments)
│   │   │   ├── directory.service.ts  # Profile search & directory
│   │   │   ├── matching.service.ts   # AI recommendation orchestration
│   │   │   ├── ai.service.ts         # AI/FastAPI integration with fallback
│   │   │   ├── event.service.ts      # Event CRUD, registration, check-in
│   │   │   ├── admin.service.ts      # Admin moderation & platform stats
│   │   │   ├── audit.service.ts      # Admin audit logging
│   │   │   ├── email.service.ts      # Transactional emails
│   │   │   └── token.service.ts      # JWT management
│   │   ├── middleware/       # Auth, validation, rate limiting, upload, error handling
│   │   └── utils/            # Helpers and constants
│   └── keys/                 # RSA keypair for JWT (generated)
├── ai-service/               # FastAPI AI/ML service
│   └── app/
├── docker/                   # Dockerfiles and Nginx config
├── doc/                      # UML diagrams & sprint documentation
├── docker-compose.yml        # Production setup
└── docker-compose.dev.yml    # Development overrides
```

## Features

### Sprint 1 — Authentication & Profiles (BF-001, BF-002)

- **Authentication** — Registration with email verification, login with JWT (access + refresh tokens), password reset, two-factor authentication (enable/disable 2FA), Google/LinkedIn provider support
- **User Roles** — Student, Recruiter, and Admin with role-specific profiles and authorization
- **Student Profiles** — Skills, education, experience, projects, portfolio, CV upload, profile completion tracking, public/private visibility
- **Recruiter Profiles** — Company name, sector, description, location, verification status
- **Public Profiles** — Username-based public URLs (`/p/[username]`)
- **File Uploads** — Avatar, cover image, CV documents, project images (5 MB max)
- **Account Management** — Settings page, account deletion with full cascade cleanup (decrements like/comment counts on other users' posts)
- **Internationalization** — French by default with language switcher

### Sprint 2 — Networking, Feed & Opportunities (BF-003, BF-004)

- **Networking** — Send/accept/reject connection requests, connection suggestions, remove connections
- **Profile Directory** — Searchable directory with filters (skills, domain, city), paginated grid view
- **Social Feed** — Create/edit/delete posts, like/unlike posts, comment on posts, expand comments inline, admin moderation
- **Opportunities** — Recruiters create/edit/close job and internship listings with skills, domain, deadline, location
- **Applications** — Students apply to opportunities (1-click with optional cover letter), track application status; recruiters manage received applications (review, shortlist, accept, reject)

### Sprint 3 — AI Matching & Events (BF-005, BF-006)

- **AI Matching** — Personalized opportunity recommendations via FastAPI service (TF-IDF/embedding scoring), detailed score breakdown (skills, location, domain, experience), matched/missing skills analysis, AI-generated explanations, deterministic fallback when AI service is unavailable
- **Events** — Recruiters create hybrid events (online/in-person) with image upload, capacity management, and 5 event types (conference, workshop, networking, webinar, career fair); events require admin approval before becoming visible
- **Event Registration** — Students register for upcoming events, receive email confirmation with QR code, view all tickets in "My Tickets" page
- **QR Check-in** — Organizers scan participant QR codes via camera (html5-qrcode) or manual input, real-time check-in status tracking, participant list with attendance ratio

### Sprint 4 — Administration & Governance (BF-007) (planned)

- **Admin Dashboard** — Platform statistics (users, opportunities, applications, events), KPI cards with quick action links
- **Opportunity Moderation** — Admin approves/rejects pending opportunities with optional rejection reason
- **Event Moderation** — Admin approves/rejects pending events with optional rejection reason
- **Recruiter Verification** — Admin verifies recruiter accounts
- **User Management** — Search/filter users, suspend/reactivate accounts with reason
- **Audit Log** — Filterable log of all admin actions (approvals, rejections, verifications, suspensions)

## Prerequisites

- **Node.js** 20+
- **MongoDB** 7.0 (local or Atlas)
- **Python** 3.11+ (for AI service)
- **Docker & Docker Compose** (optional, for containerized setup)

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd forminds-web-platform
```

### 2. Install dependencies

```bash
# Install all workspace dependencies from root
npm install
```

### 3. Configure environment variables

Copy the example env files and fill in the values:

```bash
cp frontend/.env.example frontend/.env.local
cp backend/.env.example backend/.env
```

**Frontend** (`.env.local`):

```env
NEXT_PUBLIC_API_URL=http://localhost:5001/api
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_DEFAULT_LOCALE=fr
```

**Backend** (`.env`):

```env
NODE_ENV=development
PORT=5001
MONGODB_URI=mongodb://localhost:27017/forminds
SERVER_URL=http://localhost:5001
JWT_PRIVATE_KEY_PATH=./keys/private.pem
JWT_PUBLIC_KEY_PATH=./keys/public.pem
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY_DAYS=7
FRONTEND_URL=http://localhost:3000
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=ForMinds <noreply@forminds.com>
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880
```

### 4. Generate JWT keys

```bash
npm run generate:keys --workspace=backend
```

This creates an RSA keypair at `backend/keys/private.pem` and `backend/keys/public.pem`.

### 5. Start development servers

```bash
# Backend (port 5001)
npm run dev:backend

# Frontend (port 3000) — in a separate terminal
npm run dev:frontend
```

Or with Docker:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up
```

### 6. Seed admin user (optional)

```bash
npm run seed:admin --workspace=backend
```

Default admin credentials: `admin@forminds.com` / `Admin@123456`

---

## Latest Updates (Current Version)

### ✅ Fixed Issues
- **Backend Dependencies**: Installed missing nodemailer package for email functionality
- **Database Schema**: Removed duplicate MongoDB unique index on `qrCode` in Registration model to eliminate warnings
- **Frontend Translations**: Added comprehensive translation keys for all pages
  - Network page: connections, pending requests, sent requests, suggestions
  - Dashboard, events, opportunities, profile, feed, and admin pages
- **Next.js Configuration**: Removed invalid `reactCompiler` option from next.config.ts
- **Email Service**: Configured SMTP with Ethereal fallback for local development testing

### 📧 Email Configuration
- **Production**: Use Brevo SMTP (free tier: 300 emails/day)
- **Development**: Ethereal test account (auto-created when SMTP_HOST is empty)
- **Password Reset**: Reset link logged to backend console and available in Ethereal preview

### 🔐 Admin Setup
- Access admin dashboard at: `http://localhost:3000/admin`
- Features: Audit logs, user management, event & opportunity moderation
- Seed command: `cd backend && npm run seed:admin`

## API Endpoints

### Authentication (`/api/auth`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/register` | Register a new user |
| `POST` | `/login` | Login with email + password |
| `POST` | `/verify-email` | Verify email address |
| `POST` | `/resend-verification` | Resend verification email |
| `POST` | `/forgot-password` | Request password reset |
| `POST` | `/reset-password` | Reset password with token |
| `POST` | `/refresh-token` | Refresh access token |
| `POST` | `/enable-2fa` | Enable two-factor authentication |
| `POST` | `/confirm-2fa` | Confirm 2FA with code |
| `POST` | `/disable-2fa` | Disable two-factor authentication |
| `POST` | `/verify-2fa` | Verify 2FA code during login |
| `POST` | `/logout` | Logout (invalidate refresh token) |
| `GET`  | `/me` | Get current authenticated user |

### Profiles (`/api/profiles`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`  | `/me` | Get current user profile |
| `PUT`  | `/student` | Update student profile |
| `PUT`  | `/recruiter` | Update recruiter profile |
| `POST` | `/avatar` | Upload avatar |
| `DELETE`| `/avatar` | Remove avatar |
| `POST` | `/cover-image` | Upload cover image |
| `DELETE`| `/cover-image` | Remove cover image |
| `POST` | `/cv` | Upload CV |
| `DELETE`| `/cv` | Remove CV |
| `POST` | `/projects` | Add project |
| `PUT`  | `/projects/:id` | Update project |
| `DELETE`| `/projects/:id` | Delete project |
| `POST` | `/education` | Add education |
| `PUT`  | `/education/:id` | Update education |
| `DELETE`| `/education/:id` | Delete education |
| `POST` | `/experiences` | Add experience |
| `PUT`  | `/experiences/:id` | Update experience |
| `DELETE`| `/experiences/:id` | Delete experience |
| `GET`  | `/public/:username` | Get public profile |
| `DELETE`| `/account` | Delete account (cascade) |

### Connections (`/api/connections`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/request` | Send connection request |
| `PATCH`| `/:id` | Accept or reject request |
| `GET`  | `/` | List accepted connections |
| `GET`  | `/pending` | List pending requests received |
| `GET`  | `/sent` | List sent requests |
| `GET`  | `/suggestions` | Get connection suggestions |
| `DELETE`| `/:id` | Remove a connection |
| `GET`  | `/status/:userId` | Check connection status with user |

### Opportunities (`/api/opportunities`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/` | Create opportunity (recruiter) |
| `GET`  | `/` | Search/list opportunities |
| `GET`  | `/mine` | List recruiter's own opportunities |
| `GET`  | `/:id` | Get opportunity detail |
| `PUT`  | `/:id` | Update opportunity (recruiter) |
| `PATCH`| `/:id/close` | Close opportunity (recruiter) |
| `PATCH`| `/:id/reopen` | Reopen closed opportunity (recruiter) |
| `DELETE`| `/:id` | Delete opportunity with cascade (recruiter) |

### Applications (`/api/applications`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/` | Apply to opportunity (student) |
| `GET`  | `/mine` | List student's applications |
| `GET`  | `/recruiter` | List all recruiter's applications (filterable) |
| `GET`  | `/opportunity/:id` | List applications for opportunity (recruiter) |
| `GET`  | `/:id` | Get application detail |
| `PATCH`| `/:id/status` | Update application status (recruiter) |

### Social Feed (`/api/posts`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/` | Create a post |
| `GET`  | `/` | Get feed (paginated) |
| `PATCH`| `/:id` | Update post (author/admin) |
| `DELETE`| `/:id` | Delete post (author/admin) |
| `POST` | `/:id/like` | Like a post |
| `DELETE`| `/:id/like` | Unlike a post |
| `POST` | `/:id/comments` | Add comment |
| `GET`  | `/:id/comments` | Get comments for post |
| `DELETE`| `/:postId/comments/:commentId` | Delete comment (author/admin) |

### Directory (`/api/profiles/directory`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`  | `/` | Search profiles (skills, domain, city) |

### AI Matching (`/api/matching`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`  | `/recommendations` | Get AI-powered opportunity recommendations (student) |
| `GET`  | `/score/:opportunityId` | Get detailed match score for an opportunity (student) |

### Events (`/api/events`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/` | Create event (recruiter) |
| `GET`  | `/` | List events (filterable by type, status, search) |
| `GET`  | `/organizer/mine` | List organizer's events (recruiter) |
| `GET`  | `/registrations/mine` | List user's event registrations |
| `GET`  | `/:id` | Get event detail |
| `PATCH`| `/:id` | Update event (recruiter) |
| `PATCH`| `/:id/cancel` | Cancel event (recruiter) |
| `DELETE`| `/:id` | Delete event (recruiter) |
| `POST` | `/:id/register` | Register for event |
| `DELETE`| `/:id/register` | Cancel registration |
| `GET`  | `/:id/my-registration` | Get user's registration for event |
| `POST` | `/:id/checkin` | Check-in participant via QR code (recruiter) |
| `GET`  | `/:id/participants` | List event participants (recruiter) |
| `POST` | `/upload-image` | Upload event image (recruiter) |

### Admin (`/api/admin`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`  | `/stats` | Get platform statistics (admin) |
| `GET`  | `/opportunities` | List pending opportunities (admin) |
| `PATCH`| `/opportunities/:id` | Approve/reject opportunity (admin) |
| `GET`  | `/events` | List pending events (admin) |
| `PATCH`| `/events/:id` | Approve/reject event (admin) |
| `GET`  | `/recruiters` | List unverified recruiters (admin) |
| `PATCH`| `/recruiters/:userId/verify` | Verify recruiter (admin) |
| `GET`  | `/audit-log` | Get audit log entries (admin) |

### User Management (`/api/users`) — Admin only

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`  | `/` | List all users (paginated) |
| `GET`  | `/:id` | Get user by ID |
| `PATCH`| `/:id/status` | Toggle user active status |

### Other

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`  | `/api/health` | Service health check |
| `GET`  | `/uploads/*` | Static file serving |

## Scripts

### Root (workspace)

| Command | Description |
|---------|-------------|
| `npm run dev:backend` | Start backend dev server |
| `npm run dev:frontend` | Start frontend dev server |
| `npm run build:backend` | Build backend |
| `npm run build:frontend` | Build frontend |
| `npm run lint:backend` | Lint backend |
| `npm run lint:frontend` | Lint frontend |
| `npm run test:backend` | Run backend tests |
| `npm run test:frontend` | Run frontend tests |

### Backend-specific

| Command | Description |
|---------|-------------|
| `npm run generate:keys` | Generate RSA keypair for JWT |
| `npm run seed:admin` | Seed default admin user |

## Testing

**Backend** — Jest with MongoDB Memory Server for isolated database tests:

```bash
npm run test:backend
```

**Frontend** — Jest with React Testing Library:

```bash
npm run test:frontend
```

## Docker Deployment

**Production:**

```bash
docker compose up -d
```

**Services and ports:**

| Service | Port |
|---------|------|
| Frontend | 3000 |
| Backend | 5001 |
| AI Service | 8000 |
| MongoDB | 27017 |
| Nginx (prod) | 80, 443 |

All services communicate over the `forminds_network` bridge. MongoDB data is persisted in the `forminds_mongo_data` volume.

## Security

- **JWT RS256** — Asymmetric RSA encryption for token signing
- **Password Policy** — Minimum 8 characters, uppercase, lowercase, digit, special character
- **Rate Limiting** — Global (20 req/s), auth endpoints (5 req/s)
- **Helmet** — Security headers (CSP, X-Frame-Options, etc.)
- **CORS** — Restricted to configured frontend URL
- **bcryptjs** — Salted password hashing
- **Email Verification** — Required for account activation
- **2FA** — Email-based two-factor authentication (enable/disable)
- **Cascade Deletion** — Account deletion cleans up all related data and adjusts counters

## Documentation

Sprint-level documentation is available in the `doc/` directory:

| Document | Description |
|----------|-------------|
| `UML-Diagrams-Sprint1.md` | Use cases, sequences, class diagrams for Auth & Profiles |
| `UML-Diagrams-Sprint2.md` | Use cases, sequences, class diagrams for Networking, Feed & Opportunities |
| `UML-Diagrams-Sprint3.md` | Use cases, sequences, class diagrams for AI Matching & Events |
| `UML-Diagrams-Sprint4.md` | Use cases, sequences, class diagrams for Administration & Governance |
| `Backend-Documentation-Sprint1.md` | Backend API documentation for Sprint 1 |
| `Backend-Documentation-Sprint2.md` | Backend API documentation for Sprint 2 |
| `Backend-Documentation-Sprint3.md` | Backend API documentation for Sprint 3 |
| `Backend-Documentation-Sprint4.md` | Backend API documentation for Sprint 4 |
| `Frontend-Documentation-Sprint1.md` | Frontend architecture documentation for Sprint 1 |
| `Frontend-Documentation-Sprint2.md` | Frontend architecture documentation for Sprint 2 |
| `Frontend-Documentation-Sprint3.md` | Frontend architecture documentation for Sprint 3 |
| `Frontend-Documentation-Sprint4.md` | Frontend architecture documentation for Sprint 4 |

## CI/CD

GitHub Actions pipeline runs on push to `main`/`develop` and pull requests:

1. Lint and test backend (with MongoDB service)
2. Lint, test, and build frontend
3. Build Docker images on success

## Authors

- **Yahya Somrani**
- **Med Aziz Khedhri**

Developed in partnership with **WEVE Digital** as a final year project (PFE) at ISET de Jendouba — Bachelor's in Information Technology (DSI3).
