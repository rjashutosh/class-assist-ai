# Testing ClassAssist (Calendar, Zoom, Email)

## Prerequisites

- **Server** running: `cd server && npm run dev` (port 3001)
- **Client** running: `cd client && npm run dev` (port 5173)
- **DB seeded**: `cd server && npx prisma db push && npx prisma db seed`

---

## Option 1: Quick test via script (recommended)

1. Start server and client (see above).
2. In another terminal, from the **server** folder:
   ```bash
   npm run create-test-class
   ```
3. This creates one class for **Alice** (Math, today’s date, 3:00 PM) with a Zoom link.
4. In the browser:
   - Go to **http://localhost:5173**
   - Log in: `teacher@classassist.ai` / `teacher123`
   - Open **Calendar** in the sidebar.
5. You should see an event with:
   - Title: **Class with Alice**
   - Time: **3:00 PM**
   - **Zoom Link**
6. **Click the event** → modal should show:
   - **Class Details**
   - Student: Alice
   - Time: (full date/time)
   - **Zoom Link** → “Join Zoom meeting” (clickable)
7. **Email:** Alice has `alice@example.com` in the seed. With Ethereal configured in `.env`, check **https://ethereal.email** (login with your Ethereal user) to see the “Your Class Invitation” email.

---

## Option 2: Test via Voice Assistant

1. Log in at http://localhost:5173 as **teacher@classassist.ai** / **teacher123**.
2. Go to **Assistant**.
3. Tap the mic and say (or type in the box):  
   **“Schedule a class with Alice tomorrow at 3 PM”**  
   then click **Confirm** → **Execute**.
4. Open **Calendar** and find the new event. Click it and check:
   - Class Details modal
   - Student, Time, Zoom Link (clickable).
5. If the student has an email in the DB, check Ethereal for the invite.

---

## Option 3: Test only the Calendar UI (no backend)

If you just want to check the calendar layout and modal:

1. Log in and go to **Calendar**.
2. Run `npm run create-test-class` once (with server running) so there is at least one class.
3. Use the Calendar page to click the event and confirm the modal shows **Class Details**, **Student**, **Time**, and **Zoom Link**.

---

## Troubleshooting

| Issue | Check |
|-------|--------|
| No event on calendar | Same month as class date? Try `create-test-class` again (it uses today). |
| “Login failed” when running script | Server running on 3001? Run `npm run db:seed` so teacher user exists. |
| No email in Ethereal | `.env` has `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` (Ethereal). Student must have an email (e.g. Alice from seed). |
| Zoom link is mock | Expected. Real Zoom needs Zoom API keys and `zoomService` implementation. |
