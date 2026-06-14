# Project Context

Last updated: 2026-06-13

## Overview

Smart Queue Management System is a full-stack queue booking and management app for service-heavy organizations such as hospitals, banks, colleges, government offices, and salons. The app lets users register, authenticate, book queue tokens, view token QR codes, track queue position, and manage their profile. Admin users can operate queues, call or skip tokens, open and close service queues, and view analytics/reports.

The repository currently contains a Vite/React frontend and an Express/MongoDB backend. The root README is partly stale because it still describes the backend as planned, while the backend is now implemented.

## Repository Layout

```text
.
├── backend/
│   ├── src/
│   │   ├── app.js
│   │   ├── server.js
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   └── services/
│   ├── package.json
│   └── test_flow.js
├── frontend/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── routes/
│   │   └── services/
│   ├── package.json
│   └── vite.config.js
├── README.md
├── package.json
└── package-lock.json
```

## Tech Stack

Frontend:
- React 19 with Vite
- React Router 7
- Tailwind CSS 3 plus custom CSS in `frontend/src/index.css`
- Framer Motion for animation
- Recharts for dashboard/report charts
- React Hot Toast for notifications
- React Icons for iconography
- Axios for API requests
- Socket.io Client for live queue/user updates
- qrcode.react for frontend QR rendering
- html5-qrcode for live webcam scanning feeds

Backend:
- Node.js and Express 4
- MongoDB with Mongoose
- JWT authentication with `jsonwebtoken`
- Password hashing with `bcryptjs`
- Socket.io for real-time events
- Nodemailer for email OTP delivery
- QR code generation with `qrcode`
- Security middleware: Helmet, CORS, rate limiting, and Mongo sanitize
- Swagger UI mounted at `/api-docs`

## Runtime Entry Points

Frontend:
- `frontend/src/main.jsx` mounts the React app.
- `frontend/src/App.jsx` wraps the app in `ThemeProvider`, `AuthProvider`, `BrowserRouter`, toast handling, and Framer Motion lazy features.
- `frontend/src/routes/AppRoutes.jsx` defines public routes, dashboard routes, and admin-only routing.

Backend:
- `backend/src/server.js` loads environment variables, creates the HTTP server, initializes Socket.io, connects MongoDB, and starts listening on `PORT` or `5000`.
- `backend/src/app.js` configures Express middleware, Swagger docs, route mounting, and error handlers.
- `backend/src/config/db.js` connects Mongoose and seeds default services, queue containers, and an admin user.

## Environment Variables

Backend:
- `PORT`: backend port, defaults to `5000`.
- `MONGODB_URI`: MongoDB connection string. Required.
- `JWT_SECRET`: JWT signing secret. Required.
- `JWT_EXPIRES_IN`: JWT lifetime, defaults to `30d`.
- `NODE_ENV`: enables development logging when set to `development`.
- `CORS_ORIGIN`: allowed frontend origin, defaults to `*`.
- `FRONTEND_URL`: used in QR code links, defaults to `http://localhost:5173`.
- `EMAIL_USER`: Gmail account used by Nodemailer.
- `EMAIL_APP_PASSWORD`: Gmail app password used by Nodemailer.
- `APP_PASSWORD` / `app_Password`: legacy aliases also accepted by the email service.

Frontend:
- `VITE_API_URL`: backend API base URL, defaults to `http://localhost:5000/api`.
- `VITE_SOCKET_URL`: Socket.io server URL, defaults to `http://localhost:5000`.

## Backend Architecture

The backend follows a conventional Express MVC structure:
- Routes define HTTP surfaces under `/api`.
- Controllers implement request handling and call models/services.
- Mongoose models represent persisted data.
- Services hold reusable domain logic such as queue recalculation, token generation, QR generation, and email sending.
- Middleware handles auth, admin authorization, not-found responses, and central error formatting.
- Socket helpers centralize queue, token, and notification events.

### API Mounts

Configured in `backend/src/app.js`:
- `GET /`: API welcome response.
- `/api-docs`: Swagger UI.
- `/api/auth`: authentication and OTP flows.
- `/api/users`: user profile read/update.
- `/api/tokens`: token booking, lookup, cancellation, QR, and public tracking.
- `/api/queues` and `/api/queue`: public queue status endpoints.
- `/api/admin`: admin queue controls and analytics.
- `/api/reports`: admin report summaries/downloads.
- `/api/services`: service list.

### Route Summary

