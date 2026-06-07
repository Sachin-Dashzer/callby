# CallTrack — Team Call Monitoring System

A full-stack team call monitoring system with backend API, web dashboard, and mobile app.

## Quick Start

### 1. Backend
```bash
cd backend
npm install
# Edit .env with your MongoDB URI and JWT secret
npm run seed    # seed demo data
npm run dev     # starts on http://localhost:5000
```

### 2. Dashboard
```bash
cd dashboard
npm install
npm run dev     # starts on http://localhost:3000
```

### 3. Mobile
```bash
cd mobile
npm install
# Update src/lib/api.js with your server IP
npx expo start
```

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Manager | manager@calltrack.com | password123 |
| Employee 1 | employee1@calltrack.com | password123 |
| Employee 2 | employee2@calltrack.com | password123 |
| Employee 3 | employee3@calltrack.com | password123 |
| Employee 4 | employee4@calltrack.com | password123 |
| Employee 5 | employee5@calltrack.com | password123 |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js, Express, MongoDB, Socket.io, JWT |
| Dashboard | Next.js 14 (App Router), Tailwind CSS, Recharts, Socket.io-client |
| Mobile | React Native, Expo, AsyncStorage, Axios |
