# AI Mock Interview Platform

A full-stack web application that simulates a behavioral job interview using AI voice conversation. Instead of asking predefined questions, the AI listens to the candidate's answers, understands the conversation, asks follow-up questions when needed, and generates a feedback report at the end.

This project was built as part of the Mentorque assignment.

---

## Features

- User Signup and Login (JWT Authentication)
- Behavioral Interview
- AI Voice Conversation using Vapi
- Dynamic follow-up questions based on previous answers
- Conversation history stored in PostgreSQL
- AI-generated interview feedback
- Previous interview history
- Responsive UI built with Tailwind CSS

---

## Tech Stack

### Frontend

- React
- Vite
- React Router
- Axios
- Tailwind CSS

### Backend

- Node.js
- Express.js
- Prisma ORM
- PostgreSQL
- JWT Authentication
- bcrypt

### AI & Voice

- Gemini 2.5 Flash
- Vapi AI

---

## Project Structure

```
interview-platform/

client/
server/

```

- **client** → React frontend
- **server** → Express backend with Prisma and PostgreSQL

---

## Installation

### 1. Clone the repository

```bash
git clone <repository-url>
```

### 2. Go inside the project

```bash
cd interview-platform
```

### 3. Install dependencies

Backend

```bash
cd server
npm install
```

Frontend

```bash
cd ../client
npm install
```

---

## Environment Variables

### Backend (.env)

```
DATABASE_URL=your_postgresql_database_url

JWT_SECRET=your_jwt_secret

GEMINI_API_KEY=your_gemini_api_key

VAPI_API_KEY=your_vapi_private_key
VAPI_WEBHOOK_SECRET=your_vapi_webhook_secret

PORT=5000
CLIENT_URL=http://localhost:5173
```

### Frontend (.env)

```
VITE_API_URL=http://localhost:5000/api

VITE_VAPI_PUBLIC_KEY=your_vapi_public_key
VITE_VAPI_ASSISTANT_ID=your_vapi_assistant_id
```

---

## Database Setup

Generate Prisma Client

```bash
npx prisma generate
```

Run migrations

```bash
npx prisma migrate dev
```

---

## Run the Project

### Start Backend

```bash
cd server

npm run dev
```

### Start Frontend

```bash
cd client

npm run dev
```

Frontend

```
http://localhost:5173
```

Backend

```
http://localhost:5000
```

---

## How It Works

1. User signs up and logs in.
2. A new interview session is created.
3. The user starts a voice conversation.
4. Vapi handles speech recognition and voice output.
5. Every user response is stored in the database.
6. The backend sends the complete conversation history to Gemini.
7. Gemini generates the next interview question based on the previous discussion.
8. After ending the interview, Gemini evaluates the complete transcript and generates a feedback report.
9. The feedback is saved and can be viewed later from the dashboard.

---

## Screens

- Login
- Signup
- Dashboard
- Interview
- Feedback Report

---

## Future Improvements

- Different interview types
- Resume upload
- More detailed analytics
- Admin dashboard
- Export feedback as PDF

---

## Author

Shreya Verma
