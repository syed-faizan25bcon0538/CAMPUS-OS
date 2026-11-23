# Campus OS

A student productivity web app. Track tasks, your weekly timetable, notes and deadlines, and ask an AI assistant that can see your schedule.

**Live demo:** https://campus-os-kappa-eight.vercel.app

## Pages

- **Dashboard:** pending, due-soon and overdue counts, today's classes, upcoming deadlines
- **Tasks:** due dates, filters, clear completed
- **Timetable:** weekly view with today highlighted
- **Notes:** write and search notes
- **Calendar:** exams, deadlines, hackathons and events
- **AI assistant:** study help and planning, aware of your schedule

## Tech stack

- Frontend: React, Vite, React Router (Vercel)
- Backend: Node.js, Express (Render)
- AI: Google Gemini API, called from the server so the key stays private

## Run it locally

1. Install Node.js 18 or newer.
2. `npm install` then `npm run install:all`
3. Create `server/.env` from `server/.env.example` and add a free key from https://aistudio.google.com/apikey
4. `npm run dev`, then open http://localhost:5173