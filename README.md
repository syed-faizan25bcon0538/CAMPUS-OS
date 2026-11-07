# Campus OS

A student productivity web app: track classes, tasks, notes, events and deadlines, with an AI assistant for study help, assignment guidance and hackathon questions.

## Features
- Dashboard with pending tasks, today's classes and upcoming deadlines
- Tasks with due dates and overdue alerts
- Weekly class timetable
- Searchable notes
- Events, exams and deadlines with countdowns
- AI assistant that can see your tasks, classes, events and notes

## Tech stack
- Frontend: React + Vite
- Backend: Node.js + Express
- AI: Anthropic API (called from the server, so the key stays private)
- Storage: browser localStorage

## Setup

1. Install Node.js 18 or newer.
2. Install all packages:
   ```
   npm install
   npm run install:all
   ```
3. Create `server/.env` (copy `server/.env.example`) and add your API key:
   ```
   ANTHROPIC_API_KEY=your_key_here
   PORT=5000
   MODEL=claude-sonnet-5-5
   ```
4. Start the app:
   ```
   npm run dev
   ```
5. Open http://localhost:5173

The planner works without an API key. Only the AI assistant needs it.

## Project structure
```
campus-os/
├── server/   Express server with the /api/chat route
└── client/   React app (components, utils, styles)
```