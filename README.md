# Budget App

A full-stack personal budgeting application that helps you track expenses, manage category-based budgets, and visualize your spending habits through an interactive dashboard.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Core Features](#core-features)
- [Project Structure](#project-structure)
- [API Reference](#api-reference)
- [Running Locally](#running-locally)
- [Environment Variables](#environment-variables)
- [Running Tests](#running-tests)
- [CI/CD](#cicd)

---

## Overview

Budget App is a self-hosted, multi-user budgeting tool built with a **FastAPI** backend and a **React + TypeScript** frontend. Each user has their own isolated data — categories, transactions, and budgets are all scoped per account. The dashboard provides real-time financial summaries, budget status indicators, and alert notifications when spending approaches or exceeds set limits.

---

## Tech Stack

### Backend

| Technology | Purpose |
|---|---|
| **Python 3.11** | Runtime |
| **FastAPI** | REST API framework with automatic OpenAPI docs |
| **SQLAlchemy 2.x** | ORM with typed `Mapped` columns |
| **Alembic** | Database migrations |
| **PostgreSQL 16** | Primary database |
| **Redis 7** | Response caching for monthly summaries (optional — silently no-ops if unavailable) |
| **Pydantic v2** | Request/response validation and settings management |
| **python-jose** | JWT token generation and verification |
| **passlib + bcrypt** | Password hashing |
| **pytest** | Test runner (uses SQLite in-memory for CI — no Docker needed) |

### Frontend

| Technology | Purpose |
|---|---|
| **React 19** | UI library |
| **TypeScript 5** | Type safety |
| **Vite 7** | Dev server and build tool |
| **TanStack React Query v5** | Server state management, caching, and data fetching |
| **React Router v7** | Client-side routing |
| **Axios** | HTTP client with JWT interceptor |
| **Recharts** | Pie and bar chart visualizations |
| **Tailwind CSS v4** | Utility-first styling |
| **Lucide React** | Icon set |

### Infrastructure

| Technology | Purpose |
|---|---|
| **Docker + Docker Compose** | Runs PostgreSQL and Redis locally |
| **GitHub Actions** | CI — runs pytest on every push/PR to `main` |
| **Render** | Production deployment target |

---

## Core Features

### Authentication
- User registration and login with email/password
- Passwords are hashed with bcrypt — never stored in plain text
- JWT-based authentication (Bearer tokens) with configurable expiry
- Auth state persisted in `localStorage`; all API calls auto-attach the token via an Axios interceptor
- Automatic redirect to `/login` on any `401` response

### Categories
- Create custom income and expense categories (e.g., "Salary", "Rent", "Groceries")
- Categories are typed as either `income` or `expense`, which determines how they appear in summaries
- All categories are user-scoped — no shared or global categories
- Full CRUD: create, read, update, delete

### Transactions
- Log individual income or expense transactions with an amount, date, description, and category
- Filter transactions by category or month
- Transactions are returned sorted newest-first
- Any mutation (create, update, delete) automatically invalidates the cached monthly summary for that user
- Full CRUD: create, read, update, delete

### Budgets
- Set a monthly spending limit per expense category (e.g., $500 for "Groceries" in 2026-02)
- Budgets are month-specific — you set a new limit per month, per category
- The dashboard compares actual spending against limits in real time
- Full CRUD: create, read, update, delete

### Dashboard & Analytics
The dashboard is the heart of the app. For any selected month it shows:

- **KPI Cards** — Total Income, Total Spent, Net Balance, and overall Budget Used %
- **Spending Pie Chart** — Donut chart breaking down spending by category
- **Budget vs Spending Bar Chart** — Side-by-side comparison of budget limits and actual spending per category
- **Category Breakdown** — Progress bars per category with color-coded status badges:
  - `under_budget` — spending is below 80% of the limit
  - `near_limit` — spending is between 80–100% of the limit
  - `over_budget` — spending has exceeded the limit
  - `no_budget_set` — no limit has been configured for that category
- **Budget Alerts Panel** — Surfaced automatically when any category is near or over its limit, or when total spending exceeds total income. Alerts have `warning` and `critical` severity levels.

### Caching
- Monthly summaries are cached in Redis under the key `summary:{user_id}:{month}` with a 300-second TTL
- Cache is invalidated automatically on any transaction or budget mutation
- Redis is fully optional — the app works without it, just without the caching layer

---

## Project Structure

```
budget-app/
├── backend/
│   ├── app/
│   │   ├── main.py           # FastAPI app, CORS, router registration
│   │   ├── config.py         # Pydantic settings (reads from .env)
│   │   ├── database.py       # SQLAlchemy engine and session
│   │   ├── models.py         # ORM models: User, Category, Transaction, Budget
│   │   ├── schemas.py        # Pydantic request/response schemas
│   │   ├── auth.py           # Password hashing and JWT utilities
│   │   ├── cache.py          # Redis helpers with silent fallback
│   │   ├── dependencies.py   # get_current_user() FastAPI dependency
│   │   └── routers/
│   │       ├── auth.py           # POST /auth/register, POST /auth/login
│   │       ├── categories.py     # CRUD /categories/
│   │       ├── transactions.py   # CRUD /transactions/
│   │       ├── budgets.py        # CRUD /budgets/
│   │       └── summary.py        # GET /summary/monthly/{month}, GET /summary/alerts/{month}
│   ├── alembic/              # Database migration files
│   ├── tests/                # pytest test suite
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── api/              # One file per resource (auth, categories, transactions, budgets, summary)
│       ├── components/
│       │   ├── layout/       # AppLayout, Sidebar, ProtectedRoute
│       │   └── ui/           # Button, Card, Input, Modal, Select, StatusBadge, EmptyState
│       ├── context/
│       │   └── AuthContext.tsx   # Global auth state (isAuthenticated, login, logout)
│       ├── pages/            # Dashboard, Transactions, Categories, Budgets, Login, Register
│       ├── types/index.ts    # Shared TypeScript interfaces
│       └── utils/format.ts   # Currency and date formatting helpers
├── docker-compose.yml        # PostgreSQL + Redis
├── .env                      # Environment variables (project root — see below)
└── .github/workflows/ci.yml  # GitHub Actions CI
```

---

## API Reference

The FastAPI backend auto-generates interactive API documentation. Once the backend is running, visit:

- **Swagger UI:** `http://localhost:8000/docs`
- **ReDoc:** `http://localhost:8000/redoc`

### Endpoints at a glance

| Method | Path | Description |
|---|---|---|
| `POST` | `/auth/register` | Create a new account |
| `POST` | `/auth/login` | Log in and receive a JWT |
| `GET/POST` | `/categories/` | List or create categories |
| `GET/PUT/DELETE` | `/categories/{id}` | Read, update, or delete a category |
| `GET/POST` | `/transactions/` | List (with optional filters) or create transactions |
| `GET/PUT/DELETE` | `/transactions/{id}` | Read, update, or delete a transaction |
| `GET/POST` | `/budgets/` | List or create budget limits |
| `GET/PUT/DELETE` | `/budgets/{id}` | Read, update, or delete a budget |
| `GET` | `/summary/monthly/{month}` | Full financial summary for a month (YYYY-MM) |
| `GET` | `/summary/alerts/{month}` | Budget alerts for a month |

All endpoints except `/auth/register` and `/auth/login` require a `Authorization: Bearer <token>` header.

---

## Running Locally

### Prerequisites

- Python 3.11+
- Node.js 20+
- Docker and Docker Compose

### 1. Clone the repository

```bash
git clone <repo-url>
cd budget-app
```

### 2. Create the environment file

Create a `.env` file at the **project root** (not inside `backend/`):

```env
DATABASE_URL=postgresql://budget_user:budget_pass@localhost:5432/budget_db
REDIS_URL=redis://localhost:6379
SECRET_KEY=your-secret-key-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
VITE_API_URL=/api
```

> Generate a strong `SECRET_KEY` with: `python -c "import secrets; print(secrets.token_hex(32))"`

### 3. Start the database and cache

```bash
docker-compose up -d
```

This starts PostgreSQL on port `5432` and Redis on port `6379`.

### 4. Set up the backend

```bash
cd backend

# Create and activate a virtual environment
python -m venv venv

# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Apply database migrations
alembic upgrade head

# Start the dev server
uvicorn app.main:app --reload
```

The API is now available at `http://localhost:8000`.

### 5. Set up the frontend

Open a new terminal:

```bash
cd frontend
npm install
npm run dev
```

The app is now available at `http://localhost:5173`.

In development, Vite proxies all `/api/*` requests to the backend at `http://localhost:8000` and strips the `/api` prefix — so the frontend and backend work together seamlessly without any CORS issues during development.

---

## Environment Variables

All variables live in a single `.env` file at the **project root**.

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `REDIS_URL` | Yes | Redis connection string |
| `SECRET_KEY` | Yes | Secret used to sign JWTs — keep this private |
| `ALGORITHM` | No | JWT signing algorithm (default: `HS256`) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | No | JWT TTL in minutes (default: `30`) |
| `VITE_API_URL` | Yes | Base URL for frontend API calls (`/api` in dev, full URL in production) |

---

## Running Tests

Tests use SQLite and do not require Docker or a running database.

```bash
cd backend

# Run the full test suite
python -m pytest tests/ -v

# Run a specific test file
python -m pytest tests/test_transactions.py -v

# Run a single test by name
python -m pytest tests/test_transactions.py::test_create_transaction -v
```

The test suite covers authentication, categories, transactions, budgets, and monthly summaries. Each test gets a fresh SQLite database — no test pollution.

---

## CI/CD

GitHub Actions runs the full pytest suite on every push and pull request to `main`. The workflow:

1. Sets up Python 3.11
2. Installs backend dependencies
3. Sets test environment variables (SQLite, dummy secret key)
4. Runs `pytest tests/ -v`

No Docker or external services are required in CI — SQLite handles the database layer entirely.

The app is deployed to **Render** for production hosting.
