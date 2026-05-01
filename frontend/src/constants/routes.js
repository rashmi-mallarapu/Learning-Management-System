// Constants: Routes
export const ROUTES = {
    // Auth
    LOGIN: '/login',
    SIGNUP: '/signup',

    // Learner
    LEARNER_DASHBOARD: '/learner/dashboard',
    LEARNER_BROWSE: '/learner/courses',
    LEARNER_COURSE_DETAIL: '/learner/courses/:courseId',
    LEARNER_MY_LEARNING: '/learner/my-learning',
    LEARNER_LESSON: '/learner/courses/:courseId/lessons/:lessonId',
    LEARNER_ASSIGNMENTS: '/learner/assignments',
    LEARNER_QUIZZES: '/learner/quizzes',
    LEARNER_GRADES: '/learner/grades',
    LEARNER_PROGRESS: '/learner/progress',
    LEARNER_CERTIFICATES: '/learner/certificates',
    LEARNER_ANNOUNCEMENTS: '/learner/announcements',
    LEARNER_REPORTS: '/learner/reports',
    LEARNER_PROFILE: '/learner/profile',
    LEARNER_MESSAGES: '/learner/messages',
    LEARNER_LEADERBOARD: '/learner/leaderboard',
    LEARNER_QUIZ_ATTEMPT: '/learner/quiz/:id/attempt',
    LEARNER_QUIZ_RESULTS: '/learner/quiz/:id/results',
    CERTIFICATE_VERIFY: '/certificates/verify/:certNumber',

    // Instructor
    INSTRUCTOR_DASHBOARD: '/instructor/dashboard',
    INSTRUCTOR_COURSES: '/instructor/courses',
    INSTRUCTOR_COURSE_CREATE: '/instructor/courses/create',
    INSTRUCTOR_COURSE_EDIT: '/instructor/courses/:courseId/edit',
    INSTRUCTOR_ASSIGNMENTS: '/instructor/assignments',
    INSTRUCTOR_SUBMISSIONS: '/instructor/submissions',
    INSTRUCTOR_GRADING: '/instructor/grading',
    INSTRUCTOR_ANALYTICS: '/instructor/analytics',
    INSTRUCTOR_ANNOUNCEMENTS: '/instructor/announcements',
    INSTRUCTOR_REPORTS: '/instructor/reports',
    INSTRUCTOR_PROFILE: '/instructor/profile',
    INSTRUCTOR_MESSAGES: '/instructor/messages',
    INSTRUCTOR_ACCESS_REQUESTS: '/instructor/access-requests',
    INSTRUCTOR_QUIZZES: '/instructor/quizzes',
    INSTRUCTOR_QUIZ_CREATE: '/instructor/quiz/create',
    INSTRUCTOR_QUIZ_EDIT: '/instructor/quiz/:id/edit',
    INSTRUCTOR_QUIZ_ANALYTICS: '/instructor/quiz/:id/analytics',

    // Admin
    ADMIN_DASHBOARD: '/admin/dashboard',
    ADMIN_USERS: '/admin/users',
    ADMIN_ROLES: '/admin/roles',
    ADMIN_COURSES: '/admin/courses',
    ADMIN_ANALYTICS: '/admin/analytics',
    ADMIN_REPORTS: '/admin/reports',
    ADMIN_SETTINGS: '/admin/settings',
    ADMIN_ANNOUNCEMENTS: '/admin/announcements',
    ADMIN_LOGS: '/admin/logs',
    ADMIN_MESSAGES: '/admin/messages',
    ADMIN_PROFILE: '/admin/profile',

    // Shared
    NOTIFICATIONS: '/notifications',
    MESSAGES: '/messages',

    // Error
    NOT_FOUND: '/404',
    FORBIDDEN: '/403',
};
