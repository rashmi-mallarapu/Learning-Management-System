import { useState, useEffect } from 'react';
import {
    HiSearch, HiChatAlt2, HiThumbUp, HiChat,
    HiChevronRight, HiPlus, HiFire, HiUserGroup,
    HiFilter, HiX, HiInformationCircle, HiHeart,
    HiPaperClip, HiLink, HiTrash
} from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';
import Avatar from '../../components/ui/Avatar';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { fetchDiscussions, createDiscussion } from '../../services/learnerApi';

/* ─── Font helpers ─────────────────────────────────────────── */
const sora = { fontFamily: "'Sora', sans-serif" };
const mono = { fontFamily: "'DM Mono', monospace" };

/* ─── Mock Data ────────────────────────────────────────────── */
const CATEGORIES = ['All', 'General', 'Q&A', 'Show & Tell', 'Resources'];

const DISCUSSIONS = [
    {
        id: 1,
        title: 'How to handle complex form states in React?',
        author: 'Sarah Chen',
        category: 'Q&A',
        snippet: 'I am struggling with nested form objects and validation. Should I use Formik or just stick to useReducer?',
        content: "I am building a multi-step onboarding wizard for a SaaS platform. Each step has about 12 fields, some of which are nested objects (like address or social profiles). \n\nI've been using standard useState but the re-renders are becoming a performance concern. Does anyone have experience migrating to React Hook Form or Formik for this scale? Or should I just implement a custom useReducer pattern to batch updates?",
        tags: ['React', 'Forms', 'Hooks'],
        likes: 24,
        replies: 8,
        time: '2h ago',
        isHot: true
    },
    {
        id: 2,
        title: 'Check out my new dashboard design built with Skillery!',
        author: 'Alex Johnson',
        category: 'Show & Tell',
        snippet: 'Just finished the UI/UX Mastery course and applied the principles to my personal project. Feedback welcome!',
        content: "Hey everyone! I just finished the 8-week Design Mastery course here. For my final project, I built a financial tracking app dashboard. \n\nI used the color theories and grid systems we learned in week 4. I'm especially proud of the dark mode implementation using HSL variables. Let me know what you think of the contrast and spacing!",
        tags: ['Design', 'CaseStudy', 'Portfolio'],
        likes: 56,
        replies: 12,
        time: '5h ago',
        isHot: true
    },
    {
        id: 3,
        title: 'Best resources for learning System Design in 2024',
        author: 'Michael Torres',
        category: 'Resources',
        snippet: 'Compiled a list of books, blogs, and interactive courses that helped me master distributed systems.',
        content: "I've been collecting references for the past 6 months while preparing for senior roles. Here is a curated list of what actually helped me: \n\n1. DDIA (The Bible of distributed systems) \n2. ByteByteGo newsletter \n3. System Design Primer on GitHub \n4. Alex Xu's YouTube channel. \n\nHope this helps someone on the same journey!",
        tags: ['SystemDesign', 'Backend', 'Learning'],
        likes: 42,
        replies: 5,
        time: '1d ago',
        isHot: false
    },
    {
        id: 4,
        title: 'Job Interview Experience: Senior Frontend Dev',
        author: 'Lisa Park',
        category: 'General',
        snippet: 'Just went through a 5-round interview process at a top tech firm. Here is what they asked and my tips.',
        content: "It was a long process! 1 initial screen, 2 technical (live coding), 1 system design (UI), and 1 behavioral. \n\nThe live coding was focused on creating a custom hook for debouncing search and then implementing an infinite scroll list with virtualization. Tip: focus on performance and edge cases (what happens if the API fails?). Good luck to everyone applying!",
        tags: ['Career', 'Frontend', 'Interview'],
        likes: 89,
        replies: 34,
        time: '2d ago',
        isHot: true
    }
];

