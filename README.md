# NexHRMS — Human Resource Management System

NexHRMS is a full-stack **Human Resource Management System (HRMS)** built with the MERN stack.

It helps organizations manage employees, attendance, leaves, payroll, tasks, performance, recruitment, reimbursements, complaints, notifications and reports from one application.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Use Cases](#use-cases)
- [Features](#features)
- [User Roles](#user-roles)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Run Locally](#run-locally)
- [MongoDB Atlas Setup](#mongodb-atlas-setup)
- [Environment Variables](#environment-variables)
- [Default Admin](#default-admin)
- [Deploy Backend to Render](#deploy-backend-to-render)
- [Deploy Frontend to Vercel](#deploy-frontend-to-vercel)
- [Connect Vercel + Render + MongoDB](#connect-vercel--render--mongodb)
- [Production Checklist](#production-checklist)
- [Common Problems](#common-problems)
- [New Developer Guide](#new-developer-guide)
- [Git Workflow](#git-workflow)
- [Future Improvements](#future-improvements)
- [Author](#author)

---

# Project Overview

NexHRMS replaces manual HR processes and spreadsheet-based management with a centralized web application.

### How it works

```text
React Frontend
      ↓
Axios / REST API
      ↓
Node.js + Express Backend
      ↓
Mongoose
      ↓
MongoDB Atlas
```

Example:

```text
Employee submits leave
        ↓
React sends API request
        ↓
Backend validates request
        ↓
Authentication + role check
        ↓
MongoDB stores data
        ↓
Response sent to frontend
```

---

# Use Cases

### HR

- Manage employees and departments
- Track attendance
- Approve/reject leaves
- Manage payroll and payslips
- Manage recruitment
- Handle complaints and reimbursements
- View reports

### Team leads

Team leads sign in as Employees; the app does not grant a separate Manager role. HR handles company-wide approvals in this release.

### Employees

- View profile
- Mark attendance
- Apply for leave
- View leave balance
- View payslips
- Manage tasks
- Submit reimbursements and complaints
- Receive notifications

---

# Features

### HR Management

- Employee management
- Department management
- Attendance tracking
- Leave management
- Payroll management
- Payslip generation
- CTC calculation
- Work schedules

### Productivity

- Task management
- Kanban/list view
- Performance reviews
- Reimbursements
- Complaints

### Recruitment

- Job postings
- Candidate management
- Recruitment pipeline

### System

- Notifications
- Reports and analytics
- Responsive UI
- Dark/light mode
- Firebase Authentication with verified ID tokens
- Role-Based Access Control
- Protected routes
- Firebase-managed password security
- CORS and security middleware

---

# User Roles

| Role | Access |
|---|---|
| Admin | Company settings, access control, audit oversight, and payroll approval |
| HR | Employee records, attendance, leave approvals, and payroll preparation |
| Employee | Personal profile, attendance, leave requests, and self-service features |

Team leads use the Employee account type with manager/team assignments; they do not have a separate login role.

---

# Technology Stack

## Frontend

- React
- Vite
- Redux Toolkit
- React Router
- Tailwind CSS
- Axios
- React Hook Form
- Zod
- Recharts
- Framer Motion
- Lucide React

## Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- Firebase Admin SDK (server-side ID-token verification)
- Helmet
- CORS
- Express Rate Limit
- PDFKit
- Day.js

## Hosting

| Service | Purpose |
|---|---|
| GitHub | Source code |
| MongoDB Atlas | Database |
| Render | Backend |
| Vercel | Frontend |

---

# Project Structure

```text
NexHRMS/
│
├── client/              # React frontend
│   └── src/
│       ├── components/
│       ├── features/
│       ├── hooks/
│       ├── pages/
│       ├── routes/
│       ├── services/
│       └── utils/
│
├── server/              # Node + Express backend
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   ├── app.js
│   └── server.js
│
└── README.md
```

### Backend learning order

```text
server.js
   ↓
app.js
   ↓
routes
   ↓
controllers
   ↓
models
   ↓
MongoDB
```

---

# Prerequisites

Install:

- Git
- Node.js 22+
- npm
- VS Code
- MongoDB Atlas account

Check installation:

```bash
node --version
npm --version
git --version
```

---

# Run Locally

## 1. Clone the repository

```bash
git clone https://github.com/Abhishek8827/NexHRMS.git
cd NexHRMS
```

Open in VS Code:

```bash
code .
```

---

## 2. Install Backend

```bash
cd server
npm install
```

---

## 3. Install Frontend

Open a **second terminal**:

```bash
cd NexHRMS/client
npm install
```

---

# MongoDB Atlas Setup

NexHRMS uses MongoDB Atlas for the database.

### Step 1 — Create MongoDB Atlas account

Create a cluster for development.

### Step 2 — Create Database User

Go to:

```text
Database Access
```

Create a username and password.

### Step 3 — Configure Network Access

Go to:

```text
Network Access
```

Add your IP address.

For temporary development testing, you can use:

```text
0.0.0.0/0
```

> This allows access from anywhere. Use a restricted configuration for production.

### Step 4 — Get Connection String

Go to:

```text
Cluster → Connect → Drivers → Node.js
```

Copy the connection string.

Example:

```text
mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/nexhr
```

---

# Environment Variables

## Firebase Authentication setup

1. Create a Firebase project and enable **Email/Password** under Authentication → Sign-in method.
2. Register the web app in Firebase and copy its public web configuration into `client/.env` using `client/.env.example` as a template.
3. Create a Firebase service account for the backend. Store its full JSON privately in `FIREBASE_SERVICE_ACCOUNT_JSON` in the server environment; do not commit it.
4. Set `ADMIN_EMAIL` to the email of the first Firebase Admin account. Create that sign-in in Firebase and verify its email. The backend creates the matching HRMS profile on startup.

Existing MongoDB staff profiles can be linked at first sign-in when a Firebase account with the same verified email exists. MongoDB passwords are not migrated to Firebase; existing staff need Firebase accounts provisioned and a password reset or temporary password before they can sign in. New staff accounts created in the app are provisioned in Firebase with the temporary password set by Admin/HR. Back up the database before rollout: legacy Manager roles are converted to Employee roles at server startup, and Manager-only permissions are removed.

## Local configuration

Copy `server/.env.example` to `server/.env` and `client/.env.example` to `client/.env`. Set the database and Firebase values for your environment. The Firebase web configuration is public application configuration; the service-account JSON is a private server secret.

Never commit real `.env` files, service-account JSON, or production credentials.

---

# Start the Application

You need **two terminals**.

## Terminal 1 — Backend

```bash
cd NexHRMS/server
npm run dev
```

Backend:

```text
http://localhost:5000
```

Health check:

```text
http://localhost:5000/health
```

API:

```text
http://localhost:5000/api/v1
```

## Terminal 2 — Frontend

```bash
cd NexHRMS/client
npm run dev
```

Frontend:

```text
http://localhost:5173
```

Open the frontend URL in your browser.

---

# First Admin Account

Set `ADMIN_EMAIL`, `ADMIN_FIRST_NAME`, and `ADMIN_LAST_NAME` on the backend. On startup, the backend creates an Admin HRMS profile for that email if one does not already exist. Create the matching account in Firebase Authentication and verify its email before signing in. No default password is created.

---

# Deploy Backend to Render

## 1. Push code to GitHub

```bash
git add .
git commit -m "prepare NexHRMS for deployment"
git push origin main
```

## 2. Create Render Web Service

In Render:

```text
New → Web Service
```

Select:

```text
Abhishek8827/NexHRMS
```

### Settings

| Setting | Value |
|---|---|
| Runtime | Node |
| Root Directory | `server` |
| Build Command | `npm install` |
| Start Command | `npm start` |
| Branch | `main` |

## 3. Add Render Environment Variables

```env
NODE_ENV=production
MONGODB_URI=your_mongodb_atlas_connection_string
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_SERVICE_ACCOUNT_JSON=store-the-full-service-account-json-as-a-secret
CLIENT_URL=https://YOUR-VERCEL-APP.vercel.app
ADMIN_EMAIL=first-admin@your-company.com
ADMIN_FIRST_NAME=System
ADMIN_LAST_NAME=Administrator
```

Deploy the service.

Render will give you a URL like:

```text
https://your-api.onrender.com
```

Test:

```text
https://your-api.onrender.com/health
```

---

# Deploy Frontend to Vercel

## 1. Import Repository

In Vercel:

```text
Add New Project
```

Import:

```text
Abhishek8827/NexHRMS
```

## 2. Set Root Directory

Because the frontend is inside `client`:

```text
Root Directory: client
```

## 3. Build Settings

```text
Build Command: npm run build
Output Directory: dist
```

## 4. Add Environment Variable

In Vercel → Settings → Environment Variables:

```env
VITE_API_URL=https://YOUR-RENDER-APP.onrender.com/api/v1
VITE_FIREBASE_API_KEY=your-firebase-web-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-firebase-project-id
VITE_FIREBASE_APP_ID=your-firebase-web-app-id
```

Deploy.

Vercel will give you a URL like:

```text
https://your-app.vercel.app
```

---

# Connect Vercel + Render + MongoDB

The final setup is:

```text
Vercel
React Frontend
    ↓
VITE_API_URL
    ↓
Render
Node + Express Backend
    ↓
MONGODB_URI
    ↓
MongoDB Atlas
```

### Vercel → Render

```env
VITE_API_URL=https://YOUR-RENDER-APP.onrender.com/api/v1
```

### Render → MongoDB

```env
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/nexhr
```

### Render → Vercel

```env
CLIENT_URL=https://YOUR-VERCEL-APP.vercel.app
```

### Recommended order

```text
1. Setup MongoDB Atlas
2. Deploy backend to Render
3. Test /health
4. Deploy frontend to Vercel
5. Add VITE_API_URL
6. Set CLIENT_URL in Render
7. Test login and application
```

---

# Production Checklist

- [ ] MongoDB is connected
- [ ] Render backend is running
- [ ] `/health` works
- [ ] Vercel frontend is deployed
- [ ] `VITE_API_URL` is correct
- [ ] `CLIENT_URL` is correct
- [ ] Firebase Email/Password provider is enabled
- [ ] Firebase service-account credentials are stored only in server secrets
- [ ] Admin account is created in Firebase and verified
- [ ] `.env` is not committed
- [ ] Login works
- [ ] Employees work
- [ ] Attendance works
- [ ] Leaves work
- [ ] Payroll works
- [ ] Reports work
- [ ] Backup/recovery strategy is considered

---

# Common Problems

## `npm is not recognized`

Install Node.js and restart VS Code.

```bash
node --version
npm --version
```

## MongoDB connection failed

Check:

- `MONGODB_URI`
- Username/password
- Atlas Network Access
- Database permissions

## Frontend Network Error

Check:

```text
Backend running?
/health working?
VITE_API_URL correct?
CORS configured?
```

## CORS Error

Set in Render:

```env
CLIENT_URL=https://YOUR-VERCEL-APP.vercel.app
```

Then redeploy/restart the backend.

## Login works locally but not on Vercel

Make sure Vercel uses:

```text
https://YOUR-RENDER-APP.onrender.com/api/v1
```

and not:

```text
http://localhost:5000/api/v1
```

## API requests fail on Vercel

Open:

```text
F12 → Network
```

Check the failed request URL and response.

---

# New Developer Guide

If you are new to the project, learn it step by step.

### 1. Learn the frontend

Start with:

```text
client/src/
```

Understand:

- Components
- Pages
- Routes
- Redux
- API services
- Authentication

### 2. Learn the backend

Follow:

```text
server.js
 ↓
app.js
 ↓
routes
 ↓
controllers
 ↓
models
 ↓
MongoDB
```

### 3. Learn Authentication

```text
Firebase Sign-in
 ↓
Firebase ID Token
 ↓
Protected Request
 ↓
Firebase Admin Verification
 ↓
Role Check
 ↓
Controller
 ↓
Database
```

### 4. Learn One Module at a Time

Start with:

```text
Departments
```

Then:

```text
Employees
 ↓
Attendance
 ↓
Leaves
 ↓
Payroll
```

Trace each feature:

```text
Model → Controller → Route → API → Frontend → UI
```

---

# Git Workflow

Get latest code:

```bash
git pull origin main
```

Create feature branch:

```bash
git checkout -b feature/your-feature-name
```

After making changes:

```bash
git add .
git commit -m "feat: describe your change"
git push origin feature/your-feature-name
```

Then create a Pull Request.

### Commit examples

```text
feat: add employee search
fix: resolve payroll issue
docs: update README
refactor: improve auth middleware
```

---

# Future Improvements

Possible future improvements:

- Automated tests
- Swagger/OpenAPI documentation
- CI/CD pipeline
- Audit logs
- Employee document management
- Advanced payroll configuration
- Email/SMS integration
- Automated backups
- Error monitoring
- Docker support
- Staging environment
- Advanced analytics

---

# Author

**Abhishek Wani**

B.Tech — Computer Science Engineering

NexHRMS is a major/academic project demonstrating:

- Full-stack development
- REST API development
- Authentication
- Role-Based Access Control
- MongoDB
- Redux
- Cloud deployment

GitHub:

https://github.com/Abhishek8827

---

# License

This project was developed primarily for academic and learning purposes.

Before using NexHRMS in a real production organization, review its security, data privacy, payroll rules, infrastructure and compliance requirements.

---

# Quick Start

```bash
# Clone
git clone https://github.com/Abhishek8827/NexHRMS.git
cd NexHRMS

# Backend
cd server
npm install
# Create server/.env
npm run dev
```

Open another terminal:

```bash
cd NexHRMS/client
npm install
npm run dev
```

Open:

```text
Frontend: http://localhost:5173
Backend:  http://localhost:5000
Health:   http://localhost:5000/health
API:      http://localhost:5000/api/v1
```

### Production

```text
MongoDB Atlas
      ↓
Render Backend
      ↓
Vercel Frontend
```

Happy coding!
