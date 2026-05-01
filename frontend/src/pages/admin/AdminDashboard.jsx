import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    HiAcademicCap,
    HiChartBar,
    HiCollection,
    HiShieldCheck,
    HiSparkles,
    HiTrendingUp,
    HiUserGroup,
    HiUsers,
} from 'react-icons/hi';

import { ROUTES } from '../../constants/routes';
import { ROLES } from '../../constants/roles';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { fetchAdminCourses, fetchAdminUsers } from '../../services/learnerApi';

const formatDate = (value) =>
    value
        ? new Date(value).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        })
        : 'Recently';

export default function AdminDashboard() {
    const [users, setUsers] = useState([]);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let active = true;

        Promise.all([fetchAdminUsers(), fetchAdminCourses()])
            .then(([userData, courseData]) => {
                if (!active) return;
                setUsers(Array.isArray(userData) ? userData : []);
                setCourses(Array.isArray(courseData) ? courseData : []);
                setError('');
            })
            .catch((err) => {
                if (!active) return;
                setError(err.message || 'Failed to load admin dashboard');
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => {
            active = false;
        };
    }, []);

    const stats = useMemo(() => {
        const learners = users.filter((user) => user.role === ROLES.LEARNER);
        const instructors = users.filter((user) => user.role === ROLES.INSTRUCTOR);
        const admins = users.filter((user) => user.role === ROLES.ADMIN);
        const publishedCourses = courses.filter((course) => course.status === 'published');
        const draftCourses = courses.filter((course) => course.status === 'draft');
        const archivedCourses = courses.filter((course) => course.status === 'archived');
        const totalEnrollments = courses.reduce((sum, course) => sum + (course.enrolledCount || 0), 0);
        const avgRating = courses.length
            ? (courses.reduce((sum, course) => sum + (course.rating || 0), 0) / courses.length).toFixed(1)
            : '0.0';

        return {
            totalUsers: users.length,
            learners: learners.length,
            instructors: instructors.length,
            admins: admins.length,
            totalCourses: courses.length,
            publishedCourses: publishedCourses.length,
            draftCourses: draftCourses.length,
            archivedCourses: archivedCourses.length,
            totalEnrollments,
            avgRating,
            newestUsers: [...users].slice(0, 5),
            newestCourses: [...courses].slice(0, 5),
        };
    }, [courses, users]);

    const spotlightPeople = useMemo(() => {
        const instructors = users.filter((user) => user.role === ROLES.INSTRUCTOR).slice(0, 3);
        const learners = users.filter((user) => user.role === ROLES.LEARNER).slice(0, 3);
        return [...instructors, ...learners].slice(0, 6);
    }, [users]);

    return (
        <div className="space-y-8">
            <section className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-white to-emerald-50" />
                <div className="relative z-10 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-8">
                    <div className="max-w-2xl space-y-4">
                        <Badge color="violet" className="font-bold uppercase tracking-[0.2em] text-[10px]">
                            Platform Control
                        </Badge>
                        <div>
                            <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
                                Admin view is now connected to live users, roles, and course activity.
                            </h1>
                            <p className="text-slate-600 mt-3 max-w-xl">
                                Monitor instructors and learners, adjust roles, and moderate catalog activity from the existing admin workspace.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <Link to={ROUTES.ADMIN_USERS}>
                                <Button className="bg-violet-600 hover:bg-violet-700 text-white border-none">
                                    Manage Users
                                </Button>
                            </Link>
                            <Link to={ROUTES.ADMIN_COURSES}>
                                <Button variant="outline">Review Courses</Button>
                            </Link>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 min-w-[280px]">
                        <MetricCard icon={HiUsers} label="Platform Users" value={stats.totalUsers} tone="violet" />
                        <MetricCard icon={HiCollection} label="Courses" value={stats.totalCourses} tone="emerald" />
                        <MetricCard icon={HiAcademicCap} label="Enrollments" value={stats.totalEnrollments} tone="amber" />
                        <MetricCard icon={HiTrendingUp} label="Avg Rating" value={stats.avgRating} tone="blue" />
                    </div>
                </div>
            </section>

            {error && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
                    {error}
                </div>
            )}

            <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
                <StatTile icon={HiUserGroup} label="Learners" value={stats.learners} sublabel="Active platform members" />
                <StatTile icon={HiSparkles} label="Instructors" value={stats.instructors} sublabel="Teaching accounts" />
                <StatTile icon={HiShieldCheck} label="Admins" value={stats.admins} sublabel="Privileged operators" />
                <StatTile icon={HiChartBar} label="Draft Courses" value={stats.draftCourses} sublabel="Need admin attention" />
            </section>

            <section className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                <div className="xl:col-span-7 bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-xl font-black text-slate-900">Role Distribution</h2>
                            <p className="text-sm text-slate-500">Current balance across learners, instructors, and admins.</p>
                        </div>
                        <Link to={ROUTES.ADMIN_ROLES} className="text-sm font-bold text-violet-600 hover:text-violet-700">
                            Open roles
                        </Link>
                    </div>

                    <div className="space-y-5">
                        <RoleBar label="Learners" value={stats.learners} total={stats.totalUsers} color="bg-slate-700" />
                        <RoleBar label="Instructors" value={stats.instructors} total={stats.totalUsers} color="bg-violet-600" />
                        <RoleBar label="Admins" value={stats.admins} total={stats.totalUsers} color="bg-emerald-600" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                        <MiniInfo label="Published Courses" value={stats.publishedCourses} />
                        <MiniInfo label="Archived Courses" value={stats.archivedCourses} />
                        <MiniInfo label="Pending Drafts" value={stats.draftCourses} />
                    </div>
                </div>

                <div className="xl:col-span-5 bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-xl font-black text-slate-900">People Spotlight</h2>
                            <p className="text-sm text-slate-500">Recent instructors and learners available for follow-up.</p>
                        </div>
                        <Link to={ROUTES.ADMIN_USERS} className="text-sm font-bold text-violet-600 hover:text-violet-700">
                            View all
                        </Link>
                    </div>

                    <div className="space-y-4">
                        {spotlightPeople.length === 0 && (
                            <p className="text-sm text-slate-500">{loading ? 'Loading people...' : 'No users found yet.'}</p>
                        )}
                        {spotlightPeople.map((person) => (
                            <div key={person._id} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3">
                                <Avatar name={person.name} size="sm" />
                                <div className="min-w-0 flex-1">
                                    <p className="font-bold text-slate-900 truncate">{person.name}</p>
                                    <p className="text-xs text-slate-500 truncate">{person.email}</p>
                                </div>
                                <Badge color={person.role === ROLES.ADMIN ? 'emerald' : person.role === ROLES.INSTRUCTOR ? 'violet' : 'slate'}>
                                    {person.role}
                                </Badge>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <Panel
                    title="Newest Accounts"
                    subtitle="Freshly created users who may need onboarding or review."
                    link={ROUTES.ADMIN_USERS}
                    linkLabel="Open user management"
                >
                    {stats.newestUsers.length === 0 ? (
                        <EmptyState loading={loading} label="No user records available." />
                    ) : (
                        stats.newestUsers.map((user) => (
                            <RowItem
                                key={user._id}
                                title={user.name}
                                meta={user.email}
                                extra={formatDate(user.createdAt)}
                                badge={user.role}
                                badgeColor={user.role === ROLES.ADMIN ? 'emerald' : user.role === ROLES.INSTRUCTOR ? 'violet' : 'slate'}
                            />
                        ))
                    )}
                </Panel>

                <Panel
                    title="Latest Courses"
                    subtitle="Quick moderation view across recently created course records."
                    link={ROUTES.ADMIN_COURSES}
                    linkLabel="Open moderation"
                >
                    {stats.newestCourses.length === 0 ? (
                        <EmptyState loading={loading} label="No course records available." />
                    ) : (
                        stats.newestCourses.map((course) => (
                            <RowItem
                                key={course._id}
                                title={course.title}
                                meta={course.instructorId?.name || 'Unassigned instructor'}
                                extra={course.status}
                                badge={`${course.enrolledCount || 0} enrolled`}
                                badgeColor="blue"
                            />
                        ))
                    )}
                </Panel>
            </section>
        </div>
    );
}

function MetricCard({ icon: Icon, label, value, tone }) {
    const palette = {
        violet: 'from-violet-500 to-violet-700',
        emerald: 'from-emerald-500 to-emerald-700',
        amber: 'from-amber-400 to-orange-500',
        blue: 'from-sky-500 to-indigo-600',
    };

    return (
        <div className="rounded-2xl border border-white/70 bg-white/90 p-4 shadow-sm">
            <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${palette[tone]} text-white flex items-center justify-center mb-3`}>
                <Icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-black text-slate-900">{value}</p>
            <p className="text-[11px] uppercase tracking-[0.2em] font-bold text-slate-400 mt-1">{label}</p>
        </div>
    );
}

function StatTile({ icon: Icon, label, value, sublabel }) {
    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
                <div className="w-11 h-11 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                </div>
                <span className="text-2xl font-black text-slate-900">{value}</span>
            </div>
            <p className="font-bold text-slate-900">{label}</p>
            <p className="text-sm text-slate-500 mt-1">{sublabel}</p>
        </div>
    );
}

function RoleBar({ label, value, total, color }) {
    const percentage = total ? Math.round((value / total) * 100) : 0;

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
                <span className="font-bold text-slate-800">{label}</span>
                <span className="text-slate-500">{value} users</span>
            </div>
            <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                <div className={`${color} h-full rounded-full transition-all`} style={{ width: `${percentage}%` }} />
            </div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">{percentage}% of total user base</p>
        </div>
    );
}

function MiniInfo({ label, value }) {
    return (
        <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{label}</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{value}</p>
        </div>
    );
}

function Panel({ title, subtitle, link, linkLabel, children }) {
    return (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-xl font-black text-slate-900">{title}</h2>
                    <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
                </div>
                <Link to={link} className="text-sm font-bold text-violet-600 hover:text-violet-700">
                    {linkLabel}
                </Link>
            </div>
            <div className="space-y-3">{children}</div>
        </div>
    );
}

function RowItem({ title, meta, extra, badge, badgeColor }) {
    return (
        <div className="flex items-center gap-3 rounded-2xl border border-slate-100 px-4 py-3">
            <div className="min-w-0 flex-1">
                <p className="font-bold text-slate-900 truncate">{title}</p>
                <p className="text-sm text-slate-500 truncate">{meta}</p>
            </div>
            <div className="text-right">
                <Badge color={badgeColor}>{badge}</Badge>
                <p className="text-xs text-slate-400 mt-1">{extra}</p>
            </div>
        </div>
    );
}

function EmptyState({ loading, label }) {
    return <p className="text-sm text-slate-500">{loading ? 'Loading...' : label}</p>;
}
