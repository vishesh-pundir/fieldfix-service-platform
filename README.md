# FieldFix

FieldFix is a field service booking and dispatch application. Customers can request and track home repairs. A signed-in team can manage bookings, maintain technician availability, and assign work using a clear rule based recommendation.

The dispatch recommendation checks that a technician is available and has the requested service skill. If several technicians qualify, it recommends the one with the fewest active bookings. This is ordinary JavaScript logic; it does not use machine learning or claim to be AI.

## Features

- Responsive landing page, customer booking form and booking status lookup.
- Team sign-in with admin and dispatcher roles.
- Admins can manage the technician roster and remove bookings.
- Dispatchers can manage and assign bookings but cannot change the roster or delete records.
- Booking search, filters, edits, status updates and technician assignment.
- Technician skill and availability management.
- Express REST API with input validation, role checks, and JSON error messages.
- Mongoose Booking and Technician models.
- Labeled in-memory mode for running without a MongoDB server.

## Technology

React, React Hooks, Vite, HTML, CSS, JavaScript, Node.js, Express, MongoDB and Mongoose.

## Run locally

Requirements: Node.js 20 or newer and npm.

1. Install packages with npm install.
2. Copy .env.example to .env.
3. Create an admin password hash and session secret as described below, and fill in ADMIN_PASSWORD_HASH and AUTH_SECRET.
4. Start the client and API together with npm run dev.
5. Open http://localhost:5173.

The local API uses port 5001. The current checkout includes local demonstration accounts in its ignored .env file. Keep that file private and replace the demonstration passwords before using the app beyond local development.

To make your own password hash, run this command and copy the output into ADMIN_PASSWORD_HASH:

    node -e "const b=require('bcryptjs'); console.log(b.hashSync('choose-a-password', 12))"

Make a long random session secret and copy it into AUTH_SECRET:

    node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"

You can add an optional dispatcher account by setting DISPATCHER_EMAIL and DISPATCHER_PASSWORD_HASH. All credentials and secrets belong in .env, which is excluded from Git.

## Team access

Sign-in uses an HttpOnly cookie signed by the server and expires after 12 hours. The browser cannot read the cookie from JavaScript.

- Admin: manage and delete bookings, and add or update technicians.
- Dispatcher: search and update bookings, view technicians, and assign work.
- Customer: submit a booking and look it up using its reference and email.

The app does not have public account registration or password recovery. Add team accounts through environment variables and store only bcrypt password hashes there.

## Connect MongoDB

For a quick UI demo, set `STORAGE_MODE=memory`. A banner explains that records reset when the API server restarts.

For persistent storage, install MongoDB Community Server for your operating system from the [official MongoDB download page](https://www.mongodb.com/try/download/community), then:

1. Set `STORAGE_MODE=mongo` and `MONGODB_URI=mongodb://127.0.0.1:27017/fieldfix` in `.env`.
2. Start the local server with `npm run db:start`. The helper uses `mongod` on your PATH or `.local-tools/mongodb/bin/mongod` and stores database files in `.local-data/mongodb/`.
3. Run `npm run dev`. The API waits for MongoDB before it starts listening, and the page reports the connected storage mode.
4. Stop MongoDB with `npm run db:stop` when you are finished.

MongoDB binaries, database files, logs, and `.env` are excluded from Git. For MongoDB's supported macOS versions and installation options, see the [official macOS install guide](https://www.mongodb.com/docs/manual/tutorial/install-mongodb-on-os-x/).

## REST API

The API is available under /api. Login, logout, current-user, health, booking creation, and customer booking lookup are public routes. All booking management and technician routes require a valid team cookie. Deleting a booking or changing the technician roster requires the admin role.

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| GET | /health | Public | API and storage status |
| POST | /auth/login | Public | Sign into the team desk |
| GET | /auth/me | Team | Read the current team account |
| POST | /auth/logout | Public | Clear the team session |
| POST | /bookings | Public | Create a customer booking |
| GET | /bookings/track?reference=...&email=... | Public | Look up a booking |
| GET | /bookings | Team | List bookings; supports search, status and service |
| GET | /bookings/:id | Team | Read one booking |
| PATCH or PUT | /bookings/:id | Team | Update booking fields or status |
| GET | /bookings/:id/recommendation | Team | Preview a technician match |
| PATCH | /bookings/:id/assign | Team | Assign the best match or a chosen technicianId |
| DELETE | /bookings/:id | Admin | Delete a booking |
| GET | /technicians | Team | List technicians |
| POST | /technicians | Admin | Add a technician |
| PATCH or PUT | /technicians/:id | Admin | Update technician details or availability |

Example booking JSON:

    {
      "customerName": "Morgan Lee",
      "email": "morgan@example.com",
      "phone": "+1 555 0100",
      "service": "plumbing",
      "problem": "The kitchen sink is leaking under the cabinet.",
      "address": "18 Oak Street",
      "preferredDate": "2026-12-04",
      "preferredTime": "8 am – 11 am"
    }

## Project structure

    field-service-platform/
    ├── backup/initial-static-site/    Original HTML, CSS and JavaScript
    ├── client/
    │   ├── index.html
    │   ├── vite.config.js
    │   └── src/
    │       ├── components/            Booking, login, dispatch, team and tracking UI
    │       ├── services/api.js        Frontend REST requests
    │       ├── styles/global.css
    │       ├── App.jsx
    │       └── main.jsx
    ├── server/src/
    │   ├── config/database.js
    │   ├── controllers/               Auth, booking and technician behavior
    │   ├── middleware/                Session role checks and error responses
    │   ├── models/                    Mongoose Booking and Technician schemas
    │   ├── routes/api.js
    │   ├── services/                  Storage adapter and dispatch rules
    │   ├── app.js
    │   └── server.js
    ├── scripts/mongodb.js            Local MongoDB start and stop helper
    ├── .env.example
    └── package.json

## Important files to study

Start with client/src/App.jsx and client/src/components/AdminLogin.jsx. Follow a sign-in request through client/src/services/api.js, server/src/controllers/auth.js and server/src/middleware/auth.js. For a booking, follow BookingForm.jsx through the API helper, booking controller, storage service and Mongoose model. server/src/services/dispatch.js contains the recommendation rules.
