import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    HiChevronLeft, HiThumbUp, HiChat, HiShare,
    HiDotsHorizontal, HiArrowSmRight, HiHeart, HiShieldCheck
} from 'react-icons/hi';
import Avatar from '../../components/ui/Avatar';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';
import clsx from 'clsx';

/* ─── Font helpers ─────────────────────────────────────────── */
const sora = { fontFamily: "'Sora', sans-serif" };
const mono = { fontFamily: "'DM Mono', monospace" };

/* ─── Mock Data (Shared with CommunityPage) ────────────────── */
const DISCUSSIONS = [
    {
        id: 1,
        title: 'How to handle complex form states in React?',
        author: 'Sarah Chen',
        category: 'Q&A',
        content: "I am building a multi-step onboarding wizard for a SaaS platform. Each step has about 12 fields, some of which are nested objects (like address or social profiles). \n\nI've been using standard useState but the re-renders are becoming a performance concern. Does anyone have experience migrating to React Hook Form or Formik for this scale? Or should I just implement a custom useReducer pattern to batch updates?",
        tags: ['React', 'Forms', 'Hooks'],
        likes: 24,
        replies: 8,
        time: '2h ago',
        repliesList: [
            { id: 101, author: 'Alex Rivera', content: 'Definitely go with React Hook Form. It uses refs to avoid re-renders on every keystroke. For 12 fields per step, you will see a huge difference.', time: '1h ago', likes: 5 },
            { id: 102, author: 'Jordan Smith', content: 'I actually prefer the useReducer approach if you need complex inter-field validation logic. It keeps everything in one place.', time: '45m ago', likes: 2 }
        ]
    },
    {
        id: 2,
        title: 'Check out my new dashboard design built with Skillery!',
        author: 'Alex Johnson',
        category: 'Show & Tell',
        content: "Hey everyone! I just finished the 8-week Design Mastery course here. For my final project, I built a financial tracking app dashboard. \n\nI used the color theories and grid systems we learned in week 4. I'm especially proud of the dark mode implementation using HSL variables. Let me know what you think of the contrast and spacing!",
        tags: ['Design', 'CaseStudy', 'Portfolio'],
        likes: 56,
        replies: 12,
        time: '5h ago',
        repliesList: []
    }
];

