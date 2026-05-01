import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
    HiUsers,
    HiClipboardList,
    HiStar,
    HiTrendingUp,
    HiPlus,
    HiChevronRight,
    HiPresentationChartLine,
    HiLightningBolt,
    HiCheckCircle,
    HiMail,
    HiClock,
} from 'react-icons/hi';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer,
} from 'recharts';

import { ROUTES } from '../../constants/routes';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import clsx from 'clsx';
import {
    fetchInstructorDashboard,
    fetchPendingSubmissions,
    fetchInstructorCourses,
    createGoogleClassroomForCourse,
    fetchIncomingMessageAccessRequests,
} from '../../services/instructorApi';

const DEFAULT_DASHBOARD = {
    totalEnrollments: 0,
    pendingGrading: 0,
    avgRating: 0,
    totalCourses: 0,
    avgAttendance: 0,
    recentEnrollments: [],
    retentionData: [],
    recentEvents: [],
    topCourse: null,
    coursePerformance: [],
    creatorInsight: {
        title: 'Build your first live course signal',
        body: 'Publish a course and enroll learners to unlock live retention, activity, and performance insights here.',
        ctaLabel: 'Create Course',
    },
};

const formatRelativeTime = (value) => {
    if (!value) {
        return 'Just now';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return 'Just now';
    }

    const diffMs = Date.now() - date.getTime();
    const diffMinutes = Math.max(0, Math.round(diffMs / 60000));

    if (diffMinutes < 1) {
        return 'Just now';
    }

    if (diffMinutes < 60) {
        return `${diffMinutes}m ago`;
    }

    const diffHours = Math.round(diffMinutes / 60);
    if (diffHours < 24) {
        return `${diffHours}h ago`;
    }

    const diffDays = Math.round(diffHours / 24);
    if (diffDays < 7) {
        return `${diffDays}d ago`;
    }

    return date.toLocaleDateString();
};

const formatChartLabel = (label = '') => {
    if (!label) {
        return 'Course';
    }

    return label.length > 14 ? `${label.slice(0, 14)}...` : label;
};

