# RentConnect

*A modern, frontend‑focused tenant–landlord communication platform.*

RentConnect streamlines maintenance requests, real‑time chat, and rent payment tracking so tenants and landlords can resolve issues quickly and transparently.

### ⚙️ Tech Stack

- **Frontend:** React "(Vite)" + React Router, Tailwind CSS (via `@tailwindcss/vite`), Axios, Socket.IO client
- **Backend:** Node.js + Express 5, MongoDB (Mongoose), JWT auth, Multer (uploads), Socket.IO  
- **Dev ports:** Frontend `:4000` (Vite), Backend `:5000` (Express). Vite proxies `/api`, `/uploads`, and WebSocket `/socket.io` to the backend.

---

## ✨ Key Features

- **Intuitive Maintenance Requests**
  - Step‑by‑step form with category (plumbing, electrical, general, …), urgency (low/medium/high), description, and drag‑and‑drop image/video upload.
  - Auto‑suggestions for common issues and **real‑time field validation**.
- **Issue Tracking Dashboards**
  - **Tenant:** status badges (pending → in‑progress → completed) and progress indicators for each request.
  - **Landlord:** filterable table by property, type, urgency, and status; bulk status updates.
  - **Request Timeline:** chronological history of actions (submitted, reviewed, assigned, completed).
- **Instant Messaging**
  - Real‑time tenant–landlord threads with message **sent/delivered/read** indicators and timestamps.
  - In‑app toasts and pop‑up notifications for new messages and status changes.
- **Maintenance History & Reports**
  - Per‑property history to surface recurring problems.
  - **Export CSV/PDF** (UI hooks provided; connect to reporting endpoint of your choice).
- **Rent Payment Tracker**
  - Tenant view of **payment history**, due dates, and amounts with a calendar view.
  - One‑tap **“Paid”** or **“Request Delay”** actions that notify landlords instantly.
  - Landlord dashboard to spot overdue payments and dispatch reminders.
- **Scheduling**
  - Tenants propose appointment slots for repairs; landlords approve or reschedule.
  - Real‑time updates on technician ETA and resolution.
- **Profiles & Multi‑Language**
  - Tenant avatars, contact info, and preferred communication channels (email/SMS).
  - Landlord console for multiple properties and per‑property settings (rent, contact prefs).
  - Language toggle scaffold for multi‑language UI.
- **Responsive UI**
  - **Mobile‑first** design with touch‑friendly interactions and adaptive layouts on tablets/desktops.

---

## 🚀 Quick Start

### 1) Prerequisites
- Node.js 18+ and npm
- MongoDB instance (local or cloud, e.g. MongoDB Atlas)

### 2) Clone & install
```bash
git clone https://github.com/mrpawarGit/RentConnect.git
cd RentConnect

# Backend
cd backend
npm install

# In a separate terminal: Frontend
cd ../frontend-rentConnect
npm install
```

### 3) Configure environment

Create **`backend/.env`**:
```ini
PORT=5000
MONGO_URI=mongodb://localhost:27017/rentconnect
JWT_SECRET=super-secret-key
# If serving frontend from backend in prod, add:
CLIENT_URL=http://localhost:4000
# CLIENT_ORIGIN=https://your-frontend-domain
```

*(Optional)* Configure **uploads** location in `backend/server.js` if you want a custom path.

Create **`frontend-rentConnect/.env`** (optional – defaults work thanks to Vite proxy):
```bash
# Vite will proxy /api and /socket.io to:5000 (see vite.config.js)
# You can override base URLs in src/lib/api.js and src/lib/socket.js if deploying under a subpath.
```

### 4) Run locally
```bash
# Terminal A – backend (port 5000)
cd backend
npm run dev

# Terminal B – frontend (port 4000)
cd frontend-rentConnect
npm run dev
```

Open **http://localhost:4000**. API is available at **http://localhost:5000/api** (proxied from Vite).

---

## 📦 Dependencies

### Frontend (`frontend-rentConnect/`)

- @tailwindcss/vite
- axios
- react
- react-dom
- react-router-dom
- socket.io-client
- tailwindcss

### Backend (`backend/`)

