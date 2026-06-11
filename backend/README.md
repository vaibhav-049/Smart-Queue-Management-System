# Smart Queue Management System - Backend

Production-ready, scalable RESTful backend for the Smart Queue Management System. Implements MVC architecture, priority-based token queuing, estimated wait-time calculation, JWT-based Role-Based Access Control (RBAC), automatic service/user seeding, QR Code generation, and real-time synchronization using Socket.io.

## 🚀 Tech Stack

- **Runtime**: Node.js (v16+)
- **Framework**: Express.js
- **Database**: MongoDB + Mongoose (ODM)
- **Security**: JWT (jsonwebtoken), bcryptjs, helmet, CORS
- **Real-Time**: Socket.io
- **Utilities**: qrcode (QR Code generator DataURI), morgan (HTTP logger), dotenv

---

## 📂 Folder Structure

```text
backend/
├── src/
│   ├── config/
│   │   ├── db.js             # Mongoose connection & auto-seeding logic
│   │   └── socket.js         # Socket.io initialisation and helper emitters
│   │
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── tokenController.js
│   │   ├── queueController.js
│   │   ├── adminController.js
│   │   └── reportController.js
│   │
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   ├── adminMiddleware.js
│   │   └── errorMiddleware.js
│   │
│   ├── models/
│   │   ├── User.js
│   │   ├── Service.js
│   │   ├── Token.js
│   │   ├── Queue.js
│   │   └── Report.js
│   │
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   ├── tokenRoutes.js
│   │   ├── queueRoutes.js
│   │   ├── adminRoutes.js
│   │   └── reportRoutes.js
│   │
│   ├── services/
│   │   ├── tokenGenerator.js        # Sequenced, daily-resetting displayId generator (e.g. A001)
│   │   ├── queueManager.js          # Queue ordering, weight changes & socket alerts
│   │   ├── waitingTimeCalculator.js # Position and wait duration forecaster
│   │   └── qrGenerator.js           # QR Code generator
│   │
│   ├── app.js                # Express app mounts, middleware chaining
│   └── server.js             # HTTP/Socket server bootstrapping
│
├── .env
├── package.json
└── README.md
```

---

## ⚙️ Environment Variables (`.env`)

Create a `.env` file in the `backend/` directory:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/smart_queue
JWT_SECRET=super_secret_key_smart_queue_system_2026_safe
JWT_EXPIRES_IN=30d
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

---

## ⚡ Setup & Run Instructions

1. **Navigate to backend folder**:
   ```bash
   cd backend
   ```
2. **Install Dependencies**:
   ```bash
   npm install
   ```
3. **Run in Development (Automatic restart)**:
   ```bash
   npm run dev
   ```
4. **Run in Production**:
   ```bash
   npm start
   ```

---

## 📂 Database Automatic Seeding

Upon connection to MongoDB, if collections are blank, the backend automatically seeds:
1. **Services & Queue Containers**:
   - `hospital` (Prefix: A, Avg Time: 10 mins)
   - `bank` (Prefix: B, Avg Time: 12 mins)
   - `college` (Prefix: C, Avg Time: 15 mins)
   - `government` (Prefix: G, Avg Time: 20 mins)
   - `salon` (Prefix: S, Avg Time: 25 mins)
2. **Mock Users**:
   - **Admin Account**: `vikram@example.com` / `admin123`
   - **User Account 1**: `priya@example.com` / `user123`
   - **User Account 2**: `rahul@example.com` / `user123`

---

## 🔌 API Documentation

All routes prefix: `/api`

### 🔒 Authentication (`/api/auth`)
* `POST /register`: Register user. Body: `{ name, email, phone, password }`.
* `POST /login`: Login user. Body: `{ email, password }`.
* `GET /me` (Private): Retrieves current logged in user details.

### 👤 Users (`/api/users`)
* `GET /profile` (Private): Fetch user profile.
* `PUT /profile` (Private): Update user profile (`name`, `phone`, `password`, `avatar`).

### 🎫 Tokens (`/api/tokens`)
* `POST /book` (Private): Book token. Body: `{ service, timeSlot, priority }` (priorities: `normal`, `senior`, `vip`, `emergency`).
* `GET /my-tokens` (Private): List current user's tokens.
* `GET /:id` (Private): Get specific token details.
* `PUT /:id/cancel` (Private): Cancel user token (forces queue re-ordering).
* `GET /:id/qr` (Private): Retrieves generated QR Code DataURI.

### 📋 Live Queues (`/api/queues`)
* `GET /status` (Public): Get active metadata for all 5 queues (current, upcoming list, length).
* `GET /:service/status` (Public): Detailed tokens list for a service queue.

### 🛠️ Admin Control (`/api/admin`)
* `POST /queues/:service/next` (Admin): Pop current serving token, push next waiting in line to counter.
* `POST /queues/:service/skip/:tokenId` (Admin): Skip queue token.
* `POST /queues/:service/close` (Admin): Close new token bookings for service.
* `POST /queues/:service/open` (Admin): Open service queue.
* `GET /analytics` (Admin): Returns full charts and graphs analytics logs (hourly, daily, service usage).

### 📊 Report Exports (`/api/reports`)
* `GET /download` (Admin): Query parameter `format=csv` (downloadable file) or `format=json`.

---

## 📡 Live Socket.io Event Documentation

### Client Emits:
* `join_service_room` (Payload: `'hospital'`): Client listens to live updates on hospital queue.
* `join_user_room` (Payload: `userId`): Client listens to custom token alerts and notifications.

### Server Broadcasts:
* `queue_update` (Room: `<service>_queue`): Broadcasts when the queue shifts or service bookings change.
  ```json
  { "service": "hospital", "data": { "currentServing": "A001", "upcoming": ["A002", "A003"], "totalInQueue": 2, "avgWait": 10 } }
  ```
* `token_update` (Room: `user_<userId>`): Emits when a user's token position or wait time shifts.
* `notification` (Room: `user_<userId>`): Direct alert toast content (e.g. "Your token is approaching").
