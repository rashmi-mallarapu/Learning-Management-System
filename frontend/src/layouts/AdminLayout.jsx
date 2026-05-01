import { useState, useEffect } from 'react';
import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
    GraduationCap, Home, Users, BookOpen, BarChart2,
    Megaphone, FileText, Activity, Settings, ShieldCheck,
    Search, Bell, LogOut, Menu, User, MessageSquare
} from 'lucide-react';
import { motion } from 'framer-motion';
import { logout } from '../features/auth/authSlice';
import { ROUTES } from '../constants/routes';
import Avatar from '../components/ui/Avatar';
import NotificationCenter from '../components/ui/NotificationCenter';
import clsx from 'clsx';

const sidebarSections = [
    {
        title: 'Overview',
        items: [
            { label: 'Dashboard', icon: Home, to: ROUTES.ADMIN_DASHBOARD },
        ]
    },
    {
        title: 'System Management',
        items: [
            { label: 'Users', icon: Users, to: ROUTES.ADMIN_USERS },
            { label: 'Roles', icon: ShieldCheck, to: ROUTES.ADMIN_ROLES },
            { label: 'Courses', icon: BookOpen, to: ROUTES.ADMIN_COURSES },
        ]
    },
    {
        title: 'Communication',
        items: [
            { label: 'Announcements', icon: Megaphone, to: ROUTES.ADMIN_ANNOUNCEMENTS },
            { label: 'Messages', icon: MessageSquare, to: '/admin/messages' },
        ]
    },
    {
        title: 'Insights & Account',
        items: [
            { label: 'Analytics', icon: BarChart2, to: ROUTES.ADMIN_ANALYTICS },
            { label: 'Reports', icon: FileText, to: ROUTES.ADMIN_REPORTS },
            { label: 'Activity Logs', icon: Activity, to: ROUTES.ADMIN_LOGS },
            { label: 'Settings', icon: Settings, to: ROUTES.ADMIN_SETTINGS },
            { label: 'Profile', icon: User, to: '/admin/profile' },
        ]
    }
];