Auth:
- `POST /api/auth/register`: starts registration by creating and emailing an OTP.
- `POST /api/auth/verify-register`: verifies OTP, creates the user, and returns a JWT.
- `POST /api/auth/login`: authenticates and returns a JWT.
- `POST /api/auth/forgot-password`: emails a reset OTP.
- `POST /api/auth/reset-password`: verifies reset OTP and changes password.
- `GET /api/auth/me`: returns the current authenticated user.

Users:
- `GET /api/users/profile`: current user profile.
- `PUT /api/users/profile`: update current user name, phone, avatar, and optionally password.

Tokens:
- `POST /api/tokens/book`: authenticated token booking.
- `GET /api/tokens/my-tokens`: current user's tokens.
- `GET /api/tokens/:id`: authenticated token detail.
- `PUT /api/tokens/:id/cancel`: cancel a token and recalculate queue.
- `GET /api/tokens/:id/qr`: fetch QR code data URI.
- `GET /api/tokens/track/:displayId`: public tracking endpoint used by QR links.

Queues:
- `GET /api/queues/status`: status map for all service queues.
- `GET /api/queues/live`: simple live queue response.
- `GET /api/queues/public-stats`: public landing-page metrics.
- `GET /api/queues/:service/status`: detailed status and active tokens for one service.

Admin:
- `POST /api/admin/queues/:service/next`: call next token for a service.
- `POST /api/admin/queues/:service/skip/:tokenId`: skip a token by route parameter.
- `POST /api/admin/queues/:service/close`: close a service queue.
- `POST /api/admin/queues/:service/open`: open a service queue.
- `POST /api/admin/call-next`: action-style call next endpoint.
- `POST /api/admin/skip-token`: action-style skip endpoint.
- `POST /api/admin/complete-token`: mark serving token complete.
- `POST /api/admin/close-queue`: action-style close endpoint.
- `POST /api/admin/open-queue`: action-style open endpoint.
- `GET /api/admin/analytics`: admin dashboard analytics.
- `POST /api/admin/verify-token`: verify scanned token details.
- `POST /api/admin/serve-token`: serve verified scanned token directly.

Reports:
- `GET /api/reports/download`: CSV or JSON token export, filtered by format/service/date range.
- `GET /api/reports/daily`: daily token counts.
- `GET /api/reports/weekly`: weekly chart data.
- `GET /api/reports/monthly`: monthly chart data.

Services:
- `GET /api/services`: list services, with fallback seeding if none exist.

## Data Model Summary

`User`:
- Stores name, email, phone, password hash, role (`user` or `admin`), avatar, and timestamps.
- Hashes passwords before save.
- Provides `matchPassword`.

`Service`:
- Stores service slug `id`, display name, icon, color, description, token prefix, and average service time.

`Queue`:
- One queue document per service.
- Tracks `currentServing`, `upcoming` display IDs, `totalInQueue`, `avgWait`, and `isActive`.

`Token`:
- Stores unique `displayId`, user reference, service slug, status, priority, time slot, daily sequence number, wait time, user name/phone snapshot, QR code data URI, and timestamps.
- Status values: `waiting`, `serving`, `completed`, `cancelled`.
- Priority values: `normal`, `senior`, `vip`, `emergency`.

`OTP`:
- Stores email, OTP, type (`register` or `reset_password`), optional temporary registration data, and a 10-minute TTL.

`Report`:
- Defines daily report-like aggregate fields, though most report endpoints currently calculate directly from `Token` or return static sample data.

## Queue Logic

The main queue state is maintained by `backend/src/services/queueManager.js`.

Queue ordering rules:
- Active tokens are `serving` or `waiting`.
- Waiting tokens sort by priority rank first, then FIFO by creation time.
- Priority ranking: emergency, senior, VIP, normal.
- Serving tokens get wait time `0`.
- Waiting token wait time is `(position - 1) * service.avgServiceTime`.
- The matching `Queue` document is updated with `currentServing`, `upcoming`, `totalInQueue`, `avgWait`.
- Socket events notify queue screens and individual users.

Token generation:
- `backend/src/services/tokenGenerator.js` generates display IDs from the service prefix plus a 3-digit daily sequence, such as `H001`.
- The sequence resets per service per day by looking at today's highest `sequenceNumber`.

QR generation:
- `backend/src/services/qrGenerator.js` creates a QR data URI that points to `${FRONTEND_URL}/track/${displayId}`.

## Real-Time Events

Socket server:
- Initialized in `backend/src/config/socket.js`.
- Supports service rooms named `${service}_queue`.
- Supports user rooms named `user_${userId}`.

