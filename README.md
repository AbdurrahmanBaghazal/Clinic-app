# Praxis Form App

A TypeScript + React form management MVP inspired by the referenced Praxis form workflow.

## Stack

- React + TypeScript + Vite client
- Express + TypeScript API
- MongoDB with Mongoose
- Docker Compose for MongoDB, API, and client

## Run With Docker

```bash
docker compose up --build
```

Open:

- Client: `http://localhost:5173`
- API: `http://localhost:4000/api/health`
- MongoDB: `mongodb://localhost:27017/praxis-form`

Demo login:

```text
username: admin
password: admin123
```

## Local Development

Install dependencies separately:

```bash
cd server
npm install
npm run dev
```

```bash
cd client
npm install
npm run dev
```

For local development without Docker, set `MONGODB_URI` in `server/.env`.

## Features

- Admin login with JWT authentication
- Form dashboard
- Create, edit, publish, archive, and delete forms
- Dynamic fields: text, textarea, email, phone, number, date, checkbox, select, radio
- Public form filling route
- Submission storage and review
- Seeded sample patient intake form and admin user

