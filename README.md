# Campus OS

A student productivity web app: track classes, tasks, notes, events and deadlines, with an AI assistant for study help, assignment guidance and hackathon questions.

**Live demo:** https://campus-os-kappa-eight.vercel.app
**Backend:** https://campus-os-server.onrender.com

Note: the backend runs on a free plan and sleeps when idle, so the first AI reply after a pause can take up to a minute.

## Features
- Dashboard with pending tasks, today's classes and upcoming deadlines
- Tasks with due dates and overdue alerts
- Weekly class timetable
- Searchable notes
- Events, exams and deadlines with countdowns
- AI assistant that can see your tasks, classes, events and notes

## Tech stack
- Frontend: React + Vite (deployed on Vercel)
- Backend: Node.js + Express (deployed on Render)
- AI: Google Gemini API (free tier), called from the server so the key stays private
- Storage: browser localStorage

## Run it locally

1. Install Node.js 18 or newer.
2. Install all packages:
   ```
   npm install
   npm run install:all
   ```
3. Get a free key at https://aistudio.google.com/apikey, then create `server/.env` (copy `server/.env.example`):
   ```
   GEMINI_API_KEY=your_key_here
   GEMINI_MODEL=gemini-2.5-flash
   PORT=5000
   ```
4. Start the app:
   ```
   npm run dev
   ```
5. Open http://localhost:5173

The planner works without an API key. Only the AI assistant needs it.

## Deployment
- **Backend (Render):** root directory `server`, build command `npm install`, start command `npm start`, health check path `/api/health`. Environment variables: `GEMINI_API_KEY`, `GEMINI_MODEL`.
- **Frontend (Vercel):** root directory `client`, framework preset Vite. Environment variable: `VITE_API_URL` set to the backend address.

## Project structure
```
campus-os/
├── server/   Express server with the /api/chat route
└── client/   React app (components, utils, styles)
```