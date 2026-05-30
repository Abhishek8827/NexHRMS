# NexHR — Enterprise HR Management System

> A production-grade SaaS HR Management System built with the MERN Stack.
> Developed as a B.Tech Major Project (2024–25).

---

## 🔗 Live Demo

| Service  | URL                                   |
| -------- | ------------------------------------- |
| Frontend | https://nexhr-api.vercel.app          |
| Backend  | https://nexhr-api.onrender.com        |
| Health   | https://nexhr-api.onrender.com/health |

**Default Admin Login:**

- Email: `admin@nexhr.com`
- Password: `Admin@123456`

---

## 📋 Project Overview

NexHR is a full-stack, cloud-deployed Human Resource Management System
designed for small to mid-sized organizations. It replaces traditional
spreadsheet-based HR processes with a modern, real-time, role-aware
web application.

---

## 👥 Role-Based Access

| Role       | Access Level                                       |
| ---------- | -------------------------------------------------- |
| Admin      | Full system access — all modules                   |
| HR Manager | Employees, Payroll, Leaves, Recruitment, Reports   |
| Manager    | Team attendance, leaves, tasks, performance        |
| Employee   | Self-service — attendance, leaves, payslips, tasks |

---

## ✨ Features

### Core HR Modules

- ✅ Employee Management (Add, Edit, Deactivate, Search, Filter)
- ✅ Attendance Tracking (Punch In/Out, Late Mark, Monthly History)
- ✅ Leave Management (Apply, Approve/Reject, Balance Tracker)
- ✅ Payroll System (EPF, ESIC, TDS, LOP Deductions, Net Salary)
- ✅ Payslip Generator (Printable PDF-style payslip)
- ✅ CTC Calculator (Annual breakdown with all components)

### Productivity Modules

- ✅ Task Management (Kanban Board + List View, Comments, Priority)
- ✅ Performance Reviews (Self Review + Manager Review, Star Ratings)
- ✅ Reimbursements (Submit, Approve, Track)
- ✅ Complaints (Anonymous filing, Status tracking, HR Resolution)

### Recruitment

- ✅ Job Postings (Create, Edit, Open/Close)
- ✅ Candidate Pipeline (Stage-wise tracking)

### System Features

- ✅ Real-time Notifications (In-app notification center)
- ✅ Work Schedule Configuration (Per employee or department)
- ✅ Reports & Analytics (Charts, Attendance Reports)
- ✅ Dark / Light Mode
- ✅ Fully Responsive (Mobile, Tablet, Desktop)
- ✅ JWT Authentication with Refresh Token rotation
- ✅ Protected Routes with RBAC

---

## 🛠 Technology Stack

### Frontend

| Technology      | Purpose                       |
| --------------- | ----------------------------- |
| React 18 + Vite | UI Framework                  |
| Redux Toolkit   | Global State Management       |
| Tailwind CSS v3 | Utility-first Styling         |
| Framer Motion   | Animations                    |
| React Hook Form | Form Handling + Validation    |
| Zod             | Schema Validation             |
| Recharts        | Analytics Charts              |
| Lucide React    | Icon Library                  |
| Axios           | HTTP Client with Interceptors |

### Backend

| Technology         | Purpose                            |
| ------------------ | ---------------------------------- |
| Node.js + Express  | REST API Server                    |
| MongoDB + Mongoose | Database + ODM                     |
| JWT                | Authentication Tokens              |
| Bcrypt.js          | Password Hashing                   |
| Day.js             | Date Calculations                  |
| Nodemailer         | Email Notifications (configurable) |

### Infrastructure

| Service       | Purpose                    |
| ------------- | -------------------------- |
| MongoDB Atlas | Cloud Database (Free Tier) |
| Render        | Backend Hosting            |
| Vercel        | Frontend Hosting + CDN     |
| GitHub        | Version Control            |

---

## 🗄 Database Schema

15 MongoDB Collections:

