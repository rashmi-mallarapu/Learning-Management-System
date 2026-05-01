# Learning Management System Backend

Production-ready Node.js + Express + MongoDB backend for an enterprise LMS.

## Tech Stack

- Node.js
- Express
- MongoDB with Mongoose
- JWT authentication
- Google sign-in with ID token verification
- Bcrypt password hashing
- Multer file uploads
- OTP email verification via SMTP

## Features

- User registration and login
- Email OTP verification for registration
- Forgot password and reset password via email link
- Role-based authorization for admin, instructor, learner
- Course management
- Enrollment with duplicate prevention
- Lesson uploads for video and PDF files
- Assignment creation and submission uploads
- Submission grading
- Progress tracking
- Quiz creation and submission scoring
- Communication system for announcements and messages

## Project Structure

- config/
- middleware/
- modules/
- routes/
- uploads/
- utils/

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env` file from `.env.example`.

3. Start MongoDB locally or update `MONGODB_URI`.

4. Run the server:

   ```bash
   npm run dev
   ```

## API Base Path

All routes are mounted under `/api`.

- `/api/auth`
- `/api/users`
- `/api/courses`
- `/api/enrollments`
- `/api/lessons`
- `/api/assignments`
- `/api/submissions`
- `/api/progress`
- `/api/quizzes`
- `/api/communication`

## Notes

- Lessons and submissions use Multer and save files under `uploads/`.
- Authentication requires a Bearer token in the `Authorization` header.