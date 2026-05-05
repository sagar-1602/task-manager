# Task Manager (Full Stack)

A full-stack Task Manager application where users can register, login, create projects, and manage tasks efficiently.

---

## Tech Stack

### Frontend

- React (Vite)
- JavaScript (ES6)
- CSS

### Backend

- Node.js
- Express.js

### Database

- SQLite3

---

## Features

- User Authentication (Register & Login)
- Protected Routes
- Create and manage projects
- Task management (Create, Update, Delete)
- Assign tasks to users
- Task status & priority tracking

---

## Project Structure

```id="nq8v4p"
project-root/
│
├── backend/
│   ├── middleware/
│   │   └── auth.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── projects.js
│   │   └── tasks.js
│   ├── database.js
│   ├── server.js
│   └── taskmanager.db
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Signup.jsx
│   │   │   ├── Projects.jsx
│   │   │   └── ProjectDetail.jsx
│   │   ├── api.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   └── package.json
│
└── README.md
```

---

## Setup Instructions

### 1. Clone Repository

```bash id="3dxykl"
git clone https://github.com/your-username/task-manager.git
cd task-manager
```

---

### 2. Backend Setup

```bash id="dqk6cx"
cd backend
npm install
npm start
```

Backend runs on:

```id="6chgrb"
http://localhost:5000
```

---

### 3. Frontend Setup

```bash id="3dlvlx"
cd frontend
npm install
npm run dev
```

Frontend runs on:

```id="ux07qn"
http://localhost:5173
```

---

## Environment Variables

Create `.env` file inside backend:

```id="51z9yz"
PORT=5000
JWT_SECRET=your_secret_key
```

---

## API Endpoints

### Auth

- POST `/api/auth/register`
- POST `/api/auth/login`

### Projects

- GET `/api/projects`
- POST `/api/projects`

### Tasks

- GET `/api/tasks`
- POST `/api/tasks`

---

## Deployment

- Live link : https://task-manager-production-3877.up.railway.app/

---

## Notes

- SQLite database is created automatically
- Backend must be running before frontend
- Protected routes require authentication token

---

## Author

Sagar Kumar Singh
