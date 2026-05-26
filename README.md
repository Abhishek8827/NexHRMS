# NexHR — Enterprise HR Management System

A production-ready SaaS HRMS built with the MERN Stack.

## Live Demo

- Frontend: https://nexhr.vercel.app
- Backend API: https://nexhr-api.onrender.com

## Default Login

- Email: admin@nexhr.com
- Password: Admin@123456

## Tech Stack

- **Frontend:** React 18, Vite, Redux Toolkit, Tailwind CSS
- **Backend:** Node.js, Express.js, MongoDB Atlas
- **Auth:** JWT (Access + Refresh tokens)
- **Deployment:** Vercel (FE) + Render (BE) + MongoDB Atlas

## Features

- JWT Authentication + RBAC (4 roles)
- Employee Management (CRUD)
- Attendance Tracking (Punch In/Out)
- Leave Management (Apply + Approve)
- Payroll Processing (EPF + ESIC + TDS)
- Payslip PDF Generator
- CTC Calculator
- Recruitment Pipeline
- Task Management (Kanban)
- Performance Reviews
- Reimbursements
- Complaint Management
- Real-time Notifications
- Dark/Light Mode
- Fully Responsive

## Local Setup

git clone https://github.com/username/nexhr-hrms.git
cd nexhr-hrms

# Backend

cd server && npm install
cp .env.example .env
npm run dev

# Frontend

cd ../client && npm install
npm run dev
