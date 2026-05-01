# LMS Frontend

Frontend client for the Learning Management System (LMS), built with React + Vite + Tailwind.

## Current Status

- Role-based routing fully implemented for learner, instructor, and admin flows
- Redux store and feature slices fully integrated with backend APIs
- All data is fetched from the backend database in real-time
- Video/Audio calling integrated with Agora RTC platform
- Full messaging and communication features enabled

## Run Locally

```bash
npm install
npm run dev
```

## Scripts

- `npm run dev` - start development server
- `npm run build` - production build
- `npm run preview` - preview production build
- `npm run lint` - run ESLint

## Frontend Architecture

- `src/main.jsx` bootstraps app
- `src/App.jsx` provides Redux + Router wrappers
- `src/AppRouter.jsx` defines role-based route trees
- `src/layouts/*` contains role-specific shell layouts
- `src/pages/*` contains page-level modules
- `src/features/*` contains Redux slices/state
- `src/components/*` contains shared and reusable UI components
- `src/services/*` contains API service modules for backend communication

## Deployment Notes

This frontend is production-ready. All data is sourced from the backend API. Ensure backend services are properly configured before deploying.

## 🎥 Project Demo & Explanation

- 📌 [Project Demo Video](https://drive.google.com/file/d/1cvgGvh2W8ruLwo6u34W9li8_WTQRsi-l/view?usp=drivesdk)
- 📌 [Code Explanation Video](https://drive.google.com/file/d/13i2411MVIYXrxChMWAEhHh3kNK4Y74ct/view?usp=drivesdk)
