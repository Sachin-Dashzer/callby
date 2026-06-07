# CallTrack Dashboard

Next.js 14 App Router web dashboard for managers.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure `.env.local`:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:5000
   ```

3. Start development server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000)

## Features

- **Dashboard** — Real-time call feed via Socket.io, stats cards, calls-per-hour bar chart, top dialers
- **Employees** — List, add employees, click through to individual call history
- **Call Logs** — Full call history with employee/type/date filters, CSV export
- **Leads** — Create, update status, assign to employees, add notes

## Login

Use manager credentials: `manager@calltrack.com` / `password123`
