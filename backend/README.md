# CallTrack Backend

Node.js + Express + MongoDB + Socket.io API server.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure `.env`:
   ```
   PORT=5000
   MONGO_URI=your_mongodb_atlas_uri
   JWT_SECRET=your_jwt_secret_key_here
   ```

3. Seed the database:
   ```bash
   npm run seed
   ```
   Creates:
   - Manager: `manager@calltrack.com` / `password123`
   - Employees: `employee1@calltrack.com` to `employee5@calltrack.com` / `password123`
   - 100 sample call logs

4. Start development server:
   ```bash
   npm run dev
   ```

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | — | Register user |
| POST | `/api/auth/login` | — | Login, returns JWT |
| GET | `/api/auth/me` | JWT | Get current user |
| POST | `/api/calls/sync` | Employee | Sync call logs from device |
| GET | `/api/calls` | Manager | All call logs with filters |
| GET | `/api/calls/stats` | Manager | Dashboard statistics |
| GET | `/api/calls/realtime` | Manager | Latest 50 calls |
| GET | `/api/calls/employee/:id` | Manager | Calls for specific employee |
| GET | `/api/employees` | Manager | List all employees |
| POST | `/api/employees` | Manager | Add employee |
| POST | `/api/leads` | Manager | Create lead |
| GET | `/api/leads` | Manager | All leads |
| PUT | `/api/leads/:id` | Manager/Employee | Update lead |
| DELETE | `/api/leads/:id` | Manager | Delete lead |
| POST | `/api/leads/:id/note` | Manager/Employee | Add note |
| GET | `/api/leads/assigned` | Employee | My assigned leads |

## Socket.io Events

- **`new_call_log`** — emitted to `managers` room when employee syncs calls
