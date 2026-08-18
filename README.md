# Payment Management & Lending Tracker Web Application

Production-ready, Admin-only **Payment Management and Lending Tracker Web Application** designed for a single administrator to manage multiple borrowers (people), loan accounts, flexible payments, automated EMI schedules, PDF receipts, WhatsApp/SMS notifications, and financial reports.

---

## Key Features

- **Single Admin Portal**: Secure JWT authentication with session persistence, bcrypt password hashing, profile management, and audit logging. Borrowers do NOT have login accounts.
- **Financial Dashboard**: Real-time KPIs (Total Given, Expected Return, Total Received, Outstanding, Overdue, Active People, Today's Due, Completed Accounts), collection trend charts (Recharts), EMI payment status distribution pie chart, top outstanding borrowers, and live activity stream.
- **People Management**: Complete borrower directory with search, status filtering, pagination, archiving, and multi-tab borrower profile (Overview, Accounts, Payments, EMI Schedule, Notifications, Notes).
- **Multiple Accounts Per Borrower**: Separate loan accounts per person (e.g. Account 1: ₹50,000 EMI loan, Account 2: ₹20,000 One-time loan) maintained without merging financial transactions.
- **One-Time & EMI Repayment Engine**:
  - **One-Time**: Single due date, overdue tracking, days past due calculation.
  - **EMI**: Flexible frequency (Daily, Weekly, Biweekly, Monthly), automated schedule generator with rounding balance adjustments.
- **Flexible Payment Engine**: Record any payment amount (full, partial, early, extra). Auto-allocates payment to oldest pending/partial/overdue EMIs or supports manual EMI targeting. Recalculates outstanding balance and transitions status to `Completed` when balance hits ₹0.
- **PDF Receipts & Printing**: Auto-generated PDF receipts using PDFKit with printable browser view and WhatsApp share link formatting.
- **WhatsApp & SMS Notifications**: Integrated notification architecture with automated background cron jobs sending EMI reminders, due today notices, and overdue alerts.
- **Financial Reports & Exports**: Tabbed Collection Report, Overdue Report, EMI Breakdown Report, and Custom Date-Range Report with export buttons for Excel (`.xlsx`), CSV, and PDF.
- **Due Date Calendar**: Monthly visual calendar with status indicators and date inspector drawer.
- **Audit Logging**: Comprehensive admin activity log tracking logins, loan creations, payment entries, notification dispatches, and settings edits.

---

## Technology Stack

- **Frontend**: React.js 18, Vite, Tailwind CSS, React Router v6, Axios, Recharts, Lucide Icons.
- **Backend**: Node.js, Express.js, REST API, Mongoose, JWT, bcryptjs, PDFKit, XLSX, JSON2CSV, Node-Cron, Helmet, CORS.
- **Database**: MongoDB (Supports standard MongoDB connection string or fallback).

---

## Project Folder Structure

```text
Payment_Management/
├── backend/
│   ├── src/
│   │   ├── config/          # MongoDB Connection Config
│   │   ├── controllers/     # API Controllers (Auth, People, Accounts, Payments, etc.)
│   │   ├── middleware/      # Auth JWT Protect, Error Handler, Audit Logger
│   │   ├── models/          # Mongoose Schemas (Admin, Person, Account, EMI, Payment, etc.)
│   │   ├── routes/          # REST API Routes
│   │   ├── services/        # EMI Engine, PDF Generator, Export Service, Notifications, Cron
│   │   ├── utils/           # Database Seed Utility
│   │   └── server.js        # Express Server Entry Point
│   ├── .env.example
│   ├── .env
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/      # Common UI, Layout (Sidebar, Navbar), Modals, Receipt Modal
    │   ├── context/         # AuthContext
    │   ├── pages/           # Dashboard, PeopleList, PersonDetail, AccountList, PaymentsList, etc.
    │   ├── services/        # Axios API Client
    │   ├── App.jsx
    │   └── main.jsx
    ├── index.html
    ├── tailwind.config.js
    └── package.json
```

---

## Local Development Setup

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- MongoDB running locally on `mongodb://127.0.0.1:27017` (or MongoDB Atlas URI)

### 1. Backend Setup & Data Seeding

```bash
cd backend
npm install

# Seed default admin and realistic demo data
npm run seed

# Start API server in development mode (PORT 5001)
npm run dev
```

### Default Admin Credentials
- **Email**: `admin@lendingtracker.com`
- **Password**: `admin123`

### 2. Frontend Setup

```bash
cd ../frontend
npm install

# Start Vite dev server (PORT 3000)
npm run dev
```

Open browser at `http://localhost:3000` to access the application.

---

## Production Deployment Guide

### Backend Deployment (Node.js / Express)
1. Set `NODE_ENV=production` in `.env`.
2. Configure production `MONGODB_URI` (e.g. MongoDB Atlas cluster).
3. Set secure `JWT_SECRET` key.
4. Deploy using PM2, Docker, or platforms like AWS EC2, Render, Heroku, or DigitalOcean:
   ```bash
   npm start
   ```

### Frontend Deployment (React / Vite)
1. Build static production bundle:
   ```bash
   cd frontend
   npm run build
   ```
2. Serve `dist/` directory via Nginx, Vercel, Netlify, or Express static file server.

---

## WhatsApp & SMS Integration

- Admin can configure notification settings in **Admin Settings > Notifications & WhatsApp**.
- Supported notification types: Payment Received Receipt, EMI Reminder (X days before due), Due Today Notice, Overdue Alert, Account Completion.
- Notifications are logged with provider response IDs in the `Notification` collection.

---

## Database Backup Instructions

To perform a backup of the MongoDB database:

```bash
mongodump --uri="mongodb://127.0.0.1:27017/payment_management" --out=./backup/$(date +%Y%m%d)
```

To restore from a backup:

```bash
mongorestore --uri="mongodb://127.0.0.1:27017/payment_management" ./backup/20260818/payment_management
```
