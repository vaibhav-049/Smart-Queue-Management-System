# Project Status

Status date: 2026-06-11

## Current State

The codebase is an active full-stack Smart Queue Management System with both frontend and backend implemented. The backend includes authentication, OTP email workflows, queue/token APIs, admin controls, reports, service metadata, QR code generation, and Socket.io updates. The frontend includes public marketing/auth pages, dashboard pages for token booking and queue status, user token management, profile, admin dashboard, reports, and public QR token tracking.

The registration UI was recently simplified so it now uses a single password field and then advances into OTP verification. The email service also accepts `EMAIL_APP_PASSWORD` plus the `APP_PASSWORD` and `app_Password` aliases for Gmail app-password setups.
The registration OTP step now also has a resend button that requests a fresh code using the same signup details.

This is not a clean baseline: `git status` shows many modified files and several untracked additions across both apps. The status below documents the working tree as found, without reverting or normalizing any existing changes.

## Working Tree Snapshot

Modified files observed:
- Backend package files and core source: `backend/package.json`, `backend/package-lock.json`, `backend/src/app.js`, `backend/src/config/db.js`, controllers, routes, and services.
- Frontend package files and source: `frontend/package.json`, `frontend/package-lock.json`, `frontend/src/App.jsx`, layouts, routes, pages, components, and CSS.
- Deleted frontend files: `frontend/src/components/NotificationPanel/NotificationPanel.jsx`, `frontend/src/components/QueueCard/QueueCard.jsx`, `frontend/src/services/mockData.js`.

Untracked files observed:
- `backend/src/controllers/serviceController.js`
- `backend/src/models/OTP.js`
- `backend/src/routes/serviceRoutes.js`
- `backend/src/services/emailService.js`
- `backend/test_flow.js`
- `frontend/refactor.cjs`
- `frontend/src/context/AuthContext.jsx`
- `frontend/src/hooks/`
- `frontend/src/pages/ForgotPassword/`
- `frontend/src/pages/ResetPassword/`
- `frontend/src/pages/TrackToken/`
- `frontend/src/services/api.js`
- `frontend/src/services/socket.js`
- Root `package.json` and `package-lock.json`

## Implemented Capabilities

Backend:
- Express API with security middleware, rate limiting, CORS, JSON parsing, Mongo sanitization, Swagger UI, and central error handling.
- MongoDB connection and startup seeding.
- JWT-based protected routes and admin middleware.
- OTP-based registration and password reset using email.
- User login and current-user lookup.
- User profile read/update.
- Service listing.
- Token booking with service validation, active-queue validation, priority support, daily sequence display IDs, QR generation, and queue recalculation.
- User token listing, token detail, cancellation, QR retrieval, and public display-ID tracking.
- Public queue status endpoints.
- Admin queue operations: call next, skip token, complete token, open/close queue.
- Admin analytics and report endpoints.
- Real-time Socket.io queue and token/user notification events.

Frontend:
- App shell with theme, auth, router, toast notifications, and Framer Motion setup.
- Public pages for home, login, registration, forgot password, reset password, and QR token tracking.
- Dashboard pages for booking tokens, live queue status, my tokens, and profile.
- Admin-only dashboard and reports routes guarded by role.
- Axios API client with bearer-token injection and global 401 logout handling.
- Socket client with service/user room helpers.
- Service metadata hook backed by `/api/services`.
- Real API usage has replaced older mock-data patterns in key flows.

## How To Run

Backend:
```bash
cd backend
npm install
npm run dev
```

Frontend:
```bash
cd frontend
npm install
npm run dev
```

Expected local URLs:
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000/api`
- Swagger docs: `http://localhost:5000/api-docs`

