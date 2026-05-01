import { Routes, Route, Navigate } from 'react-router-dom';
import { ROLES } from './constants/roles';
import { ROUTES } from './constants/routes';
import ProtectedRoute from './components/ProtectedRoute';

import LandingPage from './pages/common/LandingPage';

// Layouts
import LearnerLayout from './layouts/LearnerLayout';
import InstructorLayout from './layouts/InstructorLayout';
import AdminLayout from './layouts/AdminLayout';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';

// Learner Pages
import LearnerDashboard from './pages/learner/LearnerDashboard';
import CourseCatalog from './pages/learner/CourseCatalog';
import CourseDetail from './pages/learner/CourseDetail';
import MyLearning from './pages/learner/MyLearning';
import LessonPlayer from './pages/learner/LessonPlayer';
import AssignmentsPage from './pages/learner/AssignmentsPage';
import LearnerQuizzes from './pages/learner/LearnerQuizzes';
import QuizAttempt from './pages/learner/QuizAttempt';
import QuizResults from './pages/learner/QuizResults';
import LeaderboardPage from './pages/learner/LeaderboardPage';
import GradesPage from './pages/learner/GradesPage';
import ProgressDashboard from './pages/learner/ProgressDashboard';
import CertificatesPage from './pages/learner/CertificatesPage';
import CertificateVerifyPage from './pages/learner/CertificateVerifyPage';
import CommunityPage from './pages/learner/CommunityPage';
import DiscussionDetail from './pages/learner/DiscussionDetail';

// Instructor Pages
import InstructorDashboard from './pages/instructor/InstructorDashboard';
import CourseManagement from './pages/instructor/CourseManagement';
import CreateCourse from './pages/instructor/CreateCourse';
import SubmissionsReview from './pages/instructor/SubmissionsReview';
import CourseAnalytics from './pages/instructor/CourseAnalytics';
import GradingWorkspace from './pages/instructor/GradingWorkspace';
import InstructorQuizzes from './pages/instructor/InstructorQuizzes';
import QuizBuilder from './pages/instructor/QuizBuilder';
import QuizAnalytics from './pages/instructor/QuizAnalytics';
import AccessRequests from './pages/instructor/AccessRequests';
import InstructorAssignmentsPage from './pages/instructor/InstructorAssignmentsPage';
// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import RoleManagement from './pages/admin/RoleManagement';
import PlatformSettings from './pages/admin/PlatformSettings';
import CourseModeration from './pages/admin/CourseModeration';
import PlatformAnalytics from './pages/admin/PlatformAnalytics';
import SystemReports from './pages/admin/SystemReports';
import SystemLogs from './pages/admin/SystemLogs';

// Common Pages
import ProfilePage from './pages/common/ProfilePage';
import AnnouncementsPage from './pages/common/AnnouncementsPage';
import MessageInbox from './pages/common/MessageInbox';

export default function AppRouter() {
    return (
        <Routes>
            {/* Auth Routes */}
            <Route path={ROUTES.LOGIN} element={<LoginPage />} />
            <Route path={ROUTES.SIGNUP} element={<SignupPage />} />
            <Route path={ROUTES.CERTIFICATE_VERIFY} element={<CertificateVerifyPage />} />

            {/* Learner Routes */}
            <Route
                path="/learner"
                element={
                    <ProtectedRoute roles={[ROLES.LEARNER]}>
                        <LearnerLayout />
                    </ProtectedRoute>
                }
            >
                <Route index element={<Navigate to={ROUTES.LEARNER_DASHBOARD} replace />} />
                <Route path="dashboard" element={<LearnerDashboard />} />
                <Route path="courses/:courseId/lessons/:lessonOrder" element={<LessonPlayer />} />
                <Route path="courses/:courseId" element={<CourseDetail />} />
                <Route path="courses" element={<CourseCatalog />} />
                <Route path="my-learning" element={<MyLearning />} />
                <Route path="assignments" element={<AssignmentsPage />} />
                <Route path="quizzes" element={<LearnerQuizzes />} />
                <Route path="quiz/:id/attempt" element={<QuizAttempt />} />
                <Route path="quiz/:id/results" element={<QuizResults />} />
                <Route path="leaderboard" element={<LeaderboardPage />} />
                <Route path="grades" element={<GradesPage />} />
                <Route path="progress" element={<ProgressDashboard />} />
                <Route path="certificates" element={<CertificatesPage />} />
                <Route path="community" element={<CommunityPage />} />
                <Route path="community/discussion/:id" element={<DiscussionDetail />} />
                <Route path="announcements" element={<AnnouncementsPage />} />
                <Route path="reports" element={<SystemReports />} />
                <Route path="messages" element={<MessageInbox />} />
                <Route path="profile" element={<ProfilePage />} />
            </Route>

            {/* Instructor Routes */}
            <Route
                path="/instructor"
                element={
                    <ProtectedRoute roles={[ROLES.INSTRUCTOR]}>
                        <InstructorLayout />
                    </ProtectedRoute>
                }
            >
                <Route index element={<Navigate to={ROUTES.INSTRUCTOR_DASHBOARD} replace />} />
                <Route path="dashboard" element={<InstructorDashboard />} />
                <Route path="courses" element={<CourseManagement />} />
                <Route path="courses/create" element={<CreateCourse />} />
                <Route path="courses/:courseId/edit" element={<CreateCourse />} />
                <Route path="assignments" element={<InstructorAssignmentsPage />} />
                <Route path="submissions" element={<SubmissionsReview />} />
                <Route path="grading" element={<GradingWorkspace />} />
                <Route path="grading/:id" element={<GradingWorkspace />} />
                <Route path="analytics" element={<CourseAnalytics />} />
                <Route path="quizzes" element={<InstructorQuizzes />} />
                <Route path="quiz/create" element={<QuizBuilder />} />
                <Route path="quiz/:id/edit" element={<QuizBuilder />} />
                <Route path="quiz/:id/analytics" element={<QuizAnalytics />} />
                <Route path="access-requests" element={<AccessRequests />} />
                <Route path="announcements" element={<AnnouncementsPage />} />
                <Route path="reports" element={<SystemReports />} />
                <Route path="messages" element={<MessageInbox />} />
                <Route path="profile" element={<ProfilePage />} />
            </Route>

            {/* Admin Routes */}
            <Route
                path="/admin"
                element={
                    <ProtectedRoute roles={[ROLES.ADMIN]}>
                        <AdminLayout />
                    </ProtectedRoute>
                }
            >
                <Route index element={<Navigate to={ROUTES.ADMIN_DASHBOARD} replace />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="users" element={<UserManagement />} />
                <Route path="roles" element={<RoleManagement />} />
                <Route path="courses" element={<CourseModeration />} />
                <Route path="analytics" element={<PlatformAnalytics />} />
                <Route path="reports" element={<SystemReports />} />
                <Route path="settings" element={<PlatformSettings />} />
                <Route path="announcements" element={<AnnouncementsPage />} />
                <Route path="logs" element={<SystemLogs />} />
                <Route path="messages" element={<MessageInbox />} />
                <Route path="profile" element={<ProfilePage />} />
            </Route>

            {/* Public landing */}
            <Route path="/" element={<LandingPage />} />
            <Route path="*" element={<LandingPage />} />
        </Routes>
    );
}
