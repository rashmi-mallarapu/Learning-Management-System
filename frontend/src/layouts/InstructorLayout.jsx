import { useState, useEffect } from 'react';
import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
    GraduationCap, Home, BookOpen, FileText, BarChart2,
    Bell, MessageSquare, User, Menu, Plus, Users
} from 'lucide-react';
import { motion } from 'framer-motion';
import { logout } from '../features/auth/authSlice';
import { ROUTES } from '../constants/routes';
import Avatar from '../components/ui/Avatar';
import NotificationCenter from '../components/ui/NotificationCenter';
import clsx from 'clsx';
import { useNotifications } from '../hooks/useNotifications';

const sidebarSections = [
    {
        title: 'Overview',
        items: [
            { label: 'Dashboard', icon: Home, to: ROUTES.INSTRUCTOR_DASHBOARD },
        ]
    },
    {
        title: 'Course Management',
        items: [
            { label: 'My Courses', icon: BookOpen, to: ROUTES.INSTRUCTOR_COURSES },
            { label: 'Assignments', icon: FileText, to: ROUTES.INSTRUCTOR_ASSIGNMENTS },
            { label: 'Submissions', icon: FileText, to: ROUTES.INSTRUCTOR_SUBMISSIONS },
            { label: 'Quizzes', icon: FileText, to: ROUTES.INSTRUCTOR_QUIZZES },
            { label: 'Grading', icon: FileText, to: ROUTES.INSTRUCTOR_GRADING },
        ]
    },
    {
        title: 'Communication',
        items: [
            { label: 'Messages', icon: MessageSquare, to: ROUTES.INSTRUCTOR_MESSAGES },
            { label: 'Access Requests', icon: Users, to: ROUTES.INSTRUCTOR_ACCESS_REQUESTS },
            { label: 'Announcements', icon: Bell, to: ROUTES.INSTRUCTOR_ANNOUNCEMENTS },
            { label: 'Report Issue', icon: FileText, to: ROUTES.INSTRUCTOR_REPORTS },
        ]
    },
    {
        title: 'Insights & Account',
        items: [
            { label: 'Analytics', icon: BarChart2, to: ROUTES.INSTRUCTOR_ANALYTICS },
            { label: 'Profile', icon: User, to: ROUTES.INSTRUCTOR_PROFILE },
        ]
    }
];

