import { useState, useEffect } from 'react';
import { HiFire, HiStar, HiTrendingUp } from 'react-icons/hi';
import Avatar from '../../components/ui/Avatar';
import clsx from 'clsx';
import Badge from '../../components/ui/Badge';
import { fetchLeaderboard } from '../../services/learnerApi';

export default function LeaderboardPage() {
    const [period, setPeriod] = useState('This Week');
    const [showAll, setShowAll] = useState(false);
    const [fullLeaderboard, setFullLeaderboard] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        fetchLeaderboard()
            .then(data => {
                if (data && data.length > 0) {
                    const mapped = data.map((item, i) => ({
                        id: i + 1,
                        name: item.user?.name || 'Unknown',
                        points: item.totalScore || 0,
                        days: item.coursesCompleted || 0,
                        quizzes: item.totalQuizzes || 0,
                        certificates: item.certificates || 0,
                        quizMinutes: item.totalQuizMinutes || 0,
                        color: ['orange', 'blue', 'purple', 'emerald', 'rose'][i % 5],
                        isCurrentUser: false,
                    }));
                    setFullLeaderboard(mapped);
                } else {
                    setFullLeaderboard([]);
                }
            })
            .catch(() => {
                setFullLeaderboard([]);
            })
            .finally(() => setIsLoading(false));
    }, []);

    const podiumUsers = fullLeaderboard.slice(0, 3);
    const rankedUsers = fullLeaderboard.length > 3
        ? (showAll ? fullLeaderboard.slice(3) : fullLeaderboard.slice(3, 10))
        : (showAll ? fullLeaderboard : fullLeaderboard.slice(0, 10));

    return (
        <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8 pb-20">
            <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                        <HiTrendingUp className="text-primary-500" /> Global Leaderboard
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">Compete with millions of learners worldwide.</p>
                </div>
                <div className="flex bg-white rounded-lg p-1 border border-slate-200">
                    {['Today', 'This Week', 'All Time'].map(p => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={clsx(
                                "px-4 py-1.5 text-sm font-bold rounded transition-colors",
                                period === p ? "bg-slate-100 text-slate-800" : "text-slate-500 hover:text-slate-700"
                            )}
                        >
                            {p}
                        </button>
                    ))}
                </div>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin"></div>
                </div>
            ) : fullLeaderboard.length === 0 ? (
                <div className="flex items-center justify-center py-20 text-center">
                    <div>
                        <h3 className="text-lg font-bold text-slate-600">No leaderboard data available</h3>
                        <p className="text-slate-500 mt-2">Leaderboard will be updated as learners complete courses and earn points.</p>
                    </div>
                </div>
            ) : (
                <>
                {/* Top Podium */}
                {podiumUsers.length > 0 && (
                <div className="flex justify-center items-end h-64 gap-2 md:gap-6 mt-12 mb-16 px-4">
                    {/* 2nd Place */}
                    {podiumUsers[1] && (
                    <div className="flex flex-col items-center w-1/3 max-w-[140px] animate-in slide-in-from-bottom" style={{ animationDelay: '100ms', animationFillMode: 'both' }}>
                        <Avatar name={podiumUsers[1].name || ''} size="lg" className="ring-4 ring-slate-100 z-10 -mb-4 shadow-sm" />
                        <div className="w-full bg-slate-200 rounded-t-2xl h-32 flex flex-col items-center justify-end pb-4 pt-8">
                            <span className="text-3xl font-black text-slate-400 leading-none">2</span>
                            <span className="font-bold text-slate-600 text-xs text-center mt-1 w-full truncate px-1">{podiumUsers[1].name}</span>
                            <span className="text-xs font-black text-slate-500 mt-0.5">{podiumUsers[1].points} pt</span>
                        </div>
                    </div>
                    )}
                    {/* 1st Place */}
                    {podiumUsers[0] && (
                    <div className="flex flex-col items-center w-1/3 max-w-[160px] animate-in slide-in-from-bottom z-10" style={{ animationDelay: '0ms', animationFillMode: 'both' }}>
                        <div className="relative">
                            <HiStar className="absolute -top-8 left-1/2 -translate-x-1/2 w-8 h-8 text-amber-500 animate-pulse" />
                            <Avatar name={podiumUsers[0].name || ''} size="xl" className="ring-4 ring-amber-400 z-10 -mb-5 shadow-lg" />
                        </div>
                        <div className="w-full bg-amber-400 rounded-t-2xl h-44 flex flex-col items-center justify-end pb-4 pt-10 shadow-lg shadow-amber-500/20">
                            <span className="text-4xl font-black text-amber-100 leading-none">1</span>
                            <span className="font-black text-amber-900 text-sm mt-1 text-center w-full truncate px-1">{podiumUsers[0].name}</span>
                            <span className="text-xs font-black text-amber-800 mt-0.5">{podiumUsers[0].points} pt</span>
                        </div>
                    </div>
                    )}
                    {/* 3rd Place */}
                    {podiumUsers[2] && (
                    <div className="flex flex-col items-center w-1/3 max-w-[140px] animate-in slide-in-from-bottom" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
                        <Avatar name={podiumUsers[2].name || ''} size="lg" className="ring-4 ring-slate-100 z-10 -mb-4 shadow-sm" />
                        <div className="w-full bg-orange-200 rounded-t-2xl h-24 flex flex-col items-center justify-end pb-4 pt-8">
                            <span className="text-3xl font-black text-orange-400 leading-none">3</span>
                            <span className="font-bold text-orange-900 text-xs text-center mt-1 w-full truncate px-1">{podiumUsers[2].name}</span>
                            <span className="text-xs font-black text-orange-700 mt-0.5">{podiumUsers[2].points} pt</span>
                        </div>
                    </div>
                    )}
                </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main List Column */}
                    <div className="col-span-2 space-y-3 px-2 sm:px-0">
                        <h3 className="font-black text-slate-800 mb-4 px-2">Top Rankings</h3>
                        {rankedUsers.map((user, i) => (
                            <div
                                key={user.id}
                                className={clsx(
                                    "flex items-center gap-4 p-4 rounded-2xl transition-all border",
                                    user.isCurrentUser ? "bg-primary-50 border-primary-200 shadow-sm" : "bg-white border-slate-100 hover:border-slate-200 hover:shadow-sm"
                                )}
                            >
                                <div className="w-8 text-center text-sm font-black text-slate-400">
                                    {fullLeaderboard.length > 3 ? i + 4 : i + 1}
                                </div>
                                <Avatar name={user.name} size="sm" />
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-slate-800 truncate flex items-center">{user.name} {user.isCurrentUser && <Badge color="blue" className="ml-2 !py-0 !text-[10px]">You</Badge>}</h4>
                                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                                        <span className="flex items-center gap-1 font-bold">
                                            <HiFire className="text-orange-500" /> {user.days} courses completed
                                        </span>
                                        <span className="font-bold">{user.quizzes} quizzes</span>
                                        <span className="font-bold">{user.certificates} certificates</span>
                                    </div>
                                    <p className="text-[11px] font-medium text-slate-400 mt-1">
                                        Quiz effort counted: {user.quizMinutes} min
                                    </p>
                                </div>
                                <div className="text-right">
                                    <span className="block font-black text-slate-800 text-lg leading-none">{user.points}</span>
                                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Points</span>
                                </div>
                            </div>
                        ))}

                        {!showAll && rankedUsers.length < fullLeaderboard.length && (
                            <button
                                onClick={() => setShowAll(true)}
                                className="w-full mt-4 py-4 rounded-xl border-2 border-dashed border-slate-200 text-sm font-bold text-slate-500 hover:border-slate-300 hover:text-slate-700 hover:bg-white transition-all shadow-sm"
                            >
                                Show All Learners
                            </button>
                        )}
                    </div>

                    {/* Right Sidebar */}
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-black text-slate-800">Weekly Challenge</h3>
                                <HiFire className="w-6 h-6 text-orange-500" />
                            </div>
                            <div className="space-y-4">
                                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                                    <div className="bg-orange-500 h-full rounded-full" style={{ width: '75%' }}></div>
                                </div>
                                <p className="text-sm font-bold text-slate-600">300 / 400 XP earned</p>
                                <p className="text-xs font-medium text-slate-500">Earn 100 more XP this week to unlock the "Weekend Warrior" badge!</p>
                            </div>
                        </div>
                    </div>
                </div>
                </>
            )}
        </div>
    );
}