Users → Employee records with RBAC
Departments → Organizational structure
Attendance → Daily punch records
Leaves → Leave applications + approvals
Payroll → Monthly salary records
Jobs → Job postings
Candidates → Recruitment pipeline
Tasks → Task assignments
PerformanceReviews → Quarterly reviews
Reimbursements → Expense claims
Complaints → Workplace complaints
Notifications → In-app notifications
WorkSchedules → Shift configurations

---

## 🏗 System Architecture

┌─────────────────────────────────────────────────────┐
│ CLIENT (Vercel) │
│ React + Vite │ Redux Toolkit │ Tailwind CSS │
└───────────────────────┬─────────────────────────────┘
│ HTTPS / REST API
┌───────────────────────▼─────────────────────────────┐
│ SERVER (Render) │
│ Node.js + Express │ JWT Auth │ RBAC Middleware │
└───────────────────────┬─────────────────────────────┘
│ Mongoose ODM
┌───────────────────────▼─────────────────────────────┐
│ DATABASE (MongoDB Atlas) │
│ 15 Collections │ Indexes │ Relationships │
└─────────────────────────────────────────────────────┘

---

## 🚀 Local Setup

### Prerequisites

- Node.js v18+
- MongoDB Atlas account (free)
- Git

### Steps

```bash
# 1. Clone repository
git clone https://github.com/Abhishek8827/NexHRMS
cd NexHRMS

# 2. Setup backend
cd server
npm install
cp .env.example .env      # Fill in your values
npm run dev               # Runs on http://localhost:5000

# 3. Setup frontend (new terminal)
cd ../client
npm install
npm run dev               # Runs on http://localhost:5173
```

### Environment Variables (server/.env)

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/nexhr
ACCESS_TOKEN_SECRET=your_secret_min_32_chars
REFRESH_TOKEN_SECRET=your_different_secret
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d
CLIENT_URL=http://localhost:5173
ADMIN_EMAIL=admin@nexhr.com
ADMIN_PASSWORD=Admin@123456
ADMIN_FIRST_NAME=System
ADMIN_LAST_NAME=Administrator
```

---

## 📁 Project Structure

NexHRMS/
├── server/ # Express backend
│ ├── controllers/ # Business logic (14 controllers)
│ ├── models/ # Mongoose schemas (15 models)
│ ├── routes/ # API route definitions
│ ├── middleware/ # Auth + error handlers
│ ├── utils/ # Helper utilities
│ ├── config/ # DB connection
│ ├── app.js # Express app setup
│ └── server.js # Entry point + seeding
│
└── client/ # React frontend
└── src/
├── features/ # Redux slices (11 slices)
├── pages/ # Page components (15 pages)
├── components/ # Reusable components
│ ├── common/ # Button, Input, Modal, Badge...
│ └── layout/ # Sidebar, Navbar, Layout
├── hooks/ # Custom React hooks
├── routes/ # React Router config
├── services/ # Axios API service
├── utils/ # Helpers + constants
└── app/ # Redux store

---

## 🔒 Security Features

- JWT Access Token (15 min expiry) + Refresh Token (7 days)
- HttpOnly cookies for refresh token storage
- Bcrypt password hashing (salt rounds: 12)
- Helmet.js security headers
- Rate limiting on API endpoints
- Input validation on all routes
- Role-based route protection
- CORS restricted to known origins

---

## 📊 Payroll Calculation Engine

Basic Salary = Employee's configured base
HRA = 40% of Basic
Conveyance = ₹1,600 (fixed)
Medical Allowance = ₹1,250 (fixed)
Special Allowance = 10% of Basic
─────────────────────────────────────
Gross Salary = Sum of above
EPF (Employee) = 12% of Basic
EPF (Employer) = 12% of Basic
ESIC (Employee) = 0.75% (if gross ≤ ₹21,000)
ESIC (Employer) = 3.25% (if gross ≤ ₹21,000)
Professional Tax = ₹200 (if gross > ₹15,000)
LOP Deduction = (Basic / Working Days) × LOP Days
─────────────────────────────────────
Net Salary = Gross − Employee Deductions

---

## 👨‍💻 Author

**Abhishek Wani**
B.Tech Computer Science Engineering
Major Project — 2024–25

---

## 📄 License

This project is developed for academic purposes.