export default function DiscussionDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [discussion, setDiscussion] = useState(null);
    const [replies, setReplies] = useState([]);
    const [comment, setComment] = useState('');
    const [isLiked, setIsLiked] = useState(false);
    const [likedReplies, setLikedReplies] = useState(new Set());

    useEffect(() => {
        // Find discussion by ID
        const found = DISCUSSIONS.find(d => d.id === parseInt(id));
        if (found) {
            setDiscussion(found);
            setReplies(found.repliesList || []);
            window.scrollTo(0, 0);
        }
    }, [id]);

    const handlePostReply = () => {
        if (!comment.trim()) return;
        
        const newReply = {
            id: Date.now(),
            author: 'Alex Johnson', // Local user
            content: comment,
            time: 'Just now',
            likes: 0
        };

        setReplies([...replies, newReply]);
        setComment('');
        toast.success('Your reply has been posted!');
    };

    const toggleReplyLike = (replyId) => {
        const newLiked = new Set(likedReplies);
        if (newLiked.has(replyId)) {
            newLiked.delete(replyId);
            toast.success('Reply unliked');
        } else {
            newLiked.add(replyId);
            toast.success('Reply liked!');
        }
        setLikedReplies(newLiked);
    };

    const focusReply = (author) => {
        setComment(`@${author} `);
        const textarea = document.querySelector('textarea');
        if (textarea) {
            textarea.focus();
            window.scrollTo({ top: textarea.offsetTop - 100, behavior: 'smooth' });
        }
    };

    if (!discussion) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <p className="text-slate-400 font-bold animate-pulse">Loading discussion...</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-12" style={sora}>
            <div className="max-w-4xl mx-auto space-y-10">

                {/* ── Back Button ────────────────────────────── */}
                <button
                    onClick={() => navigate('/learner/community')}
                    className="group flex items-center gap-3 text-slate-400 hover:text-violet-600 transition-all"
                >
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-slate-100 group-hover:bg-violet-50 group-hover:border-violet-100 transition-all shadow-sm">
                        <HiChevronLeft className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-black uppercase tracking-widest">Back to Community</span>
                </button>

                {/* ── Thread Start ────────────────────────────── */}
                <div className="bg-white rounded-[40px] border border-slate-100 p-10 shadow-xl shadow-slate-200/50 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Avatar name={discussion.author} size="lg" className="ring-4 ring-violet-50" />
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-[11px] font-black text-slate-900 uppercase tracking-wider">{discussion.author}</span>
                                    <span className="text-[11px] font-bold text-slate-400" style={mono}>• {discussion.time}</span>
                                </div>
                                <span className="inline-block px-2 py-0.5 rounded-full bg-violet-50 text-violet-600 text-[9px] font-black uppercase tracking-widest border border-violet-100">
                                    {discussion.category}
                                </span>
                            </div>
                        </div>
                        <button 
                            onClick={() => toast.success('Options menu opened')}
                            className="p-3 text-slate-300 hover:text-slate-600 hover:bg-slate-50 rounded-2xl transition-all"
                        >
                            <HiDotsHorizontal className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="space-y-4">
                        <h1 className="text-4xl font-black text-slate-900 leading-tight tracking-tight">
                            {discussion.title}
                        </h1>
                        <div className="flex flex-wrap gap-2">
                            {discussion.tags.map(tag => (
                                <span key={tag} className="text-[10px] font-black text-violet-500 bg-violet-50 px-3 py-1 rounded-lg uppercase tracking-wider">
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="h-px bg-slate-50" />

                    <div className="text-slate-600 font-medium leading-relaxed whitespace-pre-line text-lg">
                        {discussion.content}
                    </div>

                    <div className="flex items-center gap-6 pt-4">
                        <button 
                            onClick={() => {
                                setIsLiked(!isLiked);
                                toast.success(isLiked ? 'Unlike thread' : 'Discussion liked!');
                            }}
                            className={clsx(
                                "flex items-center gap-2 px-6 py-3 rounded-2xl transition-all font-bold text-sm",
                                isLiked ? "bg-rose-50 text-rose-500 shadow-sm shadow-rose-100" : "bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-500"
                            )}
                        >
                            <HiHeart className={clsx("w-5 h-5", isLiked && "fill-current")} /> {discussion.likes + (isLiked ? 1 : 0)} Likes
                        </button>
                        <button 
                            onClick={() => {
                                navigator.clipboard.writeText(window.location.href);
                                toast.success('Link copied to clipboard!');
                            }}
                            className="flex items-center gap-2 px-6 py-3 bg-violet-50/50 hover:bg-violet-600 group text-violet-600 hover:text-white rounded-2xl transition-all font-bold text-sm border border-violet-100 shadow-sm"
                        >
                            <HiShare className="w-5 h-5 text-violet-500 group-hover:text-white transition-colors" /> Share
                        </button>
                    </div>
                </div>

                {/* ── Discussion List ─────────────────────────── */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between px-4">
                        <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            Replies <span className="text-slate-300">({replies.length})</span>
                        </h2>
                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <HiShieldCheck className="w-4 h-4 text-emerald-500" /> Community Verified
                        </div>
                    </div>

                    <div className="space-y-4">
                        {replies.map(reply => (
                            <div key={reply.id} className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm space-y-4">
                                <div className="flex items-center gap-3">
                                    <Avatar name={reply.author} size="sm" />
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-black text-slate-900 uppercase tracking-wider">{reply.author}</span>
                                        <span className="text-[10px] font-bold text-slate-400" style={mono}>• {reply.time}</span>
                                    </div>
                                </div>
                                <p className="text-sm font-medium text-slate-600 leading-relaxed pl-11">
                                    {reply.content}
                                </p>
                                {/* Engagement buttons removed per user request */}
                            </div>
                        ))}

                        {replies.length === 0 && (
                            <div className="py-12 text-center bg-white rounded-[40px] border border-dashed border-slate-200">
                                <HiChat className="w-12 h-12 mx-auto text-slate-100 mb-3" />
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No replies yet. Be the first to join the conversation!</p>
                            </div>
                        )}
                    </div>

                    {/* ── Reply Form ────────────────────────────── */}
                    <div className="bg-white rounded-[40px] border border-slate-100 p-8 shadow-xl shadow-slate-200/50 space-y-6">
                        <div className="flex items-start gap-4">
                            <Avatar name="Me" size="md" className="flex-shrink-0" />
                            <div className="flex-1 space-y-4">
                                <textarea
                                    placeholder="Add to the discussion..."
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-6 text-sm font-medium text-slate-700 focus:ring-4 focus:ring-violet-500/10 focus:bg-white focus:outline-none transition-all min-h-[140px] resize-none"
                                    value={comment}
                                    onChange={e => setComment(e.target.value)}
                                />
                                <div className="flex items-center justify-between">
                                    <p className="text-[10px] font-bold text-slate-400">Press Cmd+Enter to post</p>
                                    <Button
                                        className="rounded-xl px-10 py-3 shadow-lg shadow-violet-100"
                                        onClick={handlePostReply}
                                    >
                                        Post Reply
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
