import { useState, useEffect } from 'react';
import {
    HiChartBar, HiAcademicCap, HiLightningBolt, HiFire,
    HiTrendingUp, HiBookmark, HiClock, HiCheckCircle
} from 'react-icons/hi';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import Badge from '../../components/ui/Badge';
import ProgressBar from '../../components/ui/ProgressBar';
import { fetchDashboardStats } from '../../services/learnerApi';

export default function ProgressDashboard() {
    const [stats, setStats] = useState([
        { label: 'Courses in Progress', value: '12', icon: HiAcademicCap, color: 'blue' },
        { label: 'Completed Lessons', value: '45', icon: HiCheckCircle, color: 'emerald' },
        { label: 'Study Streak', value: '15 Days', icon: HiFire, color: 'orange' },
        { label: 'Total Hours', value: '128h', icon: HiClock, color: 'purple' },
    ]);

    useEffect(() => {
        fetchDashboardStats()
            .then(data => {
                if (data) {
                    setStats([
                        { label: 'Courses in Progress', value: String(data.coursesInProgress || 12), icon: HiAcademicCap, color: 'blue' },
                        { label: 'Completed Lessons', value: String(data.completedLessons || 45), icon: HiCheckCircle, color: 'emerald' },
                        { label: 'Study Streak', value: `${data.streak || 15} Days`, icon: HiFire, color: 'orange' },
                        { label: 'Total Hours', value: `${data.totalHours || 128}h`, icon: HiClock, color: 'purple' },
                    ]);
                }
            })
            .catch(() => {});
    }, []);

    const weeklyProgress = [
        { day: 'Mon', mins: 45 },
        { day: 'Tue', mins: 90 },
        { day: 'Wed', mins: 30 },
        { day: 'Thu', mins: 120 },
        { day: 'Fri', mins: 60 },
        { day: 'Sat', mins: 200 },
        { day: 'Sun', mins: 140 },
    ];

    const categoryData = [
        { name: 'Technical', value: 65, color: '#3b82f6' },
        { name: 'Creative', value: 25, color: '#8b5cf6' },
        { name: 'Business', value: 10, color: '#f59e0b' },
    ];

    return (
        <div className="p-6 space-y-8 max-w-7xl mx-auto">
            <div className="space-y-1">
                <h1 className="text-3xl font-bold text-text-primary text-slate-900">Learning Insights</h1>
                <p className="text-text-secondary">Visualize your achievements and track your mastery across the platform.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((s, i) => (
                    <div key={i} className="bg-white p-6 rounded-2xl border border-surface-border shadow-card flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl bg-${s.color}-50 text-${s.color}-600 flex items-center justify-center`}>
                            <s.icon className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-text-primary">{s.value}</p>
                            <p className="text-xs font-bold text-text-muted uppercase tracking-widest">{s.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-surface-border shadow-card space-y-8">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                            <HiTrendingUp className="text-primary-600" /> Weekly Activity
                        </h2>
                        <Badge color="blue">This Week</Badge>
                    </div>
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={weeklyProgress}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                />
                                <Bar dataKey="mins" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={32} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-3xl border border-surface-border shadow-card flex flex-col items-center">
                    <h2 className="text-xl font-bold text-text-primary mb-8 self-start">Topic Mastery</h2>
                    <div className="h-64 w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    cx="50%" cy="50%"
                                    innerRadius={70}
                                    outerRadius={90}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {categoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-3xl font-black text-text-primary">85%</span>
                            <span className="text-[10px] text-text-muted font-bold uppercase tracking-widest leading-none">Overall</span>
                        </div>
                    </div>
                    <div className="mt-8 space-y-3 w-full">
                        {categoryData.map(c => (
                            <div key={c.name} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} />
                                    <span className="text-xs font-bold text-text-secondary uppercase tracking-widest">{c.name}</span>
                                </div>
                                <span className="text-sm font-black text-text-primary">{c.value}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-surface-border shadow-card">
                <h2 className="text-xl font-bold text-text-primary mb-6">Recent Skill Badges</h2>
                <div className="flex flex-wrap gap-6">
                    {[
                        { label: 'React Titan', color: 'blue', date: 'Oct 12' },
                        { label: 'UI Architect', color: 'purple', date: 'Oct 08' },
                        { label: 'Clean Coder', color: 'emerald', date: 'Sep 25' },
                        { label: 'Security First', color: 'rose', date: 'Sep 20' },
                    ].map(badge => (
                        <div key={badge.label} className="bg-surface-muted rounded-2xl p-4 flex items-center gap-4 border border-surface-border/50 group hover:border-primary-400/50 transition-all">
                            <div className={`w-14 h-14 rounded-2xl bg-${badge.color}-50 text-${badge.color}-500 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform`}>
                                <HiStar className="w-8 h-8" />
                            </div>
                            <div>
                                <p className="font-black text-text-primary uppercase tracking-tight">{badge.label}</p>
                                <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Earned {badge.date}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function HiStar(props) {
    return <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 20 20" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg" {...props}><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>;
}