const downloadCsv = (filename, rows) => {
    const csvContent = rows
        .map((row) => row.map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`).join(','))
        .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

const getEventTone = (type) => {
    if (type === 'enrollment') {
        return { icon: HiUsers, color: 'text-violet-500', bg: 'bg-violet-500' };
    }

    if (type === 'submission') {
        return { icon: HiClipboardList, color: 'text-rose-500', bg: 'bg-rose-500' };
    }

    return { icon: HiCheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-500' };
};

const CountUp = ({ end, duration = 1000, decimals = 0 }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let start = 0;
        const safeEnd = Number(end) || 0;
        const increment = safeEnd / (duration / 16);
        const timer = setInterval(() => {
            start += increment;
            if (start >= safeEnd) {
                setCount(safeEnd);
                clearInterval(timer);
            } else {
                setCount(start);
            }
        }, 16);

        return () => clearInterval(timer);
    }, [end, duration]);

    return <span>{Number(count).toFixed(decimals)}</span>;
};

export default function InstructorDashboard() {
    const navigate = useNavigate();

    const [dashboard, setDashboard] = useState(DEFAULT_DASHBOARD);
    const [courses, setCourses] = useState([]);
    const [submissions, setSubmissions] = useState([]);
    const [accessRequests, setAccessRequests] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadDashboard = async ({ silent = false } = {}) => {
        if (!silent) {
            setIsLoading(true);
        }

        try {
            const [dashboardData, pendingData, courseData, requestData] = await Promise.all([
                fetchInstructorDashboard(),
                fetchPendingSubmissions(),
                fetchInstructorCourses(),
                fetchIncomingMessageAccessRequests().catch(() => []),
            ]);

            setDashboard({ ...DEFAULT_DASHBOARD, ...(dashboardData || {}) });
            setCourses(Array.isArray(courseData) ? courseData : []);
            setSubmissions(Array.isArray(pendingData) ? pendingData : []);
            setAccessRequests(Array.isArray(requestData) ? requestData : []);
        } catch (error) {
            console.error('Instructor dashboard load error:', error);
            toast.error(error.message || 'Failed to load instructor dashboard');
        } finally {
            if (!silent) {
                setIsLoading(false);
            }
        }
    };

    useEffect(() => {
        loadDashboard();
    }, []);

    const handleCreateClassroom = async (course) => {
        const toastId = toast.loading(`Preparing Google Classroom for ${course.title}...`);

        try {
            const data = await createGoogleClassroomForCourse(course._id || course.id);

            setCourses((prev) =>
                prev.map((item) =>
                    String(item._id || item.id) === String(course._id || course.id)
                        ? { ...item, googleClassroom: data?.classroom || item.googleClassroom }
                        : item
                )
            );

            toast.success(
                data?.alreadyExists
                    ? `Google Classroom already exists for ${course.title}.`
                    : `Google Classroom created and ${data?.notifiedStudents || 0} students alerted.`,
                { id: toastId }
            );

            await loadDashboard({ silent: true });

            if (data?.classroom?.alternateLink) {
                window.open(data.classroom.alternateLink, '_blank', 'noopener,noreferrer');
            }
        } catch (error) {
            toast.error(error.message || 'Failed to create Google Classroom', { id: toastId });
        }
    };

    const handleDownloadReport = () => {
        const rows = [
            ['Instructor Dashboard Report'],
            ['Generated At', new Date().toLocaleString()],
            [],
            ['Metric', 'Value'],
            ['Total Enrollments', dashboard.totalEnrollments],
            ['Average Attendance', `${Number(dashboard.avgAttendance || 0).toFixed(1)}%`],
            ['Pending Grading', dashboard.pendingGrading],
            ['Average Rating', Number(dashboard.avgRating || 0).toFixed(1)],
            ['Total Courses', dashboard.totalCourses],
            [],
            ['Course Retention'],
            ['Course', 'Enrollments', 'Completion %', 'Drop-off %', 'Avg Progress %'],
            ...(dashboard.retentionData || []).map((item) => [
                item.name,
                item.enrollments,
                item.completion,
                item.dropoff,
                item.averageProgress ?? 0,
            ]),
            [],
            ['Recent Events'],
            ['Title', 'Description', 'When'],
            ...(dashboard.recentEvents || []).map((event) => [
                event.title,
                event.description,
                event.occurredAt ? new Date(event.occurredAt).toLocaleString() : '',
            ]),
        ];

        downloadCsv(`instructor-dashboard-${new Date().toISOString().slice(0, 10)}.csv`, rows);
        toast.success('Live dashboard report downloaded.');
    };

    const topCourse = dashboard.topCourse;
    const chartData = dashboard.retentionData || [];
    const chartBars = dashboard.coursePerformance?.length
        ? dashboard.coursePerformance.slice(0, 10).map((course) => Math.max(12, course.enrollments || 0))
        : [];

    const attentionItems = accessRequests.length > 0
        ? accessRequests.slice(0, 2).map((request) => ({
            key: request._id || request.id,
            name: request.learnerId?.name || request.studentId?.name || 'Learner',
            title: request.courseId?.title || 'Message access request',
            subtitle: 'Waiting for your approval',
        }))
        : submissions.slice(0, 2).map((submission) => ({
            key: submission._id,
            name: submission.userId?.name || 'Learner',
            title: submission.assignmentId?.title || 'Assignment submitted',
            subtitle: submission.assignmentId?.courseId?.title || 'Needs grading',
        }));

    const attentionCount = accessRequests.length > 0
        ? accessRequests.length
        : dashboard.pendingGrading;

    const statsItems = [
        {
            label: 'Total Enrollments',
            value: Number(dashboard.totalEnrollments) || 0,
            icon: HiUsers,
            gradient: 'from-violet-500 to-indigo-600',
            suffix: '',
            decimals: 0,
        },
        {
            label: 'Avg Attendance',
            value: Number(dashboard.avgAttendance) || 0,
            icon: HiPresentationChartLine,
            gradient: 'from-blue-500 to-cyan-600',
            suffix: '%',
            decimals: 0,
        },
        {
            label: 'Pending Assessment',
            value: Number(dashboard.pendingGrading) || 0,
            icon: HiClipboardList,
            gradient: 'from-rose-500 to-pink-600',
            suffix: '',
            decimals: 0,
        },
        {
            label: 'Student Rating',
            value: Number(dashboard.avgRating) || 0,
            icon: HiStar,
            gradient: 'from-amber-400 to-orange-500',
            suffix: '',
            decimals: 1,
        },
    ];

    return (
        <div className="space-y-10 animate-fade-in">
            <div className="flex flex-col lg:flex-row gap-8 items-stretch">
                <div className="flex-1 bg-white p-6 rounded-xl border border-gray-200 shadow-md flex flex-col justify-between relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-instructor-light/20 rounded-full blur-3xl -mr-10 -mt-10" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-4">
                            <Badge color="violet" variant="soft" className="font-black uppercase tracking-widest text-[10px]">
                                {dashboard.totalCourses} Live Courses
                            </Badge>
                            <span className="text-emerald-500 text-[10px] font-black flex items-center gap-0.5">
                                <HiTrendingUp /> {topCourse ? `${topCourse.retentionRate}% retention` : 'Ready to grow'}
                            </span>
                        </div>
                        <h1 className="text-4xl font-black text-gray-800 tracking-tighter mb-2">
                            Platform Impact
                        </h1>
                        <p className="text-gray-600 font-medium mb-4">
                            {topCourse
                                ? `${topCourse.title} leads with `
                                : 'Your catalog has reached '}
                            <span className="text-primary-500 font-bold">
                                {dashboard.totalEnrollments.toLocaleString()}
                            </span>
                            {topCourse
                                ? ` learners and ${topCourse.retentionRate}% completion.`
                                : ' total learner enrollments.'}
                        </p>
                    </div>

                    <div className="flex-1 flex items-end opacity-60 mb-8 mx-2 overflow-hidden">
                        <div className="flex items-end gap-1.5 h-20 w-full group">
                            {(chartBars.length > 0 ? chartBars : [16, 28, 44, 58, 72]).map((value, index, array) => {
                                const maxValue = Math.max(...array, 1);
                                const height = Math.max(16, Math.round((value / maxValue) * 100));

                                return (
                                    <div
                                        key={index}
                                        className="flex-1 bg-gradient-to-t from-violet-200 to-violet-400 rounded-t-sm transition-all duration-300 group-hover:scale-y-105 origin-bottom"
                                        style={{ height: `${height}%` }}
                                        title={dashboard.coursePerformance?.[index]?.title || 'Course'}
                                    />
                                );
                            })}
                        </div>
                    </div>

                    <div className="relative z-10 flex flex-wrap gap-4 mt-auto">
                        <Link to={ROUTES.INSTRUCTOR_COURSE_CREATE}>
                            <Button className="bg-primary-500 text-white border-none px-6 py-3 font-black uppercase tracking-widest text-[10px] shadow-md">
                                <HiPlus className="mr-2" /> Launch New Course
                            </Button>
                        </Link>
                        <Button
                            variant="outline"
                            className="border-gray-200 text-gray-600 font-black uppercase tracking-widest text-[10px]"
                            onClick={handleDownloadReport}
                        >
                            Download Report
                        </Button>
                    </div>
                </div>

                <div className="lg:w-1/3 bg-white p-6 rounded-xl text-gray-800 border border-gray-200 shadow-md relative overflow-hidden flex flex-col">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-full blur-3xl -mr-10 -mt-10" />
                    <div className="relative z-10 flex-1 flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em]">Needs Attention</p>
                                <span className="flex h-2 w-2 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                                </span>
                            </div>
                            <h3 className="text-2xl font-black mb-1">Inbox and Workflow</h3>
                            <p className="text-gray-500 text-xs font-bold mb-6">
                                {attentionCount} item{attentionCount === 1 ? '' : 's'} waiting in your live queue
                            </p>
                        </div>

                        <div className="space-y-3">
                            {attentionItems.length > 0 ? attentionItems.map((item) => (
                                <div key={item.key} className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-start gap-3 relative overflow-hidden group">
                                    <Avatar size="xs" name={item.name} className="flex-shrink-0" />
                                    <div>
                                        <p className="text-xs font-bold text-gray-800">{item.title}</p>
                                        <p className="text-[10px] font-bold uppercase text-gray-400 tracking-wider mt-0.5">
                                            {item.name} - {item.subtitle}
                                        </p>
                                    </div>
                                </div>
                            )) : (
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                    <p className="text-xs font-bold text-gray-800">Your inbox and grading queue are clear.</p>
                                    <p className="text-[10px] font-bold uppercase text-gray-400 tracking-wider mt-1">
                                        New learner activity will surface here automatically
                                    </p>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => navigate('/instructor/messages')}
                            className="w-full mt-6 py-3 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl border border-amber-200 text-xs font-black uppercase tracking-widest transition-all"
                        >
                            View Inbox
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {statsItems.map((item, index) => (
                    <div key={index} className="bg-white p-6 rounded-xl border border-gray-200 shadow-md hover-lift group relative overflow-hidden">
                        <div className={clsx('absolute -right-2 -top-2 w-16 h-16 rounded-full opacity-[0.03] group-hover:scale-150 transition-transform bg-gradient-to-br', item.gradient)} />
                        <div className="relative z-10 flex items-center gap-4">
                            <div className={clsx('w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg text-white bg-gradient-to-br', item.gradient)}>
                                <item.icon className="w-7 h-7" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">{item.label}</p>
                                <p className="text-2xl font-black text-gray-800">
                                    <CountUp end={item.value} decimals={item.decimals} />
                                    {item.suffix}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8 space-y-6">
                    <section className="bg-white p-6 rounded-xl border border-gray-200 shadow-md">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-10 gap-4">
                            <div>
                                <h2 className="text-xl font-black text-gray-800 tracking-tight">Course Retention</h2>
                                <p className="text-sm font-medium text-gray-600">Live completion vs. drop-off rates from current learner progress</p>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-instructor rounded-full" />
                                    <span className="text-[10px] font-black text-gray-400 uppercase">Completed</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-violet-300 rounded-full" />
                                    <span className="text-[10px] font-black text-gray-400 uppercase">Drop-off</span>
                                </div>
                            </div>
                        </div>
                        <div className="h-[350px] w-full">
                            {chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis
                                            dataKey="name"
                                            tickFormatter={formatChartLabel}
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 800 }}
                                            dy={10}
                                        />
                                        <YAxis hide />
                                        <Tooltip
                                            cursor={{ fill: 'transparent' }}
                                            formatter={(value, name, item) => {
                                                if (name === 'completion') {
                                                    return [`${value}% complete`, item.payload.name];
                                                }

                                                return [`${value}% drop-off`, item.payload.name];
                                            }}
                                            contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', fontWeight: 800 }}
                                        />
                                        <Bar dataKey="completion" stackId="a" fill="#7c3aed" radius={[0, 0, 0, 0]} barSize={40} />
                                        <Bar dataKey="dropoff" stackId="a" fill="#c4b5fd" radius={[10, 10, 0, 0]} barSize={40} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full rounded-2xl border border-dashed border-slate-200 bg-slate-50 flex items-center justify-center px-6 text-center">
                                    <div>
                                        <p className="text-sm font-bold text-slate-700">Retention analytics will appear once learners start progressing through your courses.</p>
                                        <p className="text-xs font-medium text-slate-500 mt-2">Published courses with active learners feed this chart automatically.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>

                    <section className="bg-white p-6 rounded-xl border border-gray-200 shadow-md">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-black text-gray-800 tracking-tight flex items-center gap-2">
                                <HiClipboardList className="text-rose-500" /> Pending Submissions
                            </h3>
                            <button onClick={() => navigate(ROUTES.INSTRUCTOR_SUBMISSIONS)} className="text-[10px] font-black text-primary-500 uppercase tracking-widest hover:underline">
                                View All Task
                            </button>
                        </div>
                        <div className="space-y-2">
                            {submissions.length > 0 ? submissions.slice(0, 5).map((submission) => (
                                <div key={submission._id} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100 group cursor-pointer">
                                    <Avatar name={submission.userId?.name || 'Learner'} size="sm" className="ring-2 ring-white shadow-sm" />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-gray-800 group-hover:text-primary-500 transition-colors">{submission.userId?.name || 'Learner'}</p>
                                        <p className="text-[10px] text-gray-400 font-bold truncate uppercase tracking-widest">
                                            {submission.assignmentId?.courseId?.title || 'Course'} - {submission.assignmentId?.title || 'Assignment'}
                                        </p>
                                    </div>
                                    <div className="hidden sm:block text-right">
                                        <p className="text-xs font-black text-gray-800">{formatRelativeTime(submission.createdAt)}</p>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Received</p>
                                    </div>
                                    <button onClick={() => navigate(ROUTES.INSTRUCTOR_SUBMISSIONS)} className="p-2.5 rounded-lg bg-gray-50 text-gray-400 group-hover:bg-primary-500 group-hover:text-white transition-all">
                                        <HiChevronRight className="w-5 h-5" />
                                    </button>
                                </div>
                            )) : (
                                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-6">
                                    <p className="text-sm font-bold text-slate-700">No pending submissions right now.</p>
                                    <p className="text-xs font-medium text-slate-500 mt-2">New learner uploads will appear here automatically as they arrive.</p>
                                </div>
                            )}
                        </div>
                    </section>

                    <section className="bg-white p-6 rounded-xl border border-gray-200 shadow-md">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-black text-gray-800 tracking-tight">Google Classrooms</h3>
                            <button onClick={() => navigate(ROUTES.INSTRUCTOR_COURSES)} className="text-[10px] font-black text-primary-500 uppercase tracking-widest hover:underline">
                                Manage Courses
                            </button>
                        </div>
                        <div className="space-y-3">
                            {courses.length > 0 ? courses.slice(0, 4).map((course) => (
                                <div key={course._id || course.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-100 p-4">
                                    <div>
                                        <p className="font-bold text-gray-800">{course.title}</p>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                            {course.googleClassroom?.id
                                                ? `Live code: ${course.googleClassroom.enrollmentCode || 'Available in Classroom'}`
                                                : 'No classroom yet'}
                                        </p>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant={course.googleClassroom?.id ? 'outline' : 'primary'}
                                        className={course.googleClassroom?.id ? 'border-emerald-300 text-emerald-700' : ''}
                                        onClick={() => handleCreateClassroom(course)}
                                    >
                                        {course.googleClassroom?.id ? 'Open Classroom' : 'Create Classroom'}
                                    </Button>
                                </div>
                            )) : (
                                <p className="text-sm text-gray-500">Create a course first to provision its Google Classroom.</p>
                            )}
                        </div>
                    </section>
                </div>

                <div className="lg:col-span-4 space-y-8">
                    <section className="bg-white p-6 rounded-xl border border-gray-200 shadow-md">
                        <h3 className="text-lg font-black text-gray-800 tracking-tight mb-6">Recent Events</h3>
                        {dashboard.recentEvents?.length > 0 ? (
                            <div className="space-y-6 relative border-l-2 border-slate-50 ml-2 pl-6">
                                {dashboard.recentEvents.map((event, index) => {
                                    const tone = getEventTone(event.type);
                                    const EventIcon = tone.icon;

                                    return (
                                        <div key={`${event.title}-${index}`} className="relative">
                                            <div className={clsx('absolute -left-[35px] top-0 w-4 h-4 rounded-full border-4 border-white shadow-sm', tone.bg)} />
                                            <div>
                                                <p className="text-xs font-black text-gray-800 flex items-center gap-2">
                                                    <EventIcon className={tone.color} /> {event.title}
                                                </p>
                                                <p className="text-[10px] text-gray-600 font-medium mb-1">{event.description}</p>
                                                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">
                                                    {formatRelativeTime(event.occurredAt)}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-6">
                                <p className="text-sm font-bold text-slate-700">No recent events yet.</p>
                                <p className="text-xs font-medium text-slate-500 mt-2">Enrollments, submissions, and published course activity will start appearing here automatically.</p>
                            </div>
                        )}
                    </section>

                    <div className="bg-primary-500 rounded-xl p-8 text-white shadow-md border border-gray-200 relative overflow-hidden group">
                        <div className="absolute right-0 bottom-0 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
                        <div className="relative z-10 space-y-6">
                            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-xl border border-white/20 group-hover:rotate-12 transition-transform">
                                <HiLightningBolt className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h3 className="font-black text-xl tracking-tight mb-2">Creator Insights</h3>
                                <p className="text-sm font-black">{dashboard.creatorInsight?.title}</p>
                                <p className="text-indigo-50 text-xs font-bold leading-relaxed mb-6 uppercase tracking-widest mt-3">
                                    {dashboard.creatorInsight?.body}
                                </p>
                            </div>
                            <Button
                                onClick={() => navigate(topCourse ? ROUTES.INSTRUCTOR_ANALYTICS : ROUTES.INSTRUCTOR_COURSE_CREATE)}
                                size="sm"
                                variant="outline"
                                className="w-full !bg-white !text-primary-500 !border-transparent hover:!bg-white/90 font-black uppercase tracking-widest text-[10px] py-4 shadow-md rounded-xl mt-4"
                            >
                                {dashboard.creatorInsight?.ctaLabel || 'View Trends'}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="hidden" aria-hidden="true">
                    <HiMail />
                    <HiClock />
                </div>
            ) : null}
        </div>
    );
}