export default function AdminLayout() {
    const [collapsed, setCollapsed] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [searchOpen, setSearchOpen] = useState(false);

    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [notifications, setNotifications] = useState([
        { id: 1, type: 'platform', title: 'Server Spikes', message: 'Current CCU counts reached 50K thresholds.', time: '12 mins ago', unread: true, color: 'amber', icon: Activity },
        { id: 2, type: 'enrollment', title: 'Platform Onboarding', message: 'Batch of 100+ Enterprise clients verified.', time: '2 hrs ago', unread: true, color: 'blue', icon: Users }
    ]);

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

            {/* Sidebar */}
            <aside className={clsx(
                'fixed md:relative z-30 h-full bg-white border-r border-slate-200 flex flex-col transition-all duration-300 ease-in-out flex-shrink-0',
                sidebarOpen ? (collapsed ? 'w-20' : 'w-64') : 'w-0 md:w-20'
            )}>
                {/* Brand Logo */}
                <div className={clsx('flex items-center gap-3 px-8 py-8 border-b border-slate-100 flex-shrink-0', collapsed && 'justify-center px-2')}>
                    <div className="w-10 h-10 bg-[#6d28d9] rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-100 relative z-10">
                        <GraduationCap className="w-6 h-6 text-white" />
                    </div>
                    {!collapsed && (
                        <span className="font-black text-slate-900 text-xl tracking-tighter relative z-10 italic">
                            Edu<span className="text-[#6d28d9]">Admin</span>
                        </span>
                    )}
                </div>

                <nav className="flex-1 overflow-y-auto px-4 custom-scrollbar space-y-6 py-6 border-transparent bg-white w-full">
                    {sidebarSections.map((section, idx) => (
                        <div key={idx} className="space-y-1">
                            {!collapsed && (
                                <p className="px-3 text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3 ml-1 mt-6 first:mt-0">
                                    {section.title}
                                </p>
                            )}
                            {section.items.map(item => (
                                <NavLink key={item.label || item.to} to={item.to} className={({ isActive }) =>
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
                                                    layoutId="themeAdminActive"
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

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden min-w-0 bg-slate-50">
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

                    <div className="hidden md:flex flex-1 max-w-lg relative group">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                            <Search className="text-slate-300 group-focus-within:text-[#6d28d9] transition-colors w-5 h-5" />
                            <span className="text-[10px] font-black text-slate-300 border border-slate-200 px-1.5 py-0.5 rounded uppercase">Cmd+K</span>
                        </div>
                        <input
                            placeholder="Search entire platform..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-24 pr-4 py-2.5 text-xs focus:outline-none focus:ring-4 focus:ring-purple-50 focus:border-[#6d28d9] focus:bg-white transition-all font-black transition-colors"
                            onFocus={() => setSearchOpen(true)}
                        />
                    </div>

                    <div className="flex-1 md:hidden" />

                    <div className="flex items-center gap-2 ml-auto">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-50 text-[#6d28d9] text-[10px] font-black uppercase tracking-widest border border-purple-100 mr-2">
                            <span className="w-1.5 h-1.5 bg-[#6d28d9] rounded-full animate-pulse" />
                            Live System
                        </div>
                        <button onClick={() => setNotificationsOpen(true)} className="relative p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 text-slate-400 hover:text-[#6d28d9] transition-all">
                            <Bell className="w-5 h-5" />
                            {notifications.some(n => n.unread) && (
                                <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white animate-pulse" />
                            )}
                        </button>
                        <div className="w-px h-6 bg-slate-200 mx-1" />

                        <div className="flex items-center gap-4 pl-2">
                            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate(ROUTES.ADMIN_SETTINGS)}>
                                <div className="text-right hidden lg:block">
                                    <p className="text-sm font-black text-slate-900 leading-none group-hover:text-[#6d28d9] transition-colors">{user?.name || 'Administrator'}</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Root Admin</p>
                                </div>
                                <Avatar name={user?.name || 'Administrator'} src={user?.avatar} size="md" className="ring-2 ring-slate-50 shadow-sm" />
                            </div>
                            <button onClick={handleLogout} className="p-2.5 rounded-xl border border-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-all font-bold text-xs ml-2 uppercase">
                                Sign Out
                            </button>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto bg-slate-50/50 custom-scrollbar">
                    <div className="p-6 md:p-8 max-w-[1600px] mx-auto min-h-full">
                        <Outlet />
                    </div>
                </main>
            </div>

            {/* Notification Center */}
            <NotificationCenter
                isOpen={notificationsOpen}
                onClose={() => setNotificationsOpen(false)}
                notifications={notifications}
                setNotifications={setNotifications}
            />

            {/* Spotlight Overlay Mockup */}
            {searchOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6" onClick={() => setSearchOpen(false)}>
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" />
                    <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-white/20 animate-scale relative z-10 overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-slate-100">
                            <div className="flex items-center gap-4">
                                <Search className="w-6 h-6 text-slate-300" />
                                <input autoFocus placeholder="Type a command or search..." className="flex-1 bg-transparent border-none text-lg font-bold text-slate-900 placeholder-slate-300 focus:outline-none" />
                                <span className="text-xs font-black text-slate-400 uppercase tracking-widest border border-slate-200 px-3 py-1 rounded-xl">Esc</span>
                            </div>
                        </div>
                        <div className="p-4 max-h-[400px] overflow-y-auto">
                            <p className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Instant Actions</p>
                            {[
                                { l: 'Create New User', i: Users, k: 'U' },
                                { l: 'Global Platform Settings', i: Settings, k: 'S' },
                                { l: 'System Audit Logs', i: Activity, k: 'L' },
                            ].map(act => (
                                <button key={act.l} className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl hover:bg-slate-50 transition-colors group">
                                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center group-hover:bg-[#6d28d9] group-hover:text-white transition-colors">
                                        <act.i className="w-5 h-5" />
                                    </div>
                                    <span className="font-bold text-slate-700 flex-1 text-left">{act.l}</span>
                                    <span className="text-[10px] font-black text-slate-300">{act.k}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
