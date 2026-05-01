import { useState, useEffect } from 'react';
import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
    Home, Search, BookOpen, FileText, Award, BarChart2,
    Megaphone, MessageSquare, Users, User, Menu, Bell,
    GraduationCap,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { logout } from '../features/auth/authSlice';
import { ROUTES } from '../constants/routes';
import Avatar from '../components/ui/Avatar';
import clsx from 'clsx';
import NotificationCenter from '../components/ui/NotificationCenter';
import { fetchCourses } from '../services/learnerApi';
import { useNotifications } from '../hooks/useNotifications';

const sidebarSections = [
    {
        title: 'Overview',
        items: [
            { label: 'Dashboard', icon: Home, to: ROUTES.LEARNER_DASHBOARD },
        ]
    },
    {
        title: 'Course Management',
        items: [
            { label: 'My Courses', icon: BookOpen, to: ROUTES.LEARNER_MY_LEARNING },
            { label: 'Browse Courses', icon: Search, to: ROUTES.LEARNER_BROWSE },
            { label: 'Assignments', icon: FileText, to: ROUTES.LEARNER_ASSIGNMENTS },
            { label: 'Quizzes', icon: FileText, to: ROUTES.LEARNER_QUIZZES },
            { label: 'Certificates', icon: Award, to: ROUTES.LEARNER_CERTIFICATES },
        ]
    },
    {
        title: 'Communication',
        items: [
            { label: 'Messages', icon: MessageSquare, to: ROUTES.LEARNER_MESSAGES },
            { label: 'Announcements', icon: Megaphone, to: ROUTES.LEARNER_ANNOUNCEMENTS },
            { label: 'Report Issue', icon: FileText, to: ROUTES.LEARNER_REPORTS },
            { label: 'Community', icon: Users, to: '/learner/community' },
        ]
    },
    {
        title: 'Insights & Account',
        items: [
            { label: 'Leaderboard', icon: BarChart2, to: ROUTES.LEARNER_LEADERBOARD || '#' },
            { label: 'Profile', icon: User, to: ROUTES.LEARNER_PROFILE },
        ]
    }
];