Backend emit helpers:
- `emitQueueUpdate(service, data)`: emits `queue-updated` to the service room and globally.
- `emitTokenUpdate(userId, tokenDisplayId, data)`: emits `token_update` to a user room.
- `emitUserNotification(userId, notification)`: emits `notification` to a user room.
- `emitTokenCreated(token)`: emits `token-created` globally.
- `emitTokenCalled(token)`: emits `token-called` globally.
- `emitQueueCompleted(service)`: emits `queue-completed` globally.

Frontend socket service:
- `frontend/src/services/socket.js` connects to `VITE_SOCKET_URL`.
- Auth token is passed in Socket.io `auth`.
- Exposes helpers for joining service/user rooms and reading the current socket.
## Tech Stack

Frontend:
- React 19 with Vite
- React Router 7
- Tailwind CSS 3 plus custom CSS in `frontend/src/index.css`
- Framer Motion for animation
- Recharts for dashboard/report charts
- React Hot Toast for notifications
- React Icons for iconography
- Axios for API requests
- Socket.io Client for live queue/user updates
- qrcode.react for frontend QR rendering
- html5-qrcode for live webcam scanning feeds

Backend:
- Node.js and Express 4
- MongoDB with Mongoose
- Razorpay for VIP payment gateway integration
- JWT authentication with `jsonwebtoken`
- Password hashing with `bcryptjs`
- Socket.io for real-time events
- Nodemailer for email OTP delivery
- QR code generation with `qrcode`
- Security middleware: Helmet, CORS, xss-clean, rate limiting, and Mongo sanitize
- Swagger UI mounted at `/api-docs`

## Runtime Entry Points

Frontend:
- `frontend/src/main.jsx` mounts the React app.
- `frontend/src/App.jsx` wraps the app in `ThemeProvider`, `AuthProvider`, `BrowserRouter`, toast handling, and Framer Motion lazy features.
- `frontend/src/routes/AppRoutes.jsx` defines public routes, dashboard routes, and admin-only routing.

Backend:
- `backend/src/server.js` loads environment variables, creates the HTTP server, initializes Socket.io, connects MongoDB, and starts listening on `PORT` or `5000`.
- `backend/src/app.js` configures Express middleware, Swagger docs, route mounting, and error handlers.
- `backend/src/config/db.js` connects Mongoose and seeds default services, queue containers, and an admin user.

## Environment Variables

Backend:
- `PORT`: backend port, defaults to `5000`.
- `MONGODB_URI`: MongoDB connection string. Required.
- `JWT_SECRET`: JWT signing secret. Required.
- `JWT_EXPIRES_IN`: JWT lifetime, defaults to `30d`.
- `NODE_ENV`: enables development logging when set to `development`.
- `CORS_ORIGIN`: allowed frontend origin, defaults to `*`.
- `FRONTEND_URL`: used in QR code links, defaults to `http://localhost:5173`.
- `EMAIL_USER`: Gmail account used by Nodemailer.
- `EMAIL_APP_PASSWORD`: Gmail app password used by Nodemailer.
- `APP_PASSWORD` / `app_Password`: legacy aliases also accepted by the email service.
- `RAZORPAY_KEY_ID`: Razorpay API Key ID for processing payments.
- `RAZORPAY_KEY_SECRET`: Razorpay API Secret for verifying payment signatures.

Frontend:
- `VITE_API_URL`: backend API base URL, defaults to `http://localhost:5000/api`.
- `VITE_SOCKET_URL`: Socket.io server URL, defaults to `http://localhost:5000`.
- `VITE_RAZORPAY_KEY_ID`: Razorpay API Key ID exposed to the frontend checkout script.

## Backend Architecture

The backend follows a conventional Express MVC structure:
- Routes define HTTP surfaces under `/api`.
- Controllers implement request handling and call models/services.
- Mongoose models represent persisted data.
- Services hold reusable domain logic such as queue recalculation, token generation, QR generation, and email sending.
- Middleware handles auth, admin authorization, not-found responses, and central error formatting.
- Socket helpers centralize queue, token, and notification events.

### API Mounts

Configured in `backend/src/app.js`:
- `GET /`: API welcome response.
- `/api-docs`: Swagger UI.
- `/api/auth`: authentication and OTP flows.
- `/api/users`: user profile read/update.
- `/api/tokens`: token booking, lookup, cancellation, QR, and public tracking.
- `/api/queues` and `/api/queue`: public queue status endpoints.
- `/api/admin`: admin queue controls and analytics.
- `/api/reports`: admin report summaries/downloads.
- `/api/services`: service list.

### Route Summary

Auth:
- `POST /api/auth/register`: starts registration by creating and emailing an OTP.
- `POST /api/auth/verify-register`: verifies OTP, creates the user, and returns a JWT.
- `POST /api/auth/login`: authenticates and returns a JWT.
- `POST /api/auth/forgot-password`: emails a reset OTP.
- `POST /api/auth/reset-password`: verifies reset OTP and changes password.
- `GET /api/auth/me`: returns the current authenticated user.

