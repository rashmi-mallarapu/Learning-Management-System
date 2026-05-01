import { useState, useMemo, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
    HiAcademicCap, HiStar, HiClock, HiFire, HiLightningBolt,
    HiChevronRight, HiPlay, HiUsers, HiBookmark, HiChatAlt2,
    HiCollection
} from 'react-icons/hi';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip } from 'recharts';

import { ROUTES } from '../../constants/routes';
import { Link, useNavigate } from 'react-router-dom';
import ProgressBar from '../../components/ui/ProgressBar';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Avatar from '../../components/ui/Avatar';
import clsx from 'clsx';
import { fetchLearnerDashboard, fetchLeaderboard, fetchCourses } from '../../services/learnerApi';

export default function LearnerDashboard() {
    const { user } = useSelector(s => s.auth);
    const [stats, setStats] = useState(null);
    const [leaderboardData, setLeaderboardData] = useState([]);
    const [liveCourses, setLiveCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadDashboard = async () => {
            try {
                const [dashData, lbData, coursesData] = await Promise.allSettled([
                    fetchLearnerDashboard(),
                    fetchLeaderboard(),
                    fetchCourses(),
                ]);
                if (dashData.status === 'fulfilled') setStats(dashData.value);
                if (lbData.status === 'fulfilled') setLeaderboardData(lbData.value);
                if (coursesData.status === 'fulfilled') setLiveCourses(coursesData.value);
            } catch {
                // fallback to mock
            } finally {
                setLoading(false);
            }
        };
        loadDashboard();
    }, []);

    // Use live data with 0 defaults
    const enrolledCount = stats?.enrolledCourses ?? 0;
    const completedCount = stats?.completedCourses ?? 0;
    const certCount = stats?.certificates ?? 0;
    const avgScore = stats?.avgScore ?? 0;
    const totalLearningHours = stats?.totalLearningHours ?? 0;

    // Active course from enrollments only
    const activeCourse = useMemo(() => {
        if (stats?.enrollments?.length > 0) {
            const inProgress = stats.enrollments.find(e => e.progress > 0 && e.progress < 100);
            if (inProgress?.courseId) {
                return {
                    _id: inProgress.courseId._id,
                    title: inProgress.courseId.title,
                    category: inProgress.courseId.category,
                    thumbnail: inProgress.courseId.thumbnail,
                    progress: inProgress.progress,
                };
            }
            const first = stats.enrollments[0];
            if (first?.courseId) {
                return {
                    _id: first.courseId._id,
                    title: first.courseId.title,
                    category: first.courseId.category,
                    thumbnail: first.courseId.thumbnail,
                    progress: first.progress || 0,
                };
            }
        }
        return null;
    }, [stats]);

    // Recommended courses (live only)
    const recommended = useMemo(() => {
        if (liveCourses.length > 0) {
            const enrolledIds = new Set((stats?.enrollments || []).map(e => e.courseId?._id?.toString()));
            return liveCourses.filter(c => !enrolledIds.has(c._id?.toString()));
        }
        return [];
    }, [liveCourses, stats]);

    const chartData = useMemo(() => {
        if (Array.isArray(stats?.learningHoursChart) && stats.learningHoursChart.length > 0) {
            return stats.learningHoursChart.map((item, index) => ({
                day: item.label || `C${index + 1}`,
                hours: Number(item.hours || 0),
                fullTitle: item.fullTitle || item.label || `Course ${index + 1}`,
            }));
        }

        return [{ day: 'No data', hours: 0, fullTitle: 'No completed lesson durations yet' }];
    }, [stats]);

    // Leaderboard data (live only)
    const leaderboard = useMemo(() => {
        if (leaderboardData.length > 0) {
            return leaderboardData.slice(0, 5).map((item, i) => ({
                name: item.user?.name || 'Unknown',
                points: item.totalScore?.toLocaleString() || '0',
                days: `${item.coursesCompleted || 0} courses completed`,
                meta: `${item.totalQuizzes || 0} quizzes · ${item.certificates || 0} certificates`,
                color: ['orange', 'blue', 'purple', 'green', 'red'][i] || 'gray',
            }));
        }
        return [];
    }, [leaderboardData]);

    const courseId = activeCourse?._id || activeCourse?.id || null;

    return (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            {/* Main Content (Left + Center) */}
            <div className="xl:col-span-9 space-y-10">

                {/* Hero Section */}
                <div className="relative overflow-hidden bg-primary-500 rounded-xl p-10 sm:p-14 text-white shadow-md border border-gray-200">
                    {/* Floating Decorative Icons */}
                    <div className="absolute inset-0 pointer-events-none opacity-20">
                        <HiAcademicCap className="absolute top-10 right-20 w-16 h-16 rotate-12" />
                        <HiStar className="absolute bottom-10 left-40 w-12 h-12 -rotate-12" />
                        <HiLightningBolt className="absolute top-1/2 right-40 w-20 h-20 -translate-y-1/2 rotate-6" />
                    </div>

                    <div className="relative z-10 max-w-xl space-y-6">
                        <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight">
                            Ready to keep learning?
                        </h1>
                        <p className="text-indigo-100 text-lg font-medium opacity-90 leading-relaxed">
                            Let's keep your learning journey going. You're just one step closer to your goals.
                        </p>
                        <div className="flex flex-wrap gap-4 pt-6">
                            <Link to={`/learner/courses/${courseId}/lessons/1`}>
                                <Button size="lg" className="!bg-white !text-primary-500 hover:!bg-white/95 border-none font-black px-10 rounded-2xl h-14 shadow-xl shadow-indigo-900/10 transition-all transform hover:-translate-y-0.5">
                                    Resume Last Course
                                </Button>
                            </Link>

                            <Link to={ROUTES.LEARNER_BROWSE}>
                                <Button size="lg" variant="outline" className="!bg-transparent !border-white/30 !text-white hover:!bg-white/10 font-bold px-10 rounded-2xl h-14 transition-all">
                                    Explore New Courses
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Grid Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { label: 'Courses Enrolled', value: String(enrolledCount), icon: <HiCollection className="w-5 h-5 text-blue-500" />, bg: 'bg-blue-50' },
                        { label: 'Certificates Earned', value: String(certCount), icon: <HiAcademicCap className="w-5 h-5 text-orange-500" />, bg: 'bg-orange-50' },
                        { label: 'Avg Quiz Score', value: `${avgScore}%`, icon: <HiStar className="w-5 h-5 text-emerald-500" />, bg: 'bg-emerald-50' },
                        { label: 'Completed', value: String(completedCount), icon: <HiFire className="w-5 h-5 text-rose-500" />, bg: 'bg-rose-50' },
                    ].map((stat, i) => (
                        <div key={i} className="bg-white p-6 rounded-xl border border-gray-200 shadow-md space-y-3">
                            <div className={clsx("w-10 h-10 rounded-lg flex items-center justify-center", stat.bg)}>
                                {stat.icon}
                            </div>
                            <p className="text-[13px] font-bold text-gray-600">{stat.label}</p>
                            <h3 className="text-3xl font-black text-gray-800 leading-none">{stat.value}</h3>
                        </div>
                    ))}
                </div>

                {/* Continue Learning - Horizontal */}
                <section className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-black text-gray-800 tracking-tight">Continue Learning</h2>
                        <Link to={ROUTES.LEARNER_MY_LEARNING} className="text-sm font-bold text-primary-500 hover:underline">See All</Link>
                    </div>

                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-md flex flex-col md:flex-row items-center gap-6">
                            {activeCourse ? (
                                <>
                                    <div className="w-full md:w-32 h-24 rounded-lg overflow-hidden flex-shrink-0">
                                        <img
                                            src={activeCourse.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800&auto=format&fit=crop'}
                                            alt=""
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="flex-1 space-y-2 text-center md:text-left">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-primary-500">{activeCourse.category || 'Course'}</span>
                                        <h4 className="text-lg font-black text-gray-800">{activeCourse.title}</h4>
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs text-gray-600 font-bold">Progress</span>
                                            <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden max-w-[200px]">
                                                <div className="h-full bg-primary-500 rounded-full" style={{ width: `${activeCourse.progress || 0}%` }} />
                                            </div>
                                            <span className="text-xs font-bold text-primary-500">{activeCourse.progress || 0}%</span>
                                        </div>
                                    </div>
                                    {courseId && (
                                        <Link to={`/learner/courses/${courseId}/lessons/1`}>
                                            <Button className="bg-primary-500 text-white px-8 rounded-xl font-bold h-12 shadow-lg shadow-indigo-100 whitespace-nowrap">
                                                Resume Course
                                            </Button>
                                        </Link>
                                    )}
                                </>
                            ) : (
                                <div className="w-full text-center py-6">
                                    <h4 className="text-lg font-black text-gray-800">No active course yet</h4>
                                    <p className="text-sm text-gray-600 font-medium mt-2">Enroll in a course to start learning.</p>
                                    <Link to={ROUTES.LEARNER_BROWSE}>
                                        <Button className="mt-4 bg-primary-500 text-white px-8 rounded-xl font-bold h-12 shadow-lg shadow-indigo-100 whitespace-nowrap">
                                            Browse Courses
                                        </Button>
                                    </Link>
                                </div>
                            )}
                    </div>
                </section>

                {/* For You & Skill Progress Side-by-Side */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* For You Section */}
                    <section className="lg:col-span-8 space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-black text-gray-800 tracking-tight">For You</h2>
                            <Link to={ROUTES.LEARNER_BROWSE} className="text-sm font-bold text-primary-500 hover:underline">See All</Link>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {recommended.slice(0, 2).map((c, i) => {
                                const cId = c._id || c.id;
                                const instructorName = c.instructorId?.name || c.instructorName || 'Instructor';
                                return (
                                    <Link key={i} to={`/learner/courses/${cId}`} className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-md flex flex-col justify-between group h-full">
                                        <div className="relative h-40 overflow-hidden">
                                            <img
                                                src={c.thumbnail || `https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800&auto=format&fit=crop&${cId}`}
                                                alt={c.title}
                                                onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800&auto=format&fit=crop'; e.currentTarget.onerror = null; }}
                                                className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500 rounded-t-xl"
                                            />
                                        </div>
                                        <div className="p-6 flex-1 flex flex-col space-y-4">
                                            <div className="space-y-1">
                                                <span className={clsx(
                                                    "text-[10px] font-black uppercase tracking-widest",
                                                    c.category === 'Design' ? 'text-violet-500' : 'text-emerald-500'
                                                )}>
                                                    {c.category?.toUpperCase() || 'COURSE'}
                                                </span>
                                                <h4 className="text-lg font-black text-gray-800 group-hover:text-primary-500 transition-colors">{c.title}</h4>
                                            </div>
                                            <p className="text-sm text-gray-600 font-bold">{c.lessons || c.enrolledCount || 0} enrolled</p>
                                            <div className="pt-4 flex items-center gap-3 border-t border-slate-50 mt-auto">
                                                <Avatar name={instructorName} size="sm" />
                                                <div className="text-[11px]">
                                                    <p className="font-black text-gray-800">{instructorName}</p>
                                                    <p className="text-gray-600 font-bold font-mono text-[9px]">Instructor</p>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                            {recommended.length === 0 && (
                                <div className="md:col-span-2 bg-white rounded-xl border border-dashed border-gray-200 p-8 text-center">
                                    <p className="text-gray-600 font-medium">No course suggestions right now.</p>
                                    <Link to={ROUTES.LEARNER_BROWSE} className="inline-block mt-4">
                                        <Button className="bg-primary-500 text-white px-6 rounded-xl font-bold h-11">Browse Catalog</Button>
                                    </Link>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Skill Progress Widget */}
                    <section className="lg:col-span-4 space-y-6 h-full">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-black text-gray-800 tracking-tight">Skill Progress</h2>
                        </div>
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-md h-[400px] flex flex-col items-center justify-center text-center gap-3">
                            <span className="text-4xl">🎯</span>
                            <p className="text-sm font-bold text-gray-500">Skill tracking coming soon</p>
                            <p className="text-xs text-gray-400">Complete courses and quizzes to build your skill profile.</p>
                        </div>
                    </section>
                </div>
            </div>

            {/* Right Widgets Sidebar */}
            <div className="xl:col-span-3 space-y-8">

                {/* Today's Learning Goal Widget */}
                <div className="bg-primary-50 p-1.5 rounded-2xl border border-primary-100 shadow-sm">
                    <div className="bg-white p-6 rounded-xl space-y-6">
                        <div className="flex items-center justify-between">
                            <h4 className="font-black text-gray-800">Learning Progress</h4>
                            <span className="px-2 py-1 bg-primary-50 text-primary-600 rounded text-[10px] font-black uppercase tracking-widest">Live</span>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="relative w-24 h-24 shrink-0">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-100" />
                                    <circle
                                        cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8"
                                        fill="transparent" className="text-primary-500"
                                        strokeDasharray={251.2}
                                        strokeDashoffset={251.2 * (1 - Math.min((completedCount / Math.max(enrolledCount, 1)), 1))}
                                        strokeLinecap="round"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-xl font-black text-gray-800 leading-none">
                                        {enrolledCount > 0 ? Math.round((completedCount / enrolledCount) * 100) : 0}%
                                    </span>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <p className="text-2xl font-black text-gray-800">{completedCount}<span className="text-sm text-gray-400 ml-1">/ {enrolledCount} courses</span></p>
                                <p className="text-xs font-black text-primary-500 uppercase tracking-widest">
                                    {completedCount === 0 ? 'Start learning!' : completedCount === enrolledCount ? 'All done! 🎉' : 'Keep going!'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Streak widget */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-md space-y-6">
                    <div className="space-y-1">
                        <h4 className="text-lg font-black text-gray-800 flex items-center gap-2">
                            You're on fire, {user?.name?.split(' ')[0] || 'Learner'}! 🔥
                        </h4>
                        <p className="text-sm text-gray-600 font-medium leading-relaxed">
                            You have {enrolledCount} course{enrolledCount !== 1 ? 's' : ''} enrolled and {completedCount} completed. Keep the momentum going!
                        </p>
                    </div>
                    <Link to={`/learner/courses/${courseId}/lessons/1`}>
                        <Button fullWidth className="bg-white text-primary-500 border border-primary-500/20 h-12 rounded-xl font-bold shadow-sm hover:bg-slate-50 transition-all">
                            Start Learning
                        </Button>
                    </Link>
                </div>

                {/* Learning Hours Chart */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-md space-y-8">
                    <div className="flex items-center justify-between">
                        <h4 className="font-black text-gray-800">Learning Hours</h4>
                        <div className="flex items-center gap-2 text-sm font-black text-primary-500">
                            <HiClock className="w-5 h-5 text-gray-300" />
                            <span>{totalLearningHours}h</span>
                        </div>
                    </div>
                    <div className="h-48 w-full flex justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                <XAxis
                                    dataKey="day"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 12, fontWeight: 700, textAnchor: 'middle' }}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 12, fontWeight: 700 }}
                                />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                    formatter={(value) => [`${value}h`, 'Learning time']}
                                    labelFormatter={(label, payload) => payload?.[0]?.payload?.fullTitle || label}
                                />
                                <Bar dataKey="hours" radius={[4, 4, 0, 0]} barSize={24}>
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={index === 1 ? '#6366f1' : '#e0e7ff'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Leaderboard Widget */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-md space-y-6">
                    <div className="flex items-center justify-between">
                        <h4 className="font-black text-gray-800">Leaderboard</h4>
                        <Link to={ROUTES.LEARNER_LEADERBOARD} className="text-sm font-bold text-primary-500 hover:underline">See All</Link>
                    </div>

                    {leaderboard.length > 0 ? (
                        <div className="space-y-5">
                            {leaderboard.map((item, i) => (
                                <div key={i} className="flex items-center justify-between group cursor-pointer">
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <Avatar name={item.name} size="sm" />
                                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center text-[8px] font-black shadow-sm ring-1 ring-slate-100">
                                                {i + 1}
                                            </div>
                                        </div>
                                        <div className="space-y-0.5">
                                            <p className="text-xs font-black text-gray-800 group-hover:text-[#2563eb] transition-colors">{item.name}</p>
                                            <div className="flex items-center gap-1.5">
                                                <HiFire className={clsx("w-3 h-3",
                                                    item.color === 'orange' ? 'text-orange-500' :
                                                        item.color === 'blue' ? 'text-blue-500' : 'text-gray-300'
                                                )} />
                                                <span className="text-[10px] text-gray-600 font-bold">{item.days}</span>
                                            </div>
                                            <p className="text-[10px] text-slate-400 font-bold">{item.meta}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 text-primary-500 font-black text-xs">
                                        <HiStar className="w-3.5 h-3.5" />
                                        <span>{item.points}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-xl border border-dashed border-slate-200 p-5 text-center text-sm font-medium text-slate-500">
                            Leaderboard will appear once learners start completing courses, quizzes, or certificates.
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