export default function InstructorLayout() {
    const [collapsed, setCollapsed] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const { notifications, handleMarkRead, handleMarkAllRead } = useNotifications();

    const { user } = useSelector(s => s.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    useEffect(() => {
        const handler = () => { if (window.innerWidth < 768) setSidebarOpen(false); };
        handler();
        window.addEventListener('resize', handler);
        return () => window.removeEventListener('resize', handler);
    }, []);

    const handleLogout = () => { dispatch(logout()); navigate(ROUTES.LOGIN); };

    return (
        <div className="flex h-screen overflow-hidden bg-slate-50 font-sans">
            {sidebarOpen && (
                <div className="fixed inset-0 z-20 bg-slate-900/40 backdrop-blur-sm md:hidden" onClick={() => setSidebarOpen(false)} />
            )}

            <aside className={clsx(
                'fixed md:relative z-30 h-full bg-white border-r border-slate-200 flex flex-col transition-all duration-300 ease-in-out flex-shrink-0',
                sidebarOpen ? (collapsed ? 'w-20' : 'w-64') : 'w-0 md:w-20'
            )}>
                <div className={clsx('flex items-center gap-3 px-8 py-8 border-b border-slate-100 flex-shrink-0', collapsed && 'justify-center px-2')}>
                    <div className="w-10 h-10 bg-[#6d28d9] rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-100 relative z-10">
                        <GraduationCap className="w-6 h-6 text-white" />
                    </div>
                    {!collapsed && (
                        <span className="font-black text-slate-900 text-xl tracking-tighter relative z-10 italic">
                            Edu<span className="text-[#6d28d9]">Instructor</span>
                        </span>
                    )}
                </div>

                {!collapsed && (
                    <div className="p-4 border-b border-slate-100">
                        <NavLink to={ROUTES.INSTRUCTOR_COURSE_CREATE}>
                            <button className="w-full bg-[#6d28d9] hover:bg-purple-800 text-white rounded-xl py-3 px-4 flex items-center justify-center gap-2 font-bold text-xs shadow-sm transition-all active:scale-95 group tracking-wide">
                                <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                                <span>CREATE NEW</span>
                            </button>
                        </NavLink>
                    </div>
                )}

                <nav className="flex-1 overflow-y-auto px-4 custom-scrollbar space-y-6 py-6 border-transparent bg-white w-full">
                    {sidebarSections.map((section, idx) => (
                        <div key={idx} className="space-y-1">
                            {!collapsed && (
                                <p className="px-3 text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3 ml-1 mt-6 first:mt-0">
                                    {section.title}
                                </p>
                            )}
                            {section.items.map(item => (
                                <NavLink key={item.to} to={item.to} className={({ isActive }) =>
                                    clsx('relative flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors duration-200 group',
                                        isActive
                                            ? 'bg-[#f3f0ff] text-[#6d28d9] shadow-sm'
                                            : 'text-gray-700 hover:bg-[#f1f5f9] hover:text-[#6d28d9]',
                                        collapsed && 'justify-center'
                                    )
                                }>
                                    {({ isActive }) => (
                                        <>
                                            {isActive && (
                                                <motion.div
                                                    layoutId="themeInstructorActive"
                                                    className="absolute left-0 top-[10%] bottom-[10%] w-1 bg-gradient-to-b from-[#6d28d9] to-purple-400 rounded-r-lg"
                                                    initial={false}
                                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                                />
                                            )}
                                            <item.icon className={clsx('w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110')} />
                                            {!collapsed && <span className="tracking-wide">{item.label}</span>}
                                        </>
                                    )}
                                </NavLink>
                            ))}
                        </div>
                    ))}
                </nav>
            </aside>

            <div className="flex-1 flex flex-col overflow-hidden min-w-0">
                <header className="h-16 bg-white border-b border-slate-200 flex items-center gap-4 px-6 flex-shrink-0 z-10">
                    <button
                        onClick={() => {
                            if (window.innerWidth >= 768) setCollapsed(!collapsed);
                            else setSidebarOpen(!sidebarOpen);
                        }}
                        className="p-2 rounded-xl border border-slate-100 hover:bg-slate-50 text-slate-400 hover:text-[#6d28d9] transition-all shadow-sm active:scale-95"
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                    <div className="flex-1" />

                    <div className="flex items-center gap-2">
                        <button onClick={() => setNotificationsOpen(true)} className="relative p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 text-slate-400 hover:text-[#6d28d9] transition-all group">
                            <Bell className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                            {notifications.some(n => n.unread) && (
                                <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full animate-pulse" />
                            )}
                        </button>
                        <button onClick={() => navigate(ROUTES.INSTRUCTOR_MESSAGES)} className="p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 text-slate-400 hover:text-[#6d28d9] transition-all group">
                            <MessageSquare className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        </button>

                        <div className="flex items-center gap-4 pl-4 border-l border-slate-100 ml-2">
                            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate(ROUTES.INSTRUCTOR_PROFILE)}>
                                <div className="text-right hidden lg:block">
                                    <p className="text-sm font-black text-slate-900 leading-none group-hover:text-[#6d28d9] transition-colors">{user?.name || 'Dr. Sarah'}</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Instructor</p>
                                </div>
                                <div className="relative">
                                    <Avatar name={user?.name || 'Dr. Sarah'} src={user?.avatar} size="md" className="ring-2 ring-slate-50 shadow-sm group-hover:ring-purple-200 transition-all" />
                                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-violet-500 border-2 border-white rounded-full animate-pulse" />
                                </div>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="px-4 py-2 text-sm font-bold text-rose-500 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer tracking-tight"
                            >
                                Sign Out
                            </button>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto bg-slate-50/50 custom-scrollbar relative">
                    <div className="p-6 md:p-8 max-w-[1600px] mx-auto min-h-full">
                        <Outlet />
                    </div>
                </main>
            </div>

            <NotificationCenter
                isOpen={notificationsOpen}
                onClose={() => setNotificationsOpen(false)}
                notifications={notifications}
                onMarkRead={handleMarkRead}
                onMarkAllRead={handleMarkAllRead}
            />
        </div>
    );
}
