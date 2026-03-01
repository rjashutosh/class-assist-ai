# ClassAssist AI

AI-powered voice assistant for senior teachers to manage classes using conversational commands.

## Tech Stack

- **Frontend:** React, TypeScript, TailwindCSS, Framer Motion, Web Speech API, SpeechSynthesis
- **Backend:** Node.js, Express, TypeScript, Prisma, SQLite, OpenAI API (pluggable AI providers)

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment (copy .env.example in client and server)
# Add OPENAI_API_KEY in server/.env

# Generate Prisma client & push DB
npm run db:generate
npm run db:push
npm run db:seed

# Run dev (client + server)
npm run dev
```

- Client: http://localhost:5173
- Server: http://localhost:3001

## Project Structure

- `/client` – React SPA (voice UI, dashboard, calendar, admin)
- `/server` – Express API, Prisma, AI intent extraction

## Supported Voice Intents

- schedule_class
- cancel_class
- reschedule_class
- add_student
- send_reminder

## Roles

- **Admin** – Platform level; creates accounts, assigns users
- **Teacher** – Owns classes and students
- **Manager** – Inside teacher account

One Account = One Teacher + One Manager. Subscription: BASIC (5 classes/month) or PRO (unlimited).
