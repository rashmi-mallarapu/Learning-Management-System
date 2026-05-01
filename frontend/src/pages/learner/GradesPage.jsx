import { useState, useEffect } from 'react';
import {
    HiTrendingUp, HiAcademicCap, HiStar, HiClock,
    HiDownload, HiSearch, HiFilter
} from 'react-icons/hi';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import SearchBar from '../../components/ui/SearchBar';
import { fetchGrades } from '../../services/learnerApi';

export default function GradesPage() {
    const mockGrades = [
        { id: 1, title: 'React Hooks Deep Dive', type: 'Assignment', course: 'Advanced React Patterns', score: 95, grade: 'A+', date: '2023-10-12' },
        { id: 2, title: 'ES6+ Foundations', type: 'Quiz', course: 'Advanced React Patterns', score: 88, grade: 'A', date: '2023-10-05' },
        { id: 3, title: 'Atomic Design Principles', type: 'Assignment', course: 'UI/UX Design Masterclass', score: 92, grade: 'A', date: '2023-09-28' },
        { id: 4, title: 'Color Theory Quiz', type: 'Quiz', course: 'UI/UX Design Masterclass', score: 75, grade: 'C+', date: '2023-09-20' },
        { id: 5, title: 'Flexbox & Grid Mastery', type: 'Assignment', course: 'CSS Architecture', score: 100, grade: 'A+', date: '2023-09-15' },
    ];
    const [grades, setGrades] = useState(mockGrades);

    useEffect(() => {
        fetchGrades()
            .then(data => {
                if (data) {
                    const liveGrades = [];
                    (data.quizGrades || []).forEach(q => {
                        liveGrades.push({
                            id: q._id,
                            title: q.quizTitle,
                            type: 'Quiz',
                            course: q.courseTitle,
                            score: q.percentage,
                            grade: q.percentage >= 90 ? 'A+' : q.percentage >= 80 ? 'A' : q.percentage >= 70 ? 'B+' : q.percentage >= 60 ? 'B' : 'C',
                            date: q.completedAt ? new Date(q.completedAt).toISOString().split('T')[0] : '',
                        });
                    });
                    (data.assignmentGrades || []).forEach(a => {
                        liveGrades.push({
                            id: a._id,
                            title: a.assignmentTitle,
                            type: 'Assignment',
                            course: a.courseTitle,
                            score: a.percentage,
                            grade: a.percentage >= 90 ? 'A+' : a.percentage >= 80 ? 'A' : a.percentage >= 70 ? 'B+' : a.percentage >= 60 ? 'B' : 'C',
                            date: '',
                        });
                    });
                    if (liveGrades.length > 0) {
                        setGrades(prev => [...liveGrades, ...prev]);
                    }
                }
            })
            .catch(() => {});
    }, []);

    const chartData = [
        { name: 'Sep 1', score: 80 },
        { name: 'Sep 15', score: 100 },
        { name: 'Sep 20', score: 75 },
        { name: 'Sep 28', score: 92 },
        { name: 'Oct 5', score: 88 },
        { name: 'Oct 12', score: 95 },
    ];

    return (
        <div className="p-6 space-y-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold text-text-primary text-slate-900">Academic Performance</h1>
                    <p className="text-text-secondary">Comprehensive view of your scores, feedback, and academic progress.</p>
                </div>
                <Button icon={<HiDownload />} variant="outline">Download Transcript</Button>
            </div>

            {/* Performance Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-surface-border shadow-card space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
                            Performance Trend
                        </h2>
                        <Badge color="blue">Past 60 Days</Badge>
                    </div>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} domain={[0, 100]} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                                />
                                <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-primary-600 rounded-2xl p-6 text-white shadow-lg space-y-4 relative overflow-hidden">
                        <HiStar className="absolute -right-4 -bottom-4 w-32 h-32 text-white/10" />
                        <div className="relative z-10">
                            <p className="text-xs uppercase font-bold tracking-widest opacity-80 mb-1">GPA Equivalent</p>
                            <h3 className="text-4xl font-black">3.85 / 4.0</h3>
                            <p className="text-sm opacity-90 mt-4 leading-relaxed">
                                You are in the top 5% of your cohort. Keep maintaining your score in UI/UX to reach Magna Cum Laude.
                            </p>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-surface-border shadow-card space-y-4">
                        <h3 className="font-bold text-text-primary">Average Score by Category</h3>
                        <div className="space-y-4">
                            {[
                                { label: 'Assignments', val: 96, color: 'blue' },
                                { label: 'Quizzes', val: 82, color: 'purple' },
                                { label: 'Participation', val: 100, color: 'emerald' },
                            ].map(item => (
                                <div key={item.label} className="space-y-1.5">
                                    <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                                        <span className="text-text-secondary">{item.label}</span>
                                        <span className="text-text-primary">{item.val}%</span>
                                    </div>
                                    <div className="h-2 bg-surface-muted rounded-full overflow-hidden">
                                        <div className={`h-full bg-${item.color}-500 rounded-full`} style={{ width: `${item.val}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Detailed Grades Table */}
            <div className="bg-white rounded-2xl border border-surface-border shadow-card overflow-hidden">
                <div className="px-6 py-4 border-b border-surface-border flex flex-col sm:flex-row justify-between items-center gap-4 bg-surface-muted/30">
                    <h3 className="font-bold text-text-primary">Grade History</h3>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <SearchBar placeholder="Filter subjects..." className="w-full sm:w-64" />
                        <Button variant="outline" icon={<HiFilter />} size="sm" />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-surface-border">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-widest">Assessment</th>
                                <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-widest">Type</th>
                                <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-widest">Course</th>
                                <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-widest">Score</th>
                                <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-widest">Grade</th>
                                <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-border">
                            {grades.map(g => (
                                <tr key={g.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <p className="font-bold text-text-primary text-sm">{g.title}</p>
                                        <p className="text-[10px] text-text-muted uppercase tracking-widest mt-0.5">{g.date}</p>
                                    </td>
                                    <td className="px-6 py-4 uppercase text-[10px] font-bold text-text-secondary">{g.type}</td>
                                    <td className="px-6 py-4 text-xs text-text-secondary">{g.course}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-12 h-1 bg-surface-muted rounded-full overflow-hidden">
                                                <div className={`h-full bg-${g.score > 90 ? 'emerald' : g.score > 80 ? 'blue' : 'amber'}-500`} style={{ width: `${g.score}%` }} />
                                            </div>
                                            <span className="text-xs font-bold text-text-primary">{g.score}%</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <Badge color={g.score > 90 ? 'green' : g.score > 80 ? 'blue' : 'amber'}>{g.grade}</Badge>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="text-primary-600 text-xs font-bold hover:underline">View Feedback</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
