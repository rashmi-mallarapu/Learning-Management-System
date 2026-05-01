import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
    HiTrendingUp, HiUsers, HiClock,
    HiDownload, HiRefresh, HiStar, HiCollection, HiClipboardList
} from 'react-icons/hi';
import clsx from 'clsx';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, AreaChart, Area,
    LineChart, Line
} from 'recharts';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { fetchInstructorCourses, fetchInstructorStats, fetchPendingSubmissions } from '../../services/instructorApi';

const cardTone = {
    blue: {
        icon: 'bg-blue-50 text-blue-600',
        changeUp: 'text-emerald-600',
        changeDown: 'text-rose-600',
    },
    emerald: {
        icon: 'bg-emerald-50 text-emerald-600',
        changeUp: 'text-emerald-600',
        changeDown: 'text-rose-600',
    },
    amber: {
        icon: 'bg-amber-50 text-amber-600',
        changeUp: 'text-emerald-600',
        changeDown: 'text-rose-600',
    },
    violet: {
        icon: 'bg-violet-50 text-violet-600',
        changeUp: 'text-emerald-600',
        changeDown: 'text-rose-600',
    },
};

const formatCompact = (value) => new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 }).format(value || 0);

const toMonthLabel = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Recent';
    return date.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
};

const normalizeCourses = (items = []) =>
    items.map((course) => ({
        id: course._id || course.id,
        title: course.title || 'Untitled Course',
        category: course.category || 'General',
        status: course.status || 'draft',
        enrolledCount: Number(course.enrolledCount || course.enrollmentCount || course.enrolled || 0),
        rating: Number(course.rating || 0),
        reviewCount: Number(course.reviewCount || 0),
        createdAt: course.createdAt,
        googleClassroom: course.googleClassroom || {},
    }));

