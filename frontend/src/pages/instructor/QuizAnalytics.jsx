import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { HiChevronLeft, HiDownload, HiUser } from 'react-icons/hi';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { fetchQuizById } from '../../services/instructorApi';

export default function QuizAnalytics() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [quiz, setQuiz] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchQuizById(id)
            .then(data => setQuiz(data))
            .catch(() => setQuiz(null))
            .finally(() => setLoading(false));
    }, [id]);

    const stats = { avgScore: 0, passRate: 0, totalAttempts: 0, avgTime: 'N/A' };
    const questionStats = (quiz?.questions || []).map((q, i) => ({ idx: i + 1, text: q.text, accuracy: 0 }));
    const scoreDist = Array.from({ length: 10 }, (_, i) => ({ range: `${i * 10}-${i * 10 + 9}`, count: 0 }));

    if (loading) return <div className="p-10 font-bold text-slate-500">Loading analytics...</div>;
    if (!quiz) return <div className="p-10 font-bold text-rose-500">Quiz not found</div>;

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 bg-slate-50 min-h-screen pb-24">
            <button onClick={() => navigate('/instructor/quizzes')} className="text-slate-400 hover:text-slate-600 flex items-center font-bold text-sm transition-colors">
                <HiChevronLeft className="w-4 h-4 mr-1" /> Back to Assessments
            </button>

            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 mb-1">{quiz.title} · Analytics</h1>
                    <p className="text-slate-500 font-medium">Performance metrics and student results.</p>
                </div>
                <Button variant="outline" icon={<HiDownload />}>Export CSV</Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center animate-in slide-in-from-bottom-2 duration-300">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Avg Score</p>
                    <div className="text-3xl font-black text-slate-800">{stats.avgScore}%</div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center animate-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: "50ms", animationFillMode: "both" }}>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pass Rate</p>
                    <div className="text-3xl font-black text-emerald-500">{stats.passRate}%</div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center animate-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: "100ms", animationFillMode: "both" }}>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Attempts</p>
                    <div className="text-3xl font-black text-slate-800">{stats.totalAttempts}</div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center animate-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: "150ms", animationFillMode: "both" }}>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Avg Time Taken</p>
                    <div className="text-3xl font-black text-slate-800">{stats.avgTime}</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
                    <h3 className="text-lg font-black text-slate-800 mb-8 border-b border-slate-100 pb-4">Score Distribution</h3>
                    <div className="flex items-end h-64 gap-1.5 md:gap-3 relative mt-4">
                        <div className="absolute border-l-2 border-dashed border-red-300 h-full bottom-0 z-0" style={{ left: '70%' }}>
                            <span className="absolute -top-6 -translate-x-1/2 text-[10px] font-bold text-red-500 uppercase tracking-wider bg-white px-2">Pass: {quiz.passMark}%</span>
                        </div>
                        {scoreDist.map((d, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center group relative z-10 h-full justify-end">
                                <div
                                    className="w-full bg-primary-100 rounded-t-md relative group-hover:bg-primary-300 transition-colors"
                                    style={{ height: `${(d.count / 40) * 100}%`, minHeight: d.count > 0 ? '4px' : '0' }}
                                >
                                    <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white px-1.5 py-0.5 rounded shadow-sm">{d.count}</span>
                                </div>
                                <div className="mt-3 text-[9px] font-black text-slate-400 md:rotate-0 -rotate-45 transform origin-top-left">{d.range}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
                    <h3 className="text-lg font-black text-slate-800 mb-6 border-b border-slate-100 pb-4">Per-Question Accuracy</h3>
                    <div className="space-y-6 max-h-64 overflow-y-auto pr-4 custom-scrollbar">
                        {questionStats.map(qs => (
                            <div key={qs.idx} className="space-y-2">
                                <div className="flex justify-between text-xs font-bold">
                                    <span className="text-slate-700 truncate pr-4" title={qs.text}>Q{qs.idx}. {qs.text}</span>
                                    <span className={qs.accuracy >= 80 ? 'text-emerald-500' : qs.accuracy >= 50 ? 'text-amber-500' : 'text-red-500'}>{qs.accuracy}%</span>
                                </div>
                                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div className={`h-full ${qs.accuracy >= 80 ? 'bg-emerald-400' : qs.accuracy >= 50 ? 'bg-amber-400' : 'bg-red-400'}`} style={{ width: `${qs.accuracy}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <h3 className="text-lg font-black text-slate-800 mb-6 focus-within:border-b border-slate-100 pb-4">Recent Attempts</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[600px]">
                        <thead>
                            <tr className="border-b border-slate-100 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                                <th className="pb-4 pt-2">Student</th>
                                <th className="pb-4 pt-2">Score</th>
                                <th className="pb-4 pt-2">Status</th>
                                <th className="pb-4 pt-2">Attempts</th>
                                <th className="pb-4 pt-2">Submitted</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {[1, 2, 3, 4, 5].map(i => {
                                const score = 80 + i * 3 - (i === 4 ? 30 : 0);
                                const passed = score >= quiz.passMark;
                                return (
                                    <tr key={i} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                        <td className="py-4 font-bold text-slate-800 flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center"><HiUser className="text-slate-400" /></div>
                                            Student {i}
                                        </td>
                                        <td className="py-4 font-black text-slate-700">{score}%</td>
                                        <td className="py-4"><Badge color={passed ? 'green' : 'red'} variant="glass">{passed ? 'Passed' : 'Failed'}</Badge></td>
                                        <td className="py-4 font-bold text-slate-500">{i === 1 ? 2 : 1}</td>
                                        <td className="py-4 font-medium text-slate-500">{i * 2} hours ago</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
