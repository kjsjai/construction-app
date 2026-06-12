# Full-Stack Construction Expense Tracker

A modern, enterprise-ready web application for managing a double-storied residential house construction project in Kerala, India.

## Features
- **Expense Tracking**: Log expenses with categories, phases, and payment sources.
- **Construction Phases**: Track active phases of construction.
- **Funds & Loan Management**: Track incoming funds and loan repayments.
- **Reports & Analytics**: Visual insights using charts.
- **Excel Import/Export**: Bulk import capability with templates.
- **Role-Based Access Control**: Admin, Manager, and Viewer roles.

## Tech Stack
- **Frontend**: React 18, Vite, Tailwind CSS v3, shadcn/ui, Recharts.
- **Backend**: Node.js, Express.js, SQLite (better-sqlite3).
- **Security**: JWT, bcrypt, Helmet.js, rate limiting.

## Setup & Installation

### 1. Clone the repository
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <your-github-repo>
git push -u origin main
```

### 2. Environment Configuration
Copy the `.env.example` file to `.env` in the root directory:
```bash
cp .env.example .env
```
Update the `JWT_SECRET` for production use.

### 3. Install Dependencies
Install dependencies for both frontend and backend from the root directory:
```bash
npm run install:all
```
Alternatively, you can install them individually:
```bash
cd server && npm install
cd ../client && npm install
```

### 4. Database Seeding
The backend relies on an SQLite database. Initialize and seed the initial data:
```bash
node server/db/seed.js
```
*Note: This creates `construction.db` and an admin user (admin / admin123).*

### 5. Start Development
Run both frontend and backend concurrently from the root directory:
```bash
npm start
```
Or start them individually:
- **Backend**: `cd server && npm run dev` (Runs on http://localhost:3001)
- **Frontend**: `cd client && npm run dev` (Runs on http://localhost:5173)

## Docker Deployment
To deploy using Docker and Docker Compose:
```bash
docker-compose up -d --build
```
The application will be available at http://localhost:3000.

## Screenshots
![Dashboard Placeholder](https://via.placeholder.com/800x450?text=Dashboard+View)
![Expenses Placeholder](https://via.placeholder.com/800x450?text=Expenses+Data+Table)
