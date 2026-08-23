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

### Managers

- Monitor team attendance
- Review leave requests
- Assign tasks
- Review employee performance

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
- JWT authentication
- Role-Based Access Control
- Protected routes
- Password hashing
- CORS and security middleware

---

# User Roles

| Role | Access |
|---|---|
| Admin | Full system access |
| HR Manager | Employees, payroll, leaves, recruitment, reports |
| Manager | Team attendance, leaves, tasks, performance |
| Employee | Personal HR features |

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
- JWT
- bcryptjs
- Nodemailer
- Multer
- Cloudinary
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
- Node.js 18+
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

## Backend

Create:

```text
server/.env
```

Add:

```env
NODE_ENV=development
PORT=5000

MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/nexhr

ACCESS_TOKEN_SECRET=your_long_access_secret
REFRESH_TOKEN_SECRET=your_different_refresh_secret

ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d

CLIENT_URL=http://localhost:5173

ADMIN_EMAIL=admin@nexhr.com
ADMIN_PASSWORD=Admin@123456
ADMIN_FIRST_NAME=System
ADMIN_LAST_NAME=Administrator
```

## Frontend

Create:

```text
client/.env
```

Add:

```env
VITE_API_URL=http://localhost:5000/api/v1
```

> Never commit real `.env` files or secrets to GitHub.

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

# Default Admin

The backend creates an admin account automatically when no admin exists.

```text
Email:    admin@nexhr.com
Password: Admin@123456
```

> Change the default password before production use.

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

ACCESS_TOKEN_SECRET=your_production_access_secret
REFRESH_TOKEN_SECRET=your_production_refresh_secret

ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d

CLIENT_URL=https://YOUR-VERCEL-APP.vercel.app

ADMIN_EMAIL=your-admin-email
ADMIN_PASSWORD=your-strong-admin-password
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

```text
VITE_API_URL=https://YOUR-RENDER-APP.onrender.com/api/v1
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
- [ ] JWT secrets are strong
- [ ] Default admin password is changed
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
Login
 ↓
JWT
 ↓
Protected Request
 ↓
Auth Middleware
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
