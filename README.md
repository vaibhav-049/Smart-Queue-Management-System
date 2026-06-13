# ⚡ Smart Queue Management System

A modern, full-stack Smart Queue Management System for service-heavy organizations such as hospitals, banks, colleges, government offices, and salons.

## 📂 Project Structure

```
Smart-Queue-Management-System/
├── frontend/          # React.js Frontend (Vite + Tailwind CSS + Framer Motion)
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Dashboard & Public Pages (10 pages)
│   │   ├── layouts/       # MainLayout & DashboardLayout
│   │   ├── routes/        # Guarded App Router Config
│   │   ├── context/       # Auth and Theme (Dark/Light mode) Contexts
│   │   ├── services/      # Axios API & Socket.io client services
│   │   └── App.jsx        # Root component
│   └── package.json
│
└── backend/           # Node.js + Express + MongoDB + Socket.io
    ├── src/
    │   ├── config/        # Database & Socket.io initialization
    │   ├── controllers/   # Request handlers for auth, queues, tokens, admin controls, and reports
    │   ├── middleware/    # JWT guards, rate limiters, NoSQL injection prevention, error handers
    │   ├── models/        # Mongoose database schemas (User, Token, Service, Queue, OTP)
    │   ├── routes/        # Router files mounting resources
    │   ├── services/      # Business logic: queue ordering, sequence generators, cleanup tasks
    │   ├── utils/         # Timezone-safe date/time utilities
    │   └── server.js      # Server HTTP listener entry point
    └── test_flow.js       # Backend integration test suite
```

## 🚀 Getting Started

### Prerequisites
- Node.js (>= 16.0.0)
- MongoDB running locally or MongoDB Atlas connection string

### Backend Startup
1. Configure environment variables in `backend/.env`.
2. Run development server:
```bash
cd backend
npm install
npm run dev
```
Backend runs at `http://localhost:5000/`. API documentation is available at `http://localhost:5000/api-docs`.

### Frontend Startup
1. Run development server:
```bash
cd frontend
npm install
npm run dev
```
Frontend runs at `http://localhost:5173/`.

## 🛠️ Tech Stack

### Frontend
- **React.js 19** (Functional Components + Hooks)
- **Vite** (Build Tool)
- **Tailwind CSS v3** & Custom Glassmorphism CSS
- **Framer Motion** (Animations)
- **Recharts** (Dashboard Charts)
- **React Router v7** (Guarded Routing)
- **react-hot-toast** (Toast Alerts)
- **qrcode.react** & **Socket.io Client** (Real-time updates)

### Backend
- **Node.js** + **Express.js 4**
- **MongoDB** + **Mongoose 8** (Schema-based models)
- **Socket.io** (Lobby/lobby screens and private user status notifications)
- **Nodemailer** (Email OTP delivery for registration and password resets)
- **Helmet, CORS, Mongo Sanitize, express-rate-limit** (Hardened security and NoSQL injection prevention)

## 📄 Pages
1. **Landing Page**: Organisation profiles, public statistics.
2. **Login**: Authenticate secure sessions.
3. **Registration**: Email OTP-guarded validation.
4. **Forgot Password**: OTP-based recovery.
5. **Reset Password**: Verification and new password setup.
6. **Book Token**: Dynamic 3-day booking window with dynamic past-hour slot filtering, custom name/phone snapshots.
7. **Live Queue Status**: Real-time waiting positions and display numbers.
8. **My Tokens**: User's booked tokens, active wait times, and QR codes.
9. **Admin Dashboard**: Open/close queues, call next, skip tokens, complete tokens.
10. **Reports & Analytics**: Admin service usage, busy hours, visitor analytics, CSV/JSON report exporting.
11. **User Profile**: Manage name, avatar, mobile, and password.
12. **Public Token Tracking**: Scan QR codes to monitor positions in real-time.

## ✨ Key Features
- 🌓 **Dark/Light Mode**
- 📱 **Fully Responsive Layouts**
- 🎨 **Modern Glassmorphic Dashboard Design**
- 📊 **Peak Hours & Service Aggregations**
- 🏥 **Multi-service Isolated Resets** (Hospital, Bank, College, Govt, Salon)
- 🔒 **Secured WebSockets** (Handshake token signatures and room security)
- ⏰ **Dynamic Slot Filtering**: Blocks past hours for today's bookings.
- 🗑️ **Background Cleanup interval**: Deletes expired unserved and cancelled tokens every 10 minutes to maintain database performance.

## 👨‍💻 Author
Vaibhav Patel