Required backend `.env` values:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/smart_queue
JWT_SECRET=replace_with_a_real_secret
JWT_EXPIRES_IN=30d
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
FRONTEND_URL=http://localhost:5173
EMAIL_USER=your_gmail_address
EMAIL_APP_PASSWORD=your_gmail_app_password
```

Optional frontend `.env` values:
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

## Verification Status

Not run during this documentation pass:
- Backend server startup.
- Frontend Vite build.
- Frontend lint.
- End-to-end token flow.
- API tests against a live MongoDB.

Reason: this task was documentation generation only, and the repo has environment-dependent requirements for MongoDB, JWT secret, and email credentials.

The existing `backend/test_flow.js` should be reviewed before use because it appears stale relative to the current OTP registration API. It expects `/api/auth/register` to return a JWT immediately, but the current backend sends an OTP first and only returns a JWT from `/api/auth/verify-register`.

## Known Risks And Gaps

Authentication and route protection:
- Dashboard routes such as `/book-token`, `/queue-status`, `/my-tokens`, and `/profile` are under `DashboardLayout`, but only admin routes have an explicit guard in `AppRoutes.jsx`. If `DashboardLayout` does not enforce auth internally, unauthenticated users may reach pages that then fail at API call time.
- `AuthProvider` uses React 19's `use(AuthContext)` pattern. That matches React 19 dependencies, but it should be verified by build/lint because most existing examples use `useContext`.

Registration and email:
- Registration now depends on email delivery. Local development needs valid Gmail app credentials or a test mail transport.
- OTP values are stored as plain strings in MongoDB. This may be acceptable for a student/demo project but would need hashing/rate controls for production.

Queue and service consistency:
- `db.js` seeds hospital, bank, college, government, and salon.
- `serviceController.js` fallback seed uses hospital, bank, restaurant, and government. These lists should be unified.
- Service prefixes in backend README are stale in at least one place; `db.js` is the current source of truth.

Reports and analytics:
- Daily report reads live data.
- Weekly and monthly report endpoints currently return static sample data.
- `Report` model exists but does not appear to be central to report generation yet.

Socket behavior:
- The frontend sends a token in Socket.io auth, but the backend socket setup does not currently verify socket auth.
- `emitAdminAction` exists in the frontend socket service, but the backend does not define an `admin-action` listener in `socket.js`.

Testing:
- There is no formal test framework configured in backend or frontend package scripts.
- `backend/test_flow.js` is a standalone script and likely needs updates for the OTP flow.
- No automated frontend tests are present.

Documentation:
- Root README is outdated and still refers to mock data and a planned backend.
- Frontend README is still the default Vite template.
- Backend README is closer, but parts are stale after OTP and service route changes.

Security and production readiness:
- Default admin credentials are seeded in code.
- CORS defaults to `*` when `CORS_ORIGIN` is missing.
- Rate limiting is global for `/api`, but OTP-specific abuse controls are not obvious.
- Email errors currently block OTP flows, so a missing email config will break registration/password reset.

## Recommended Next Steps

1. Run `npm run build` in `frontend` and fix any compile errors.
2. Run `npm run lint` in `frontend` and resolve high-signal issues.
3. Start MongoDB and run the backend with a complete `.env`.
4. Update `backend/test_flow.js` for OTP registration, or replace it with proper integration tests.
5. Add auth guarding for all dashboard routes if `DashboardLayout` does not already enforce it.
6. Unify default service seed data between `db.js` and `serviceController.js`.
7. Update root, backend, and frontend READMEs to match the current implementation.
8. Decide whether root `package.json` should be removed or expanded into useful workspace scripts.
9. Add a simple backend health check and documented smoke-test checklist.
10. Verify socket auth and remove or implement unused socket client helpers.

## Suggested Smoke Test

With MongoDB running and valid environment variables:
1. Start backend on `http://localhost:5000`.
2. Open `GET /` and `GET /api/services`.
3. Start frontend on `http://localhost:5173`.
4. Register a user and complete OTP verification.
5. Book a token for one service.
6. Confirm the token appears under My Tokens with a QR code.
7. Open `/track/{displayId}` and confirm public tracking works.
8. Log in as the seeded admin.
9. Open the admin dashboard and call next token.
10. Confirm Queue Status, My Tokens, and Track Token update correctly.

## Ownership Notes

The repository appears mid-refactor from mock-data frontend to real API integration. Treat existing modified and untracked files as intentional work in progress unless confirmed otherwise. Avoid broad rewrites until build/lint/runtime verification establishes the exact remaining failures.
