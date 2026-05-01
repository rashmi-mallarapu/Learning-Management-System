import { useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import {
    HiChevronDown,
    HiChevronRight,
    HiClock,
    HiCollection,
    HiInformationCircle,
    HiPlus,
    HiSpeakerphone,
    HiX
} from 'react-icons/hi';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';
import clsx from 'clsx';

import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { createAnnouncementAPI, fetchAnnouncements } from '../../services/learnerApi';

const sora = { fontFamily: "'Sora', sans-serif" };
const mono = { fontFamily: "'DM Mono', monospace" };

const formatAnnouncement = (announcement) => ({
    id: announcement._id,
    title: announcement.title,
    content: announcement.content || '',
    category:
        announcement.audience === 'all'
            ? 'Platform'
            : announcement.audience === 'instructors'
                ? 'Instructor'
                : announcement.audience === 'learners'
                    ? 'Learner'
                    : announcement.courseId?.title || 'Course',
    date: announcement.createdAt
        ? new Date(announcement.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        })
        : '',
    priority: announcement.pinned ? 'high' : 'normal',
    author: announcement.authorId?.name || 'Authorized Member',
    timeLabel: announcement.createdAt
        ? new Date(announcement.createdAt).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
        })
        : 'Just now',
});

export default function AnnouncementsPage() {
    const { user } = useSelector((s) => s.auth);
    const canCreate = user?.role === 'admin' || user?.role === 'instructor';

    const [announcements, setAnnouncements] = useState([]);
    const [selectedDetail, setSelectedDetail] = useState(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    const loadAnnouncements = async () => {
        try {
            setLoading(true);
            const data = await fetchAnnouncements();
            setAnnouncements((Array.isArray(data) ? data : []).map(formatAnnouncement));
        } catch (error) {
            toast.error(error.message || 'Failed to load announcements');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAnnouncements();
    }, []);

    const featuredAnnouncement = useMemo(() => announcements[0] || null, [announcements]);
    const remainingAnnouncements = useMemo(() => announcements.slice(1), [announcements]);

    const handleCreateAnnouncement = async (payload) => {
        const created = await createAnnouncementAPI(payload);
        setAnnouncements((current) => [formatAnnouncement(created), ...current]);
        setIsCreateModalOpen(false);
        toast.success('Announcement broadcasted successfully!');
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-10" style={sora}>
            <div className="max-w-5xl mx-auto space-y-10">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3 text-indigo-600">
                            <HiSpeakerphone className="w-6 h-6" />
                            <span className="text-[11px] font-black uppercase tracking-[0.2em]">Live Updates</span>
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Announcements</h1>
                    </div>

                    {canCreate && (
                        <Button
                            icon={<HiPlus className="w-5 h-5" />}
                            onClick={() => setIsCreateModalOpen(true)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold tracking-wide shadow-lg shadow-indigo-100"
                        >
                            Post Announcement
                        </Button>
                    )}
                </div>

                {featuredAnnouncement && (
                    <div
                        onClick={() => setSelectedDetail(featuredAnnouncement)}
                        className="relative overflow-hidden bg-white rounded-[40px] border border-slate-100 shadow-2xl shadow-indigo-100/50 p-10 group hover:shadow-indigo-200/50 transition-all duration-500 cursor-pointer"
                    >
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl -mr-20 -mt-20 opacity-50" />

                        <div className="relative flex flex-col md:flex-row gap-10 items-center">
                            <div className="w-20 h-20 bg-indigo-600 rounded-[28px] flex items-center justify-center text-white shadow-xl shadow-indigo-100 group-hover:scale-110 transition-transform duration-500">
                                <HiSpeakerphone className="w-10 h-10" />
                            </div>
                            <div className="flex-1 space-y-3 text-center md:text-left">
                                <div className="flex items-center justify-center md:justify-start gap-3">
                                    <Badge
                                        color={featuredAnnouncement.priority === 'high' ? 'rose' : 'blue'}
                                        variant="glass"
                                        className="font-black text-[9px] tracking-widest px-3 py-1 uppercase"
                                    >
                                        {featuredAnnouncement.priority === 'high' ? 'Urgent' : 'Featured'}
                                    </Badge>
                                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest" style={mono}>
                                        {featuredAnnouncement.timeLabel}
                                    </span>
                                </div>
                                <p className="text-sm font-bold text-slate-500">
                                    Posted by {featuredAnnouncement.author}
                                </p>
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-tight group-hover:text-indigo-600 transition-colors">
                                    {featuredAnnouncement.title}
                                </h2>
                                <p className="text-slate-500 font-medium leading-relaxed max-w-2xl text-sm">
                                    {featuredAnnouncement.content.substring(0, 140)}...
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                className="rounded-xl px-10 py-3 border-slate-100 hover:border-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedDetail(featuredAnnouncement);
                                }}
                            >
                                Details
                            </Button>
                        </div>
                    </div>
                )}

                {!loading && announcements.length === 0 && (
                    <div className="bg-white rounded-[32px] border border-slate-100 p-10 text-center text-slate-500 shadow-sm">
                        No announcements available yet.
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence>
                        {remainingAnnouncements.map((item) => (
                            <motion.div
                                key={item.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                            >
                                <AnnouncementCard data={item} onClick={() => setSelectedDetail(item)} />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>

            <AnimatePresence>
                {selectedDetail && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedDetail(null)}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.95 }}
                            className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl p-10 relative z-10"
                        >
                            <button
                                onClick={() => setSelectedDetail(null)}
                                className="absolute top-8 right-8 p-3 bg-slate-50 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all"
                            >
                                <HiX className="w-6 h-6" />
                            </button>

                            <div className="space-y-8">
                                <div className="space-y-4 pr-12">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm">
                                            <HiInformationCircle className="w-7 h-7" />
                                        </div>
                                        <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">
                                            {selectedDetail.category || 'Platform Update'}
                                        </span>
                                    </div>
                                    <h2 className="text-3xl font-black text-slate-900 leading-tight tracking-tight">
                                        {selectedDetail.title}
                                    </h2>
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest" style={mono}>
                                        Published {selectedDetail.date}
                                    </p>
                                    <p className="text-sm font-bold text-slate-500">
                                        Posted by {selectedDetail.author}
                                    </p>
                                </div>

                                <div className="h-px bg-slate-100" />

                                <p className="text-slate-600 font-medium leading-relaxed whitespace-pre-line text-[15px]">
                                    {selectedDetail.content}
                                </p>

                                <div className="pt-6">
                                    <Button
                                        onClick={() => setSelectedDetail(null)}
                                        className="w-full py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl shadow-indigo-100"
                                    >
                                        Got it
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <CreateAnnouncementModal
                open={isCreateModalOpen}
                user={user}
                onClose={() => setIsCreateModalOpen(false)}
                onPublish={handleCreateAnnouncement}
            />
        </div>
    );
}

function CreateAnnouncementModal({ open, onClose, onPublish, user }) {
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('System');
    const [priority, setPriority] = useState('normal');
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!open) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setIsSubmitting(true);
            await onPublish({
                title,
                content,
                audience: user?.role === 'admin' ? 'all' : 'instructors',
                pinned: priority === 'high',
            });
            setTitle('');
            setCategory('System');
            setPriority('normal');
            setContent('');
        } catch (error) {
            toast.error(error.message || 'Failed to publish announcement');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
                    onClick={onClose}
                />
                <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.95 }}
                    className="bg-white w-full max-w-xl rounded-3xl shadow-2xl p-8 relative z-10"
                >
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Post Announcement</h2>
                        <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all">
                            <HiX className="w-5 h-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Announcement Title</label>
                            <input
                                required
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                type="text"
                                placeholder="e.g., Mandatory Maintenance Expected..."
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm font-bold text-slate-800"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Category</label>
                                <CustomSelect
                                    value={category}
                                    onChange={setCategory}
                                    options={[
                                        { value: 'System', label: 'System' },
                                        { value: 'Course', label: 'Course' },
                                        { value: 'Policy', label: 'Policy' },
                                        { value: 'Event', label: 'Event' }
                                    ]}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Priority</label>
                                <CustomSelect
                                    value={priority}
                                    onChange={setPriority}
                                    options={[
                                        { value: 'low', label: 'Standard / Low' },
                                        { value: 'normal', label: 'Normal' },
                                        { value: 'high', label: 'High / Urgent' }
                                    ]}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Details & Content</label>
                            <textarea
                                required
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                rows={4}
                                placeholder="Write the full announcement here..."
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm text-slate-800 font-medium resize-none"
                            />
                        </div>

                        <div className="pt-4 border-t border-slate-100 flex justify-end gap-3 mt-4">
                            <Button variant="outline" type="button" onClick={onClose} className="rounded-xl px-6" disabled={isSubmitting}>
                                Cancel
                            </Button>
                            <Button type="submit" loading={isSubmitting} className="rounded-xl px-8 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-100">
                                Broadcast Now
                            </Button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

function AnnouncementCard({ data, onClick }) {
    const priorityColors = {
        high: 'emerald',
        normal: 'blue',
        low: 'slate'
    };

    return (
        <div
            onClick={onClick}
            className="group bg-white rounded-[32px] border border-slate-100 p-8 shadow-sm hover:shadow-xl hover:shadow-indigo-100/30 transition-all duration-300 flex flex-col cursor-pointer h-full"
        >
            <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 bg-slate-50 text-slate-400 flex items-center justify-center rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                    <HiCollection className="w-6 h-6" />
                </div>
                <Badge color={priorityColors[data.priority]} variant="soft" className="font-black text-[8px] uppercase tracking-widest px-3">
                    {data.category}
                </Badge>
            </div>

            <div className="flex-1 space-y-3">
                <h3 className="text-lg font-black text-slate-900 tracking-tight leading-tight group-hover:text-indigo-600 transition-colors">
                    {data.title}
                </h3>
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                    Posted by {data.author}
                </p>
                <p className="text-sm text-slate-400 font-medium leading-relaxed line-clamp-3">
                    {data.content}
                </p>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <HiClock className="text-slate-300 w-4 h-4" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest" style={mono}>{data.date}</span>
                </div>
                <HiChevronRight className="text-slate-200 group-hover:text-indigo-600 transition-all translate-x-0 group-hover:translate-x-1" />
            </div>
        </div>
    );
}

function CustomSelect({ value, onChange, options }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (ref.current && !ref.current.contains(event.target)) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find((opt) => opt.value === value) || options[0];

    return (
        <div className="relative" ref={ref}>
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className={clsx(
                    'w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none transition-all text-sm font-bold flex justify-between items-center text-left',
                    open ? 'border-indigo-500 ring-2 ring-indigo-500/20 text-indigo-700 bg-white' : 'border-slate-200 hover:border-slate-300 text-slate-800'
                )}
            >
                <span className="truncate">{selectedOption.label}</span>
                <HiChevronDown className={clsx('w-4 h-4 text-slate-400 transition-transform ml-2 shrink-0', open && 'rotate-180')} />
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.15 }}
                        className="absolute z-50 w-full mt-2 bg-white border border-slate-100 rounded-xl shadow-xl shadow-indigo-100/50 py-2 overflow-hidden"
                    >
                        {options.map((opt) => (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => {
                                    onChange(opt.value);
                                    setOpen(false);
                                }}
                                className={clsx(
                                    'w-full px-4 py-2.5 text-left text-sm font-bold transition-colors hover:bg-slate-50',
                                    value === opt.value ? 'text-indigo-600 bg-indigo-50/50' : 'text-slate-700'
                                )}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