/* ══════════════════════════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════════════════════════ */
export default function CommunityPage() {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState('All');
    const [isPosting, setIsPosting] = useState(false);
    const [postSuccess, setPostSuccess] = useState(false);
    const [likedPosts, setLikedPosts] = useState(new Set());

    // Form State
    const [newPost, setNewPost] = useState({ title: '', category: 'General', content: '' });
    const [attachedFiles, setAttachedFiles] = useState([]);
    const [attachedLinks, setAttachedLinks] = useState([]);
    const [allDiscussions, setAllDiscussions] = useState(DISCUSSIONS);

    useEffect(() => {
        fetchDiscussions()
            .then(data => {
                if (data && data.length > 0) {
                    const mapped = data.map(d => ({
                        id: d._id,
                        title: d.title,
                        author: d.userId?.name || 'Anonymous',
                        category: d.category || 'General',
                        snippet: d.content?.substring(0, 120) || '',
                        content: d.content || '',
                        tags: d.tags || [],
                        likes: d.likes || 0,
                        replies: d.replies?.length || 0,
                        time: d.createdAt ? new Date(d.createdAt).toLocaleDateString() : '',
                        isHot: (d.likes || 0) > 10,
                    }));
                    setAllDiscussions(prev => [...mapped, ...prev]);
                }
            })
            .catch(() => {});
    }, []);

    const filtered = allDiscussions.filter(d => {
        const matchesSearch = d.title.toLowerCase().includes(search.toLowerCase()) ||
            d.snippet.toLowerCase().includes(search.toLowerCase()) ||
            d.tags.some(t => t.toLowerCase().includes(search.toLowerCase().replace('#', '')));
        const matchesTab = activeTab === 'All' || d.category === activeTab;
        return matchesSearch && matchesTab;
    });

    const handleCreatePost = () => {
        if (!newPost.title.trim()) {
            toast.error('Please enter a topic title');
            return;
        }
        setPostSuccess(true);
        toast.success('Creating your discussion...');
        setTimeout(() => {
            setPostSuccess(false);
            setIsPosting(false);
            setNewPost({ title: '', category: 'General', content: '' });
            setAttachedFiles([]);
            setAttachedLinks([]);
            toast.success('Published successfully!');
        }, 1500);
    };

    const handleAddLink = () => {
        const url = prompt('Enter the link URL:');
        if (url) {
            setAttachedLinks([...attachedLinks, url]);
            toast.success('Link added!');
        }
    };

    const handleAttachFile = () => {
        toast.success('File selector opened (simulated)');
        const fakeFile = { id: Date.now(), name: `resource_${attachedFiles.length + 1}.pdf`, size: '1.2 MB' };
        setAttachedFiles([...attachedFiles, fakeFile]);
    };

    const removeFile = (id) => setAttachedFiles(attachedFiles.filter(f => f.id !== id));
    const removeLink = (index) => setAttachedLinks(attachedLinks.filter((_, i) => i !== index));

    const toggleLike = (id, e) => {
        e.stopPropagation();
        const newLiked = new Set(likedPosts);
        if (newLiked.has(id)) {
            newLiked.delete(id);
            toast.success('Unliked');
        } else {
            newLiked.add(id);
            toast.success('Discussion liked!');
        }
        setLikedPosts(newLiked);
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-8" style={sora}>
            <div className="max-w-6xl mx-auto space-y-8">

                {/* ── Header ───────────────────────────────────── */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1">
                            LEARNER NETWORK
                        </p>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                            Community
                        </h1>
                    </div>

                    {!isPosting && (
                        <button
                            onClick={() => setIsPosting(true)}
                            className="flex items-center gap-2 px-6 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-bold hover:bg-violet-700 transition-all shadow-lg shadow-violet-100"
                        >
                            <HiPlus className="w-4 h-4" /> New Discussion
                        </button>
                    )}
                </div>

                {/* ── New Post Form (Inline) ───────────────────── */}
                {isPosting && (
                    <div className="bg-white rounded-[32px] border border-violet-100 p-8 shadow-xl shadow-violet-50 animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                                {postSuccess ? 'Post Published!' : 'Start a Discussion'}
                            </h2>
                            <button onClick={() => setIsPosting(false)} className="p-2 text-slate-400 hover:text-rose-500 transition-colors">
                                <HiX className="w-6 h-6" />
                            </button>
                        </div>

                        {postSuccess ? (
                            <div className="py-20 flex flex-col items-center justify-center space-y-4 animate-in zoom-in-95 duration-500">
                                <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center shadow-inner">
                                    <HiHeart className="w-10 h-10" />
                                </div>
                                <p className="text-sm font-black text-slate-600 uppercase tracking-widest">Discussion added to feed</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="md:col-span-2 space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Topic Title</label>
                                        <input
                                            autoFocus
                                            placeholder="What's on your mind?"
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-violet-500/10 focus:bg-white focus:outline-none transition-all"
                                            value={newPost.title}
                                            onChange={e => setNewPost({ ...newPost, title: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Elaborate (Optional)</label>
                                        <div className="relative group/text">
                                            <textarea
                                                placeholder="Provide more context for your peers..."
                                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-medium text-slate-600 focus:ring-4 focus:ring-violet-500/10 focus:bg-white focus:outline-none transition-all min-h-[160px]"
                                                value={newPost.content}
                                                onChange={e => setNewPost({ ...newPost, content: e.target.value })}
                                            />
                                            {/* Attachment Toolbar */}
                                            <div className="absolute bottom-3 left-3 flex items-center gap-2">
                                                <button 
                                                    onClick={handleAttachFile}
                                                    className="p-2 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-all flex items-center gap-2 group/btn"
                                                >
                                                    <HiPaperClip className="w-4 h-4" />
                                                    <span className="text-[9px] font-black uppercase tracking-widest hidden group-hover/btn:block">Attach File</span>
                                                </button>
                                                <button 
                                                    onClick={handleAddLink}
                                                    className="p-2 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-all flex items-center gap-2 group/btn"
                                                >
                                                    <HiLink className="w-4 h-4" />
                                                    <span className="text-[9px] font-black uppercase tracking-widest hidden group-hover/btn:block">Add Link</span>
                                                </button>
                                            </div>
                                        </div>

                                        {/* Previews */}
                                        {(attachedFiles.length > 0 || attachedLinks.length > 0) && (
                                            <div className="flex flex-wrap gap-2 pt-2">
                                                {attachedFiles.map(file => (
                                                    <div key={file.id} className="flex items-center gap-2 px-3 py-1.5 bg-violet-50 border border-violet-100 rounded-xl text-[10px] font-bold text-violet-700 animate-in zoom-in-95">
                                                        <HiPaperClip className="w-3 h-3" /> {file.name}
                                                        <button onClick={() => removeFile(file.id)} className="hover:text-rose-500 transition-colors"><HiTrash className="w-3.5 h-3.5 ml-1" /></button>
                                                    </div>
                                                ))}
                                                {attachedLinks.map((link, idx) => (
                                                    <div key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-sky-50 border border-sky-100 rounded-xl text-[10px] font-bold text-sky-700 animate-in zoom-in-95">
                                                        <HiLink className="w-3 h-3" /> {link.length > 20 ? link.substring(0, 20) + '...' : link}
                                                        <button onClick={() => removeLink(idx)} className="hover:text-rose-500 transition-colors"><HiTrash className="w-3.5 h-3.5 ml-1" /></button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Category</label>
                                        <div className="grid grid-cols-1 gap-2">
                                            {CATEGORIES.filter(c => c !== 'All').map(cat => (
                                                <button
                                                    key={cat}
                                                    onClick={() => setNewPost({ ...newPost, category: cat })}
                                                    className={clsx(
                                                        "px-4 py-3 rounded-xl text-xs font-bold transition-all text-left border",
                                                        newPost.category === cat
                                                            ? "bg-violet-50 border-violet-200 text-violet-700 shadow-sm"
                                                            : "bg-slate-50 border-transparent text-slate-400 hover:bg-slate-100"
                                                    )}
                                                >
                                                    {cat}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="pt-4 space-y-3">
                                        <Button onClick={handleCreatePost} className="w-full py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl shadow-violet-100">
                                            Post Topic
                                        </Button>
                                        <p className="text-[10px] text-slate-400 text-center font-bold px-4 leading-relaxed">
                                            By posting, you agree to our community guidelines.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ── Filter Bar ────────────────────────────────── */}
                <div className="flex flex-col lg:flex-row gap-6">

                    {/* Main Content: Feed */}
                    <div className="flex-1 space-y-6">

                        {/* Search & Tabs */}
                        <div className="flex flex-col sm:flex-row items-center gap-4 p-2 bg-white rounded-2xl border border-slate-100 shadow-sm">
                            <div className="relative flex-1 w-full">
                                <HiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                <input
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder="Search discussions..."
                                    className="w-full bg-slate-50/50 border border-transparent rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:bg-white focus:border-violet-200 transition-all placeholder-slate-400 font-medium"
                                />
                                {search && (
                                    <button onClick={() => setSearch('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-rose-500">
                                        <HiX className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                            <div className="flex bg-slate-100 p-1 rounded-xl gap-1 overflow-x-auto overflow-y-hidden custom-scrollbar">
                                {CATEGORIES.map(tab => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={clsx(
                                            "px-4 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap",
                                            activeTab === tab ? "bg-white text-violet-700 shadow-sm" : "text-slate-500 hover:text-slate-800"
                                        )}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* List */}
                        <div className="space-y-4">
                            {filtered.map(d => (
                                <DiscussionCard 
                                    key={d.id} 
                                    post={d} 
                                    isLiked={likedPosts.has(d.id)}
                                    onLike={(e) => toggleLike(d.id, e)}
                                    onClick={() => navigate(`/learner/community/discussion/${d.id}`)} 
                                />
                            ))}

                            {filtered.length === 0 && (
                                <div className="py-24 text-center bg-white rounded-3xl border border-dashed border-slate-200 space-y-3">
                                    <HiChatAlt2 className="w-10 h-10 mx-auto text-slate-200" />
                                    <p className="font-bold text-slate-400 uppercase tracking-widest text-[11px]">No discussions found</p>
                                    <button onClick={() => { setSearch(''); setActiveTab('All'); }} className="text-[10px] text-violet-600 font-black uppercase tracking-widest hover:underline">Clear all filters</button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sidebar: Trending & Rules */}
                    <div className="w-full lg:w-72 space-y-6">
                        {/* Trending */}
                        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
                            <h3 className="flex items-center gap-2 text-sm font-black text-slate-900 uppercase tracking-widest">
                                <HiFire className="text-orange-500 w-4 h-4" /> Trending
                            </h3>
                            <div className="space-y-3">
                                {['#ReactConf2024', '#NextJSAppRouter', '#DesignPatterns', '#CareerAdvice'].map(tag => (
                                    <button
                                        key={tag}
                                        onClick={() => setSearch(tag)}
                                        className="block w-full text-left text-xs font-bold text-slate-500 hover:text-violet-600 transition-colors"
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Rules */}
                        <div className="bg-violet-50 rounded-3xl p-6 border border-violet-100 space-y-3">
                            <h3 className="text-xs font-black text-violet-900 uppercase tracking-widest">Community Code</h3>
                            <p className="text-[10px] text-violet-700 leading-relaxed font-bold">
                                Be respectful, helpful, and keep it collaborative. We are all here to learn and grow together.
                            </p>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

function Badge({ children, color = 'slate', variant = 'soft', className = '' }) {
    const colors = {
        violet: 'bg-violet-50 text-violet-700 border-violet-100',
        slate: 'bg-slate-50 text-slate-600 border-slate-100',
    };
    return (
        <span className={clsx("px-2 py-0.5 rounded-full border text-[10px] font-bold", colors[color], className)}>
            {children}
        </span>
    );
}

/* ─── Card Component ────────────────────────────────────────── */
function DiscussionCard({ post, onClick, isLiked, onLike }) {
    return (
        <div
            onClick={onClick}
            className="group bg-white rounded-3xl border border-slate-100 p-5 shadow-sm hover:shadow-xl hover:shadow-indigo-100/30 transition-all duration-300 hover:-translate-y-1 cursor-pointer"
        >
            <div className="flex gap-5">
                <div className="flex-shrink-0 pt-1">
                    <Avatar name={post.author} size="md" className="ring-2 ring-slate-50 group-hover:ring-violet-50 transition-all" />
                </div>
                <div className="flex-1 min-w-0 space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-slate-900 uppercase tracking-wider">{post.author}</span>
                            <span className="w-1 h-1 bg-slate-300 rounded-full" />
                            <span className="text-[10px] font-bold text-slate-400" style={mono}>{post.time}</span>
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 bg-slate-50 text-slate-400 group-hover:bg-violet-50 group-hover:text-violet-600 rounded-full transition-all">
                            {post.category}
                        </span>
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-lg font-black text-slate-900 group-hover:text-violet-600 transition-colors leading-tight">
                            {post.title}
                        </h3>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed line-clamp-2">
                            {post.snippet}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        {post.tags.map(tag => (
                            <span key={tag} className="text-[9px] font-black text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md group-hover:bg-violet-50 group-hover:text-violet-400 transition-all">
                                #{tag.toUpperCase()}
                            </span>
                        ))}
                    </div>
                    <div className="flex items-center gap-6 pt-3 border-t border-slate-50">
                        <button 
                            onClick={onLike}
                            className={clsx(
                                "flex items-center gap-1.5 text-[11px] font-black transition-colors",
                                isLiked ? "text-rose-500" : "text-slate-400 hover:text-rose-500"
                            )}
                        >
                            <HiThumbUp className={clsx("w-3.5 h-3.5", isLiked && "fill-current")} />
                            {post.likes + (isLiked ? 1 : 0)}
                        </button>
                        <div className="flex items-center gap-1.5 text-[11px] font-black text-slate-400 group-hover:text-slate-600 transition-colors">
                            <HiChat className="w-3.5 h-3.5" />
                            {post.replies}
                        </div>
                        {post.isHot && (
                            <span className="ml-auto flex items-center gap-1 text-[9px] font-black text-orange-500 uppercase tracking-widest">
                                <HiFire className="w-3 h-3" /> Trending
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex items-center text-slate-200 group-hover:text-violet-400 transition-colors translate-x-0 group-hover:translate-x-1 duration-300">
                    <HiChevronRight className="w-6 h-6" />
                </div>
            </div>
        </div>
    );
}
