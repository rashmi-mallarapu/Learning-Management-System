import { useEffect, useMemo, useState } from 'react';
import { HiChartBar, HiCollection, HiTrendingUp, HiUsers } from 'react-icons/hi';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

import Badge from '../../components/ui/Badge';
import { ROLES } from '../../constants/roles';
import { fetchAdminCourses, fetchAdminUsers } from '../../services/learnerApi';

export default function PlatformAnalytics() {
    const [users, setUsers] = useState([]);
    const [courses, setCourses] = useState([]);
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
                setError(err.message || 'Failed to load analytics');
            });

        return () => {
            active = false;
        };
    }, []);

    const overview = useMemo(() => {
        const enrollments = courses.reduce((sum, course) => sum + (course.enrolledCount || 0), 0);
        const published = courses.filter((course) => course.status === 'published').length;
        const drafts = courses.filter((course) => course.status === 'draft').length;

        return [
            { label: 'Users', value: users.length, icon: HiUsers, color: 'blue' },
            { label: 'Courses', value: courses.length, icon: HiCollection, color: 'violet' },
            { label: 'Published', value: published, icon: HiTrendingUp, color: 'emerald' },
            { label: 'Enrollments', value: enrollments, icon: HiChartBar, color: 'amber' },
            { label: 'Drafts', value: drafts, icon: HiCollection, color: 'rose' },
        ];
    }, [courses, users]);

    const roleData = useMemo(() => ([
        { name: 'Learners', total: users.filter((user) => user.role === ROLES.LEARNER).length },
        { name: 'Instructors', total: users.filter((user) => user.role === ROLES.INSTRUCTOR).length },
        { name: 'Admins', total: users.filter((user) => user.role === ROLES.ADMIN).length },
    ]), [users]);

    const courseData = useMemo(() => {
        const map = new Map();

        courses.forEach((course) => {
            const key = course.category || 'General';
            const current = map.get(key) || { name: key, courses: 0, enrollments: 0 };
            current.courses += 1;
            current.enrollments += course.enrolledCount || 0;
            map.set(key, current);
        });

        return Array.from(map.values()).slice(0, 8);
    }, [courses]);

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-black text-slate-900">Platform Analytics</h1>
                <p className="text-slate-500 mt-2">
                    Live summaries of user distribution, course inventory, and learner reach from the current system data.
                </p>
            </div>

            {error && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
                {overview.map((item) => (
                    <div key={item.label} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                        <div className="flex items-center justify-between">
                            <Badge color={item.color}>{item.label}</Badge>
                            <item.icon className="w-5 h-5 text-slate-400" />
                        </div>
                        <p className="text-3xl font-black text-slate-900 mt-4">{item.value}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
                    <h2 className="text-xl font-black text-slate-900 mb-2">Role Mix</h2>
                    <p className="text-sm text-slate-500 mb-6">A quick breakdown of administrators, instructors, and learners.</p>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={roleData}>
                                <defs>
                                    <linearGradient id="roleMix" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.25} />
                                        <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid stroke="#eef2ff" vertical={false} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} />
                                <Tooltip />
                                <Area type="monotone" dataKey="total" stroke="#7c3aed" strokeWidth={3} fill="url(#roleMix)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </section>

                <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
                    <h2 className="text-xl font-black text-slate-900 mb-2">Category Reach</h2>
                    <p className="text-sm text-slate-500 mb-6">Course count and enrollment concentration by category.</p>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={courseData}>
                                <CartesianGrid stroke="#f1f5f9" vertical={false} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} />
                                <Tooltip />
                                <Bar dataKey="enrollments" fill="#10b981" radius={[8, 8, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </section>
            </div>
        </div>
    );
}
