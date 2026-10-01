# 🛠️ Accounts Master - Developer Documentation

Welcome to the developer documentation for **Accounts Master**. This guide is intended for developers who want to set up, run, and contribute to the project.

## 💻 Tech Stack
- **Frontend:** React 18, Vite, Vanilla CSS
- **Backend:** Node.js, Express.js
- **Database:** MongoDB, Mongoose

---

## 🚀 Getting Started

### 1. Prerequisites
Ensure you have the following installed on your local development environment:
- **Node.js** (v18.0.0 or higher recommended)
- **MongoDB** (running locally on `mongodb://localhost:27017` or use a MongoDB Atlas URI)
- **npm** (v9+)

### 2. Environment Variables
Create a `.env` file in the root directory and add the following required environment variables:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/accounts_master
JWT_SECRET=your_super_secret_jwt_key
```

### 3. Installation
Install dependencies for both the backend (root) and the frontend (client):
```bash
# Install root (backend) dependencies
npm install

# Install client (frontend) dependencies
cd client
npm install
cd ..
```
*Tip: You can also use `npm run install:all` if configured in the root `package.json`.*

### 4. Database Seeding (Demo Data)
To populate the database with initial settings, users, and sample transaction data, run the seed script:
```bash
npm run seed
```

### 5. Running the Application
Start both the Express API server (on port `5000`) and the Vite React development server (on port `5173`) concurrently:
```bash
npm run dev
```

The frontend will be accessible at `http://localhost:5173`.

---

## 📂 Project Architecture

```text
├── .env                       # Environment variables
├── package.json               # Backend dependencies & scripts
├── server/                    # Node.js + Express Backend
│   ├── index.js               # Express application entry point
│   ├── seed.js                # Database seeder
│   ├── middleware/            # Auth and audit middlewares
│   ├── models/                # Mongoose schemas (User, DailyAccount, etc.)
│   ├── routes/                # Express route controllers
│   └── utils/                 # Server-side utilities (accounting formulas)
└── client/                    # React 18 + Vite Frontend
    ├── public/                # PWA manifest, service worker, icons
    ├── vite.config.js         # Vite configuration & API proxy
    └── src/
        ├── api/               # Axios API client setup
        ├── components/        # Reusable UI components
        ├── contexts/          # React context providers (Auth, Settings)
        ├── pages/             # Route-level page components
        └── utils/             # Client-side helpers
```

---

## 🔌 API Reference

### Authentication
- `POST /api/auth/login` — Authenticate and receive JWT.
- `GET /api/auth/me` — Retrieve the current user's profile.

### Core Endpoints
- `GET /api/daily-accounts` — Fetch daily account records.
- `POST /api/daily-accounts` — Create/Update daily accounts.
- `GET /api/reconciliation` — Fetch cash counter breakdowns.
- `POST /api/reconciliation` — Submit denomination counts for reconciliation.

*(Refer to the `server/routes` directory for the full list of endpoints including credit, expenses, gpay, petty cash, and reports.)*

---

## 🧑‍💻 Development Notes & Guidelines
- **Proxy Configuration:** The frontend Vite config proxies `/api` requests to `http://localhost:5000`. Ensure the backend is running to avoid CORS or 404 errors.
- **Formulas:** All core reconciliation math is located in `server/utils/accountingEngine.js`. Do not duplicate business logic on the frontend without keeping it synced.
- **PWA:** The app is configured as a Progressive Web App. When modifying service workers (`sw.js`), remember to test offline behavior.