export default function LearnerLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [collapsed, setCollapsed] = useState(false);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const { user } = useSelector(s => s.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const { notifications, handleMarkRead, handleMarkAllRead } = useNotifications();

    useEffect(() => {
        const query = searchQuery.trim();

        if (!query) {
            setSearchResults([]);
            return;
        }

        let isMounted = true;
        const runSearch = async () => {
            try {
                const results = await fetchCourses({ search: query });
                if (!isMounted) return;
                setSearchResults((Array.isArray(results) ? results : []).slice(0, 5));
            } catch {
                if (isMounted) setSearchResults([]);
            }
        };

        runSearch();

        return () => {
            isMounted = false;
        };
    }, [searchQuery]);

    const handleSearch = (e) => {
        if (e.key === 'Enter' && searchQuery.trim()) {
            navigate(`${ROUTES.LEARNER_BROWSE}?q=${encodeURIComponent(searchQuery.trim())}`);
            setSearchQuery('');
            setIsSearchFocused(false);
        }
    };

    useEffect(() => {
        const handler = () => { if (window.innerWidth < 1024) setSidebarOpen(false); };
        handler();
        window.addEventListener('resize', handler);
        return () => window.removeEventListener('resize', handler);
    }, []);

    const handleLogout = () => { dispatch(logout()); navigate(ROUTES.LOGIN); };

    return (
        <div className="flex h-screen overflow-hidden bg-slate-50 font-sans text-slate-900">
            {sidebarOpen && (
                <div className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
            )}

            <aside className={clsx(
                'fixed lg:relative z-50 h-full bg-white border-r border-slate-100 flex flex-col transition-all duration-300 ease-in-out flex-shrink-0',
                sidebarOpen ? (collapsed ? 'w-20' : 'w-72') : 'w-0 lg:w-20'
            )}>
                <div className={clsx('flex items-center gap-3 px-8 py-8 flex-shrink-0', collapsed && 'justify-center px-2')}>
                    <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-100">
                        <GraduationCap className="w-6 h-6 text-white" />
                    </div>
                    {!collapsed && (
                        <span className="font-black text-slate-900 text-2xl tracking-tighter italic">
                            Skillery
                        </span>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto px-4 custom-scrollbar space-y-6 py-6">
                    {sidebarSections.map((section, idx) => (
                        <div key={idx} className="space-y-1">
                            {!collapsed && (
                                <p className="px-3 text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3 ml-1 mt-6 first:mt-0">
                                    {section.title}
                                </p>
                            )}
                            {section.items.map(item => (
                                <NavLink
                                    key={item.label}
                                    to={item.to}
                                    onClick={(e) => {
                                        if (item.to === '#') {
                                            e.preventDefault();
                                        }
                                    }}
                                    className={({ isActive }) =>
                                        clsx('relative flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors duration-200 group',
                                            isActive
                                                ? 'bg-[#f3f0ff] text-[#6d28d9] shadow-sm'
                                                : 'text-gray-700 hover:bg-[#f1f5f9] hover:text-[#6d28d9]',
                                            collapsed && 'justify-center'
                                        )
                                    }
                                >
                                    {({ isActive }) => (
                                        <>
                                            {isActive && (
                                                <motion.div
                                                    layoutId="themeLearnerActive"
                                                    className="absolute left-0 top-[10%] bottom-[10%] w-1 bg-gradient-to-b from-[#6d28d9] to-purple-400 rounded-r-lg"
                                                    initial={false}
                                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                                />
                                            )}
                                            <item.icon className={clsx('w-5 h-5 transition-transform group-hover:scale-110')} />
                                            {!collapsed && <span className="tracking-wide">{item.label}</span>}
                                        </>
                                    )}
                                </NavLink>
                            ))}
                        </div>
                    ))}
                </div>
            </aside>

            <div className="flex-1 flex flex-col overflow-hidden min-w-0">
                <header className="h-16 lg:h-20 bg-white border-b border-slate-100 flex items-center justify-between px-8 flex-shrink-0 z-20">
                    <div className="flex items-center gap-6 flex-1 max-w-xl">
                        <button
                            onClick={() => {
                                if (window.innerWidth >= 768) setCollapsed(!collapsed);
                                else setSidebarOpen(!sidebarOpen);
                            }}
                            className="p-2 rounded-xl border border-slate-100 hover:bg-slate-50 text-slate-400 hover:text-[#6d28d9] transition-all shadow-sm active:scale-95"
                        >
                            <Menu className="w-5 h-5" />
                        </button>

                        <div className="relative flex-1 group hidden sm:block">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary-500 transition-colors w-5 h-5" />
                            <input
                                placeholder="Search a course..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={handleSearch}
                                onFocus={() => setIsSearchFocused(true)}
                                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:bg-white transition-all font-medium placeholder-slate-400"
                            />

                            {isSearchFocused && searchQuery.trim().length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-3 bg-white rounded-[24px] border border-slate-100 shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Search Results</span>
                                        <span className="text-[10px] font-bold text-slate-400">{searchResults.length} {searchResults.length === 1 ? 'course' : 'courses'} found</span>
                                    </div>
                                    <div className="max-h-[380px] overflow-y-auto custom-scrollbar">
                                        {searchResults.length > 0 ? (
                                            searchResults.map(course => (
                                                <div
                                                    key={course.id}
                                                    onClick={() => navigate(`/learner/courses/${course.id}`)}
                                                    className="group flex items-center gap-4 p-4 hover:bg-slate-50 cursor-pointer transition-colors"
                                                >
                                                    <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 shadow-sm border border-slate-100">
                                                        <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="text-sm font-bold text-slate-900 group-hover:text-primary-500 transition-colors truncate">{course.title}</h4>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">{course.instructorName}</span>
                                                            <span className="w-1 h-1 bg-slate-200 rounded-full" />
                                                            <span className="text-[10px] font-bold text-primary-500 bg-primary-50 px-2 py-0.5 rounded-md">{course.category}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="p-8 text-center space-y-2">
                                                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                                                    <Search className="w-6 h-6" />
                                                </div>
                                                <p className="text-sm font-bold text-slate-600">No courses found</p>
                                                <p className="text-xs text-slate-400">Try a different keyword or browse our full catalog.</p>
                                            </div>
                                        )}
                                    </div>
                                    {searchResults.length > 0 && (
                                        <button
                                            onClick={() => navigate(`${ROUTES.LEARNER_BROWSE}?q=${encodeURIComponent(searchQuery)}`)}
                                            className="w-full py-4 text-center text-xs font-black uppercase text-primary-500 bg-primary-50/50 hover:bg-primary-50 transition-colors border-t border-slate-100 tracking-widest"
                                        >
                                            View all {searchResults.length} results
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => navigate(ROUTES.LEARNER_MESSAGES)}
                            className="relative text-slate-400 hover:text-indigo-600 transition-colors hidden md:block"
                        >
                            <MessageSquare className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setNotificationsOpen(true)}
                            className="relative p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 text-slate-400 hover:text-[#6d28d9] transition-all group"
                        >
                            <Bell className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                            {notifications.some(n => n.unread) && (
                                <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white animate-pulse" />
                            )}
                        </button>

                        <div className="flex items-center gap-4 pl-4 border-l border-slate-100">
                            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(ROUTES.LEARNER_PROFILE)}>
                                <div className="text-right hidden lg:block">
                                    <p className="text-sm font-black text-slate-900 leading-none hover:text-primary-600 transition-colors">{user?.name || 'Budiarti R'}</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Learner</p>
                                </div>
                                <Avatar name={user?.name || 'Budiarti R'} src={user?.avatar} size="md" className="ring-2 ring-slate-50 shadow-sm" />
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

                <main className="flex-1 overflow-y-auto bg-slate-50 custom-scrollbar">
                    <div className="p-8 max-w-[1600px] mx-auto min-h-full">
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