Users:
- `GET /api/users/profile`: current user profile.
- `PUT /api/users/profile`: update current user name, phone, avatar, and optionally password.

Tokens:
- `POST /api/tokens/book`: authenticated token booking.
- `GET /api/tokens/my-tokens`: current user's tokens.
- `GET /api/tokens/:id`: authenticated token detail.
- `PUT /api/tokens/:id/cancel`: cancel a token and recalculate queue.
- `GET /api/tokens/:id/qr`: fetch QR code data URI.
- `GET /api/tokens/track/:displayId`: public tracking endpoint used by QR links.

Queues:
- `GET /api/queues/status`: status map for all service queues.
- `GET /api/queues/live`: simple live queue response.
- `GET /api/queues/public-stats`: public landing-page metrics.
- `GET /api/queues/:service/status`: detailed status and active tokens for one service.

Admin:
- `POST /api/admin/queues/:service/next`: call next token for a service.
- `POST /api/admin/queues/:service/skip/:tokenId`: skip a token by route parameter.
- `POST /api/admin/queues/:service/close`: close a service queue.
- `POST /api/admin/queues/:service/open`: open a service queue.
- `POST /api/admin/call-next`: action-style call next endpoint.
- `POST /api/admin/skip-token`: action-style skip endpoint.
- `POST /api/admin/complete-token`: mark serving token complete.
- `POST /api/admin/close-queue`: action-style close endpoint.
- `POST /api/admin/open-queue`: action-style open endpoint.
- `GET /api/admin/analytics`: admin dashboard analytics.
- `POST /api/admin/verify-token`: verify scanned token details.
- `POST /api/admin/serve-token`: serve verified scanned token directly.

Reports:
- `GET /api/reports/download`: CSV or JSON token export, filtered by format/service/date range.
- `GET /api/reports/daily`: daily token counts.
- `GET /api/reports/weekly`: weekly chart data.
- `GET /api/reports/monthly`: monthly chart data.

Services:
- `GET /api/services`: list services, with fallback seeding if none exist.

## Data Model Summary

`User`:
- Stores name, email, phone, password hash, role (`user` or `admin`), avatar, and timestamps.
- Hashes passwords before save.
- Provides `matchPassword`.

`Service`:
- Stores service slug `id`, display name, icon, color, description, token prefix, and average service time.

`Queue`:
- One queue document per service.
- Tracks `currentServing`, `upcoming` display IDs, `totalInQueue`, `avgWait`, and `isActive`.

`Token`:
- Stores unique `displayId`, user reference, service slug, status, priority, time slot, daily sequence number, wait time, user name/phone snapshot, QR code data URI, and timestamps.
- Status values: `waiting`, `serving`, `completed`, `cancelled`.
- Priority values: `normal`, `senior`, `vip`, `emergency`.

`OTP`:
- Stores email, OTP, type (`register` or `reset_password`), optional temporary registration data, and a 10-minute TTL.

`Report`:
- Defines daily report-like aggregate fields, though most report endpoints currently calculate directly from `Token` or return static sample data.

## Queue Logic

The main queue state is maintained by `backend/src/services/queueManager.js`.

Queue ordering rules:
- Active tokens are `serving` or `waiting`.
- Waiting tokens sort by priority rank first, then FIFO by creation time.
- Priority ranking: emergency, senior, VIP, normal.
- Serving tokens get wait time `0`.
- Waiting token wait time is `(position - 1) * service.avgServiceTime`.
- The matching `Queue` document is updated with `currentServing`, `upcoming`, `totalInQueue`, `avgWait`.
- Socket events notify queue screens and individual users.

Token generation:
- `backend/src/services/tokenGenerator.js` generates display IDs from the service prefix plus a 3-digit daily sequence, such as `H001`.
- The sequence resets per service per day by looking at today's highest `sequenceNumber`.

QR generation:
- `backend/src/services/qrGenerator.js` creates a QR data URI that points to `${FRONTEND_URL}/track/${displayId}`.

## Real-Time Events

Socket server:
- Initialized in `backend/src/config/socket.js`.
- Supports service rooms named `${service}_queue`.
- Supports user rooms named `user_${userId}`.

Backend emit helpers:
- `emitQueueUpdate(service, data)`: emits `queue-updated` to the service room and globally.
- `emitTokenUpdate(userId, tokenDisplayId, data)`: emits `token_update` to a user room.
- `emitUserNotification(userId, notification)`: emits `notification` to a user room.
- `emitTokenCreated(token)`: emits `token-created` globally.
- `emitTokenCalled(token)`: emits `token-called` globally.
- `emitQueueCompleted(service)`: emits `queue-completed` globally.