export default function CourseAnalytics() {
    const [activeTab, setActiveTab] = useState('Overview');
    const [courses, setCourses] = useState([]);
    const [stats, setStats] = useState(null);
    const [pendingSubmissions, setPendingSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [error, setError] = useState('');
    const [showTopCourseDetails, setShowTopCourseDetails] = useState(false);

    const loadAnalytics = async ({ silent = false } = {}) => {
        if (silent) {
            setSyncing(true);
        } else {
            setLoading(true);
        }

        try {
            const [statsData, coursesData, pendingData] = await Promise.all([
                fetchInstructorStats(),
                fetchInstructorCourses(),
                fetchPendingSubmissions(),
            ]);

            setStats(statsData || null);
            setCourses(normalizeCourses(Array.isArray(coursesData) ? coursesData : []));
            setPendingSubmissions(Array.isArray(pendingData) ? pendingData : []);
            setError('');

            if (silent) {
                toast.success('Analytics synced successfully');
            }
        } catch (err) {
            setError(err.message || 'Failed to load instructor analytics');
            if (silent) {
                toast.error(err.message || 'Unable to sync analytics');
            }
        } finally {
            setLoading(false);
            setSyncing(false);
        }
    };

    useEffect(() => {
        loadAnalytics();
    }, []);

    const analytics = useMemo(() => {
        const publishedCourses = courses.filter((course) => course.status === 'published');
        const draftCourses = courses.filter((course) => course.status === 'draft');
        const archivedCourses = courses.filter((course) => course.status === 'archived');
        const totalEnrollments = Number(stats?.totalEnrollments || courses.reduce((sum, course) => sum + course.enrolledCount, 0));
        const totalCourses = Number(stats?.totalCourses || courses.length);
        const avgRating = Number(stats?.avgRating || (courses.length ? courses.reduce((sum, course) => sum + course.rating, 0) / courses.length : 0));
        const avgAttendance = Number(stats?.avgAttendance || 0);
        const completionRate = totalCourses ? Math.round((publishedCourses.length / totalCourses) * 100) : 0;
        const classroomEnabled = courses.filter((course) => course.googleClassroom?.id).length;
        const topCourse = [...courses].sort((left, right) => {
            if (right.enrolledCount !== left.enrolledCount) return right.enrolledCount - left.enrolledCount;
            return right.rating - left.rating;
        })[0] || null;

        const enrollmentGrowth = courses
            .reduce((accumulator, course) => {
                const key = toMonthLabel(course.createdAt);
                const current = accumulator.get(key) || { month: key, students: 0 };
                current.students += course.enrolledCount;
                accumulator.set(key, current);
                return accumulator;
            }, new Map());

        const enrollmentData = Array.from(enrollmentGrowth.values()).slice(-6);

        const engagementData = [...courses]
            .sort((left, right) => right.enrolledCount - left.enrolledCount)
            .slice(0, 7)
            .map((course) => ({
                name: course.title.length > 18 ? `${course.title.slice(0, 18)}...` : course.title,
                active: course.enrolledCount,
            }));

        const retentionData = [
            { label: 'Published', returning: publishedCourses.length },
            { label: 'Draft', returning: draftCourses.length },
            { label: 'Archived', returning: archivedCourses.length },
            { label: 'Classroom Live', returning: classroomEnabled },
        ];

        const satisfaction = [
            { label: 'Course Quality', score: avgRating.toFixed(1) },
            { label: 'Average Attendance', score: `${avgAttendance.toFixed(0)}%` },
            { label: 'Portfolio Readiness', score: `${completionRate}%` },
        ];

        return {
            totalEnrollments,
            totalCourses,
            avgRating,
            avgAttendance,
            completionRate,
            classroomEnabled,
            publishedCourses: publishedCourses.length,
            draftCourses: draftCourses.length,
            archivedCourses: archivedCourses.length,
            topCourse,
            enrollmentData,
            engagementData,
            retentionData,
            satisfaction,
        };
    }, [courses, pendingSubmissions.length, stats]);

    const mainStats = useMemo(() => ([
        {
            label: 'Total Enrollments',
            value: formatCompact(analytics.totalEnrollments),
            change: `${analytics.totalCourses} courses`,
            icon: HiUsers,
            color: 'blue',
            positive: true,
        },
        {
            label: 'Published Rate',
            value: `${analytics.completionRate}%`,
            change: `${analytics.publishedCourses} published`,
            icon: HiTrendingUp,
            color: 'emerald',
            positive: true,
        },
        {
            label: 'Pending Grading',
            value: String(stats?.pendingGrading || pendingSubmissions.length || 0),
            change: `${pendingSubmissions.length} open items`,
            icon: HiClipboardList,
            color: 'amber',
            positive: false,
        },
        {
            label: 'Average Rating',
            value: analytics.avgRating.toFixed(1),
            change: `${analytics.classroomEnabled} classrooms live`,
            icon: HiStar,
            color: 'violet',
            positive: true,
        },
    ]), [analytics, pendingSubmissions.length, stats?.pendingGrading]);

    const exportAnalytics = () => {
        const rows = [
            ['Metric', 'Value'],
            ['Total Enrollments', analytics.totalEnrollments],
            ['Total Courses', analytics.totalCourses],
            ['Published Courses', analytics.publishedCourses],
            ['Draft Courses', analytics.draftCourses],
            ['Archived Courses', analytics.archivedCourses],
            ['Average Rating', analytics.avgRating.toFixed(1)],
            ['Average Attendance', analytics.avgAttendance.toFixed(0)],
            ['Pending Grading', stats?.pendingGrading || pendingSubmissions.length || 0],
            ['Classrooms Live', analytics.classroomEnabled],
            [],
            ['Course', 'Status', 'Enrollments', 'Rating', 'Reviews'],
            ...courses.map((course) => [
                course.title,
                course.status,
                course.enrolledCount,
                course.rating.toFixed(1),
                course.reviewCount,
            ]),
        ];

        const csv = rows
            .map((row) => (Array.isArray(row) ? row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',') : ''))
            .join('\n');

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `instructor-analytics-${Date.now()}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success('Analytics exported successfully');
    };

    const openTopCourseDetails = () => {
        if (!analytics.topCourse) {
            toast('No top course data available yet', { icon: 'i' });
            return;
        }

        setShowTopCourseDetails(true);
        toast.success(`Showing details for ${analytics.topCourse.title}`);
    };

    if (loading) {
        return <div className="p-10 font-bold text-slate-500">Loading instructor analytics...</div>;
    }

    return (
        <div className="p-6 space-y-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-text-primary text-slate-900">Course Performance</h1>
                    <p className="text-text-secondary">Live analytics from your current courses, enrollments, and grading activity.</p>
                </div>
                <div className="flex bg-white p-1 rounded-xl border border-surface-border shadow-sm">
                    {['Overview', 'Engagement', 'Retention'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={clsx(
                                'px-5 py-2 text-sm font-bold rounded-lg transition-all',
                                activeTab === tab ? 'bg-slate-100 text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                            )}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {error && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
                    {error}
                </div>
            )}

            {activeTab === 'Overview' ? (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {mainStats.map((item) => (
                            <div key={item.label} className="bg-white p-6 rounded-2xl border border-surface-border shadow-card space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center', cardTone[item.color].icon)}>
                                        <item.icon className="w-6 h-6" />
                                    </div>
                                    <span className={clsx('text-xs font-bold', item.positive ? cardTone[item.color].changeUp : cardTone[item.color].changeDown)}>
                                        {item.change}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-2xl font-black text-text-primary">{item.value}</p>
                                    <p className="text-xs font-bold text-text-muted uppercase tracking-widest">{item.label}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 bg-white p-8 rounded-2xl border border-surface-border shadow-card space-y-8">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-text-primary">Enrollment Growth</h2>
                                <div className="flex gap-2">
                                    <Button size="sm" variant="outline" icon={<HiDownload />} onClick={exportAnalytics}>Export</Button>
                                    <Button size="sm" variant="outline" icon={<HiRefresh />} onClick={() => loadAnalytics({ silent: true })} loading={syncing}>Sync</Button>
                                </div>
                            </div>
                            <div className="h-80 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={analytics.enrollmentData}>
                                        <defs>
                                            <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.15} />
                                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                                        <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                                        <Area type="monotone" dataKey="students" stroke="#8b5cf6" strokeWidth={4} fillOpacity={1} fill="url(#colorStudents)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xl shadow-indigo-100/50 space-y-6">
                                <h3 className="font-black text-lg text-slate-900 mb-2">Top Performing Course</h3>
                                <div className="space-y-4">
                                    {analytics.topCourse ? (
                                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{analytics.topCourse.title}</p>
                                            <h4 className="font-bold text-sm text-slate-800">Active Learners: {analytics.topCourse.enrolledCount.toLocaleString('en-IN')}</h4>
                                            <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-indigo-500 rounded-full"
                                                    style={{ width: `${Math.min(100, analytics.topCourse.rating * 20 || 5)}%` }}
                                                />
                                            </div>
                                            <p className="text-[10px] font-bold text-slate-500">
                                                {analytics.topCourse.rating.toFixed(1)}/5.0 rating across {analytics.topCourse.reviewCount} reviews
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm text-slate-500">
                                            No course data available yet.
                                        </div>
                                    )}
                                    <Button
                                        fullWidth
                                        variant="outline"
                                        className="bg-white hover:bg-slate-50 text-indigo-600 border border-indigo-100 rounded-xl font-bold shadow-sm"
                                        onClick={openTopCourseDetails}
                                    >
                                        Deep Dive Details
                                    </Button>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-2xl border border-surface-border shadow-card space-y-4">
                                <h3 className="font-bold text-text-primary">Student Satisfaction</h3>
                                <div className="space-y-4">
                                    {analytics.satisfaction.map((metric) => (
                                        <div key={metric.label} className="flex items-center justify-between">
                                            <span className="text-sm text-text-secondary">{metric.label}</span>
                                            <span className="text-sm font-bold text-text-primary">{metric.score}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {showTopCourseDetails && analytics.topCourse && (
                        <div className="bg-white p-8 rounded-2xl border border-surface-border shadow-card space-y-6">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <h2 className="text-xl font-bold text-text-primary">{analytics.topCourse.title}</h2>
                                    <p className="text-sm text-text-secondary">Expanded live details for your best-performing course.</p>
                                </div>
                                <Button size="sm" variant="outline" onClick={() => setShowTopCourseDetails(false)}>
                                    Close
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                                <MiniDetailCard label="Category" value={analytics.topCourse.category} />
                                <MiniDetailCard label="Status" value={analytics.topCourse.status} />
                                <MiniDetailCard label="Learners" value={analytics.topCourse.enrolledCount.toLocaleString('en-IN')} />
                                <MiniDetailCard label="Rating" value={`${analytics.topCourse.rating.toFixed(1)} / 5`} />
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5 space-y-3">
                                    <h3 className="font-bold text-slate-900">Course Snapshot</h3>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-500">Reviews</span>
                                        <span className="font-bold text-slate-900">{analytics.topCourse.reviewCount}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-500">Classroom Linked</span>
                                        <span className="font-bold text-slate-900">{analytics.topCourse.googleClassroom?.id ? 'Yes' : 'No'}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-500">Created</span>
                                        <span className="font-bold text-slate-900">
                                            {analytics.topCourse.createdAt ? new Date(analytics.topCourse.createdAt).toLocaleDateString('en-IN') : 'N/A'}
                                        </span>
                                    </div>
                                </div>

                                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5 space-y-3">
                                    <h3 className="font-bold text-slate-900">Why It Leads</h3>
                                    <p className="text-sm text-slate-600">
                                        This course currently leads your portfolio by learner count and rating, making it the strongest indicator of live student demand.
                                    </p>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-500">Portfolio Share</span>
                                        <span className="font-bold text-slate-900">
                                            {analytics.totalEnrollments ? Math.round((analytics.topCourse.enrolledCount / analytics.totalEnrollments) * 100) : 0}%
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-500">Relative Strength</span>
                                        <span className="font-bold text-slate-900">
                                            {analytics.avgRating ? `${(analytics.topCourse.rating - analytics.avgRating).toFixed(1)} vs avg` : 'Top course'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            ) : activeTab === 'Engagement' ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 bg-white p-8 rounded-2xl border border-surface-border shadow-card space-y-8">
                        <h2 className="text-xl font-bold text-text-primary">Most Active Courses</h2>
                        <div className="h-80 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={analytics.engagementData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                                    <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} cursor={{ fill: '#f8fafc' }} />
                                    <Bar dataKey="active" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-2xl border border-surface-border shadow-card space-y-4">
                            <h3 className="font-bold text-text-primary">Engagement Stats</h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between"><span className="text-sm text-text-secondary">Total Courses</span><span className="text-sm font-bold text-text-primary">{analytics.totalCourses}</span></div>
                                <div className="flex items-center justify-between"><span className="text-sm text-text-secondary">Classrooms Live</span><span className="text-sm font-bold text-text-primary">{analytics.classroomEnabled}</span></div>
                                <div className="flex items-center justify-between"><span className="text-sm text-text-secondary">Pending Grading</span><span className="text-sm font-bold text-text-primary">{stats?.pendingGrading || pendingSubmissions.length || 0}</span></div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 bg-white p-8 rounded-2xl border border-surface-border shadow-card space-y-8">
                        <h2 className="text-xl font-bold text-text-primary">Portfolio Health</h2>
                        <div className="h-80 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={analytics.retentionData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                                    <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                                    <Line type="monotone" dataKey="returning" stroke="#10b981" strokeWidth={4} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-2xl border border-surface-border shadow-card space-y-4">
                            <h3 className="font-bold text-text-primary">Portfolio Stats</h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between"><span className="text-sm text-text-secondary">Published Courses</span><span className="text-sm font-bold text-emerald-600">{analytics.publishedCourses}</span></div>
                                <div className="flex items-center justify-between"><span className="text-sm text-text-secondary">Draft Courses</span><span className="text-sm font-bold text-amber-600">{analytics.draftCourses}</span></div>
                                <div className="flex items-center justify-between"><span className="text-sm text-text-secondary">Archived Courses</span><span className="text-sm font-bold text-rose-600">{analytics.archivedCourses}</span></div>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-surface-border shadow-card space-y-3">
                            <div className="flex items-center gap-2">
                                <HiCollection className="w-5 h-5 text-slate-400" />
                                <h3 className="font-bold text-text-primary">Recent Activity</h3>
                            </div>
                            {Array.isArray(stats?.recentEnrollments) && stats.recentEnrollments.length > 0 ? stats.recentEnrollments.slice(0, 4).map((item, index) => (
                                <div key={`${item.studentName}-${index}`} className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                                    <p className="text-sm font-bold text-slate-800">{item.studentName || 'Learner enrolled'}</p>
                                    <p className="text-[11px] font-medium text-slate-500">{item.courseTitle || 'Course'}</p>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">
                                        {item.date ? new Date(item.date).toLocaleDateString('en-IN') : 'Recently'}
                                    </p>
                                </div>
                            )) : (
                                <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                                    No recent enrollment activity available yet.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function MiniDetailCard({ label, value }) {
    return (
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
            <p className="mt-2 text-lg font-black text-slate-900">{value}</p>
        </div>
    );
}