- bcryptjs
- cors
- dotenv
- express
- jsonwebtoken
- mongoose
- multer
- nodemon
- socket.io

---

## 🧭 Project Structure

```
RentConnect/
├─ backend/
|  ├─ .env                    
│  ├─ server.js                 # Express + MongoDB + Socket.IO
│  ├─ config/
│  │  └─ db.js
│  ├─ controllers/              # auth, chat, maintenance, payments, property
│  ├─ middleware/
│  │  └─ authMiddleware.js
│  ├─ models/                   # User, Property, Thread, Message, MaintenanceRequest, Payment, RentInvoice
│  └─ routes/
│     ├─ auth.js
│     ├─ maintenance.js
│     ├─ chat.js
│     ├─ payments.js
│     ├─ property.js
│     ├─ tenant.js
│     └─ landlord.js
└─ frontend-rentConnect/        # React + Vite + Tailwind
   ├─ vite.config.js            # Proxy: /api, /uploads, /socket.io → :5000
   ├─ src/
   │  ├─ lib/                   # api.js, auth.js, socket.js
   │  ├─ components/            # Navbar, Footer, Timeline, ThemeToggle, etc.
   │  └─ pages/                 # Landing, Dashboards, Chat, SubmitRequest, Payments, Scheduling
   └─ public/
```

---

## 🔐 Authentication & Roles

- **JWT**-based auth (`Authorization: Bearer <token>`).  
- `authMiddleware.authenticate` protects routes; role utilities gate tenant/landlord actions.  
- Default roles: **tenant** and **landlord**.

---

## 📡 REST API (high‑level)

> Base URL: `/api` (proxied in development)

- **Auth** – `POST /auth/register`, `POST /auth/login`
- **Maintenance** – `GET /maintenance`, `POST /maintenance`, `PATCH /maintenance/:id`, `GET /maintenance/:id`
- **Chat** – `GET /chat/threads`, `POST /chat/threads`, `GET /chat/:threadId/messages`, `POST /chat/:threadId/messages`
- **Payments** – `GET /payments`, `POST /payments/mark-paid`, `POST /payments/request-delay`
- **Property** – `GET /property`, `POST /property`, `PATCH /property/:id`

*(See route files under `backend/routes/` and controllers under `backend/controllers/` for exact parameters and responses.)*

---

## 🔌 Real‑Time Events (Socket.IO)

- **`message:new`** – emitted to recipients when a new message arrives.  
- **`thread:poke`** – lightweight notification to refresh a thread list.  
- **`message:delivered` / `message:read`** – server emits delivery/read receipts.  
- Rooms follow the pattern: `thread:<threadId>`.

Client socket setup lives in `frontend-rentConnect/src/lib/socket.js`.

---

## 🧪 Scripts

**Frontend**
```bash
npm run dev       # start Vite on:4000
npm run build     # build production assets
npm run preview   # preview production build locally
npm run lint      # eslint
```

**Backend**
```bash
npm run dev       # nodemon on:5000
npm start         # node server.js
```

---

## ⚙️ Configuration Notes

- **CORS**: configure allowed origins in `server.js` using `CLIENT_ORIGIN` or CORS options if serving from a different domain.
- **Uploads**: user‑submitted images/videos are served from `/uploads/*`. Vite proxy forwards to backend in development.
- **Production**: serve the built frontend behind a reverse proxy (Nginx/Caddy). Point the frontend to the backend’s public URL in `api.js` and `socket.js` or via env‑driven config.

---

## 🛡️ Security Checklist

- Use a strong `JWT_SECRET` and rotate it for production.
- Set proper CORS `origin` and `credentials`.
- Limit upload size and validate file types with Multer.
- Sanitize and validate all request inputs.
- Use HTTPS and secure cookies if you move tokens to cookies.

---

## 🗺️ Future Roadmap

- Multi‑language i18n layer (copy + translations files)
- Advanced reporting with export to **CSV/PDF**
- Role‑based admin for property managers
- Push notifications (Web Push / FCM)
- Calendar sync for maintenance scheduling (ICS)

---

## 🙌 Credits

Built with ❤️ using React, Vite, Tailwind, Express, MongoDB, and Socket.IO.