Frontend socket service:
- `frontend/src/services/socket.js` connects to `VITE_SOCKET_URL`.
- Auth token is passed in Socket.io `auth`.
- Exposes helpers for joining service/user rooms and reading the current socket.

## Frontend Architecture

Routes are defined in `frontend/src/routes/AppRoutes.jsx`.

Public routes:
- `/`: home page. (Automatically redirects logged-in users to their active dashboards: `/admin` for admins, `/book-token` for users).
- `/login`: login page. (Auto-redirects logged-in users to dashboards).
- `/register`: OTP-backed registration flow. (Auto-redirects logged-in users to dashboards).
- `/forgot-password`: request password reset OTP.
- `/reset-password`: reset password with OTP.
- `/track/:tokenId`: public token tracking page for QR links.

Dashboard routes:
- `/book-token`: authenticated-ish token booking screen.
- `/queue-status`: live queue status view.
- `/my-tokens`: user's tokens, filtering, QR modal, and cancellation.
- `/profile`: user profile with built-in Change Password flow verified via email OTP.

Admin-only routes:
- `/admin`: admin dashboard and queue controls.
- `/reports`: reports and analytics.

Contexts:
- `AuthContext` owns JWT persistence in `localStorage` under `sqms-token:v1`, login/logout, OTP registration, current-user loading, profile updates, and socket connection.
- `ThemeContext` owns light/dark mode state.

## Registration Flow Notes

- Registration is OTP-based: the frontend sends name, email, phone, and password to start the flow, then completes signup after OTP verification.
- The register form no longer asks for confirm-password; the backend stores the original password from the OTP record and finalizes the account only after the code is verified.
- Gmail delivery supports `EMAIL_APP_PASSWORD` and also accepts `APP_PASSWORD` or `app_Password` as aliases for local setups.
- The OTP step includes a resend action that reuses the registration payload to request a fresh code without restarting the flow.

Shared frontend services:
- `services/api.js` centralizes Axios base URL and attaches JWT bearer tokens.
- `services/socket.js` centralizes Socket.io client state.
- `hooks/useServices.js` fetches service metadata from `/api/services`.

## Authentication Flow

Registration:
1. User submits name, email, phone, and password.
2. Frontend calls `POST /api/auth/register`.
3. Backend stores temporary registration data in `OTP` and sends a 6-digit OTP.
4. User submits OTP.
5. Frontend calls `POST /api/auth/verify-register`.
6. Backend creates user, deletes OTP, returns JWT and user profile.

Login:
1. Frontend calls `POST /api/auth/login`.
2. Backend checks password and returns JWT and user profile.
3. Frontend stores JWT in `localStorage`, initializes socket, and joins the user room.

Session restore:
1. `AuthProvider` checks for `sqms-token:v1`.
2. It calls `GET /api/auth/me`.
3. On success, it hydrates the user and joins the user's socket room.
4. On `401`, Axios removes the token and dispatches `auth-logout`.

## Development Commands

Backend:
```bash
cd backend
npm install
npm run dev
npm start
```

Frontend:
- `frontend/src/services/api.js`: Axios setup.
- `frontend/src/services/socket.js`: Socket.io client setup.
- `frontend/src/hooks/useServices.js`: service fetching hook.
- `frontend/src/pages/BookToken/BookToken.jsx`: booking flow with dynamic 3-day select and past-hour slot locking.
- `frontend/src/pages/QueueStatus/QueueStatus.jsx`: live queue display.
- `frontend/src/pages/MyTokens/MyTokens.jsx`: user token management.
- `frontend/src/pages/Profile/Profile.jsx`: user profile and settings, featuring an integrated Change Password flow via email OTP verification.
- `frontend/src/pages/AdminDashboard/AdminDashboard.jsx`: admin dashboard and queue controls.
- `frontend/src/pages/QRScanner/QRScanner.jsx`: Live webcam QR code verification scanner and physical card dashboard, featuring secure-context browser camera access warning and bypass instructions.
- `frontend/src/pages/Reports/Reports.jsx`: report UI.
- `frontend/src/pages/TrackToken/TrackToken.jsx`: public token tracking with sorting to ensure latest lookup.

## Known Documentation Drift

- Root `README.md` and `PROJECT_CONTEXT.md` are fully updated to reflect the implemented backend, OTP-based registrations, security validations, and date-based scheduling constraints.
- Backend and frontend READMEs remain as historical guidelines.
