import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import {
    HiArchive,
    HiBookOpen,
    HiCalendar,
    HiCheckCircle,
    HiClock,
    HiDesktopComputer,
    HiDocumentReport,
    HiDocumentText,
    HiDotsVertical,
    HiExclamationCircle,
    HiPlus,
    HiRefresh,
    HiSearch,
    HiShieldCheck,
    HiUserCircle,
    HiX,
} from 'react-icons/hi';

import { createIssueReport, fetchIssueReports, updateIssueReportStatus } from '../../services/learnerApi';

const CATEGORY_CONFIG = {
    Technical: { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: HiDesktopComputer, dot: 'bg-blue-500' },
    Content: { color: 'bg-violet-100 text-violet-700 border-violet-200', icon: HiBookOpen, dot: 'bg-violet-500' },
    Account: { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: HiUserCircle, dot: 'bg-emerald-500' },
    Billing: { color: 'bg-amber-100 text-amber-700 border-amber-200', icon: HiDocumentReport, dot: 'bg-amber-500' },
    Security: { color: 'bg-rose-100 text-rose-700 border-rose-200', icon: HiShieldCheck, dot: 'bg-rose-500' },
    Other: { color: 'bg-slate-100 text-slate-700 border-slate-200', icon: HiExclamationCircle, dot: 'bg-slate-500' },
};

const STATUS_CONFIG = {
    open: { color: 'bg-rose-100 text-rose-700', icon: HiExclamationCircle, label: 'Open' },
    in_review: { color: 'bg-orange-100 text-orange-700', icon: HiClock, label: 'In Review' },
    resolved: { color: 'bg-emerald-100 text-emerald-700', icon: HiCheckCircle, label: 'Resolved' },
    closed: { color: 'bg-slate-100 text-slate-500', icon: HiArchive, label: 'Closed' },
};

const CATEGORY_OPTIONS = Object.keys(CATEGORY_CONFIG);
const PRIORITY_OPTIONS = [
    { value: 'high', label: 'High' },
    { value: 'normal', label: 'Normal' },
    { value: 'low', label: 'Low' },
];

const formatReport = (report) => ({
    id: report._id,
    name: report.title,
    type: report.category,
    status: report.status,
    priority: report.priority || 'normal',
    date: report.createdAt
        ? new Date(report.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        })
        : 'Just now',
    description: report.description || '',
    reporterName: report.reportedBy?.name || 'Unknown User',
    reporterEmail: report.reportedBy?.email || '',
    reporterRole: report.reportedByRole || report.reportedBy?.role || 'learner',
});

export default function SystemReports() {
    const { user } = useSelector((state) => state.auth);
    const isAdmin = user?.role === 'admin';

    const [reports, setReports] = useState([]);
    const [search, setSearch] = useState('');
    const [filterCategory, setFilterCategory] = useState('All');
    const [filterStatus, setFilterStatus] = useState('All');
    const [openMenuId, setOpenMenuId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedReport, setSelectedReport] = useState(null);

    useEffect(() => {
        let mounted = true;

        const loadReports = async () => {
            try {
                setLoading(true);
                const data = await fetchIssueReports();
                if (!mounted) return;
                setReports((Array.isArray(data) ? data : []).map(formatReport));
            } catch (error) {
                if (mounted) toast.error(error.message || 'Failed to load complaints');
            } finally {
                if (mounted) setLoading(false);
            }
        };

        loadReports();

        return () => {
            mounted = false;
        };
    }, []);

    const filtered = useMemo(() => {
        return reports.filter((report) => {
            const query = search.trim().toLowerCase();
            const matchSearch =
                !query ||
                report.name.toLowerCase().includes(query) ||
                report.description.toLowerCase().includes(query) ||
                report.reporterName.toLowerCase().includes(query);
            const matchCategory = filterCategory === 'All' || report.type === filterCategory;
            const matchStatus = filterStatus === 'All' || report.status === filterStatus;
            return matchSearch && matchCategory && matchStatus;
        });
    }, [reports, search, filterCategory, filterStatus]);

    const stats = [
        { label: 'Total Reports', value: reports.length, icon: HiDocumentReport, color: 'bg-violet-50 text-violet-600' },
        { label: 'Open', value: reports.filter((report) => report.status === 'open').length, icon: HiExclamationCircle, color: 'bg-rose-50 text-rose-600' },
        { label: 'In Review', value: reports.filter((report) => report.status === 'in_review').length, icon: HiRefresh, color: 'bg-orange-50 text-orange-600' },
        { label: 'Resolved', value: reports.filter((report) => report.status === 'resolved').length, icon: HiCheckCircle, color: 'bg-emerald-50 text-emerald-600' },
    ];

    const clearFilters = () => {
        setSearch('');
        setFilterCategory('All');
        setFilterStatus('All');
    };

    const hasFilters = Boolean(search || filterCategory !== 'All' || filterStatus !== 'All');

    const handleCreateReport = async (payload) => {
        try {
            const created = await createIssueReport(payload);
            setReports((current) => [formatReport(created), ...current]);
            setIsCreateModalOpen(false);
            toast.success('Complaint submitted successfully');
        } catch (error) {
            toast.error(error.message || 'Failed to submit complaint');
        }
    };

    const handleStatusUpdate = async (reportId, status) => {
        try {
            const updated = await updateIssueReportStatus(reportId, { status });
            const formatted = formatReport(updated);
            setReports((current) => current.map((item) => (item.id === reportId ? formatted : item)));
            setSelectedReport((current) => (current?.id === reportId ? formatted : current));
            setOpenMenuId(null);
            toast.success('Complaint status updated');
        } catch (error) {
            toast.error(error.message || 'Failed to update complaint');
        }
    };

    return (
        <div className="p-6 space-y-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold text-slate-900">
                        {isAdmin ? 'Operational Reports' : 'Report an Issue'}
                    </h1>
                    <p className="text-slate-500 text-sm">
                        {isAdmin
                            ? 'Review complaints coming from learners and instructors across the platform.'
                            : 'Submit platform issues here and track the complaints you have already raised.'}
                    </p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold rounded-xl shadow-md shadow-violet-200 transition-all hover:shadow-lg hover:shadow-violet-200 active:scale-95"
                >
                    <HiPlus className="w-4 h-4" />
                    {isAdmin ? 'Log New Complaint' : 'Report New Issue'}
                </button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <div key={stat.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
                            <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${stat.color}`}>
                                <Icon className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-2xl font-black text-slate-900">{stat.value}</p>
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{stat.label}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center">
                <div className="relative flex-1 max-w-sm">
                    <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search complaints..."
                        className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all"
                    />
                </div>
                <div className="flex flex-wrap gap-2">
                    <select
                        value={filterCategory}
                        onChange={(event) => setFilterCategory(event.target.value)}
                        className="px-3 py-2.5 text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all cursor-pointer"
                    >
                        <option value="All">All Categories</option>
                        {CATEGORY_OPTIONS.map((category) => (
                            <option key={category} value={category}>{category}</option>
                        ))}
                    </select>
                    <select
                        value={filterStatus}
                        onChange={(event) => setFilterStatus(event.target.value)}
                        className="px-3 py-2.5 text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all cursor-pointer"
                    >
                        <option value="All">All Statuses</option>
                        <option value="open">Open</option>
                        <option value="in_review">In Review</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                    </select>
                    {hasFilters && (
                        <button
                            onClick={clearFilters}
                            className="px-3 py-2.5 text-xs font-semibold text-slate-500 hover:text-rose-600 bg-slate-50 border border-slate-200 hover:border-rose-200 hover:bg-rose-50 rounded-xl transition-all flex items-center gap-1.5"
                        >
                            <HiX className="w-3.5 h-3.5" />
                            Clear
                        </button>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-24 bg-white rounded-2xl border border-slate-100 shadow-sm text-slate-500">
                    Loading complaints...
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-slate-100 shadow-sm">
                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                        <HiDocumentText className="w-8 h-8 text-slate-300" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-700 mb-1">No complaints found</h3>
                    <p className="text-sm text-slate-400 mb-4">Try adjusting your search or filter criteria.</p>
                    <div className="flex items-center gap-4">
                        <button onClick={clearFilters} className="text-sm font-bold text-violet-600 hover:text-violet-700 underline underline-offset-2">
                            Clear all filters
                        </button>
                        <button onClick={() => setIsCreateModalOpen(true)} className="text-sm font-bold text-slate-600 hover:text-violet-700 underline underline-offset-2">
                            Create complaint
                        </button>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filtered.map((report) => {
                        const catCfg = CATEGORY_CONFIG[report.type] || CATEGORY_CONFIG.Other;
                        const statusCfg = STATUS_CONFIG[report.status] || STATUS_CONFIG.closed;
                        const CatIcon = catCfg.icon;
                        const StatusIcon = statusCfg.icon;

                        return (
                            <div key={report.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 p-6 flex flex-col gap-5 relative overflow-hidden group">
                                <div className={`absolute top-0 left-0 w-full h-1 ${catCfg.dot}`} />
                                {report.status === 'in_review' && (
                                    <div className="absolute top-0 left-0 w-full h-1 bg-orange-400 animate-pulse" />
                                )}

                                <div className="flex items-start justify-between">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${catCfg.color}`}>
                                        <CatIcon className="w-5 h-5" />
                                    </div>
                                    <div className="relative">
                                        <button
                                            onClick={() => setOpenMenuId(openMenuId === report.id ? null : report.id)}
                                            className="p-1.5 text-slate-300 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                        >
                                            <HiDotsVertical className="w-4 h-4" />
                                        </button>
                                        {openMenuId === report.id && (
                                            <ReportMenu
                                                report={report}
                                                isAdmin={isAdmin}
                                                onClose={() => setOpenMenuId(null)}
                                                onView={() => setSelectedReport(report)}
                                                onStatusUpdate={handleStatusUpdate}
                                            />
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <h3 className="font-bold text-slate-900 text-sm leading-snug group-hover:text-violet-600 transition-colors line-clamp-2">
                                        {report.name}
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border ${catCfg.color}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${catCfg.dot}`} />
                                            {report.type}
                                        </span>
                                        <span
                                            className={clsx(
                                                'text-[10px] font-black px-2 py-0.5 rounded-md border uppercase tracking-wider',
                                                report.priority === 'high'
                                                    ? 'bg-rose-50 text-rose-600 border-rose-200'
                                                    : report.priority === 'low'
                                                        ? 'bg-slate-50 text-slate-600 border-slate-200'
                                                        : 'bg-violet-50 text-violet-600 border-violet-200'
                                            )}
                                        >
                                            {report.priority}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 line-clamp-3">{report.description}</p>
                                </div>

                                <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                                    <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                                        <HiCalendar className="w-3.5 h-3.5" />
                                        {report.date}
                                    </div>
                                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full ${statusCfg.color}`}>
                                        <StatusIcon className="w-3 h-3" />
                                        {statusCfg.label}
                                    </span>
                                </div>

                                {report.status === 'in_review' ? (
                                    <div className="flex items-center gap-2 text-xs text-orange-600 font-semibold bg-orange-50 border border-orange-100 rounded-xl px-3 py-2">
                                        <HiRefresh className="w-3.5 h-3.5 animate-spin" />
                                        Complaint is under admin review.
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setSelectedReport(report)}
                                        className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-violet-600 bg-violet-50 border border-violet-200 rounded-xl hover:bg-violet-600 hover:text-white transition-all"
                                    >
                                        <HiDocumentReport className="w-3.5 h-3.5" />
                                        View Complaint
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            <CreateReportModal
                open={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSubmit={handleCreateReport}
                userRole={user?.role}
            />

            <ReportDetailModal
                report={selectedReport}
                isAdmin={isAdmin}
                onClose={() => setSelectedReport(null)}
                onStatusUpdate={handleStatusUpdate}
            />
        </div>
    );
}

function ReportMenu({ report, isAdmin, onClose, onView, onStatusUpdate }) {
    return (
        <>
            <div className="fixed inset-0 z-40" onClick={onClose} />
            <div className="absolute right-0 mt-1 w-44 bg-white border border-slate-100 rounded-xl shadow-xl py-1.5 z-50">
                <button
                    onClick={() => {
                        onClose();
                        onView();
                    }}
                    className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-violet-50 hover:text-violet-600 transition-colors flex items-center gap-2"
                >
                    <HiDocumentReport className="w-3.5 h-3.5" />
                    View Details
                </button>
                {isAdmin && (
                    <>
                        <button
                            onClick={() => onStatusUpdate(report.id, 'in_review')}
                            className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-orange-50 hover:text-orange-600 transition-colors flex items-center gap-2"
                        >
                            <HiRefresh className="w-3.5 h-3.5" />
                            Mark In Review
                        </button>
                        <button
                            onClick={() => onStatusUpdate(report.id, 'resolved')}
                            className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-600 transition-colors flex items-center gap-2"
                        >
                            <HiCheckCircle className="w-3.5 h-3.5" />
                            Mark Resolved
                        </button>
                        <div className="my-1 border-t border-slate-100" />
                        <button
                            onClick={() => onStatusUpdate(report.id, 'closed')}
                            className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50 transition-colors flex items-center gap-2"
                        >
                            <HiArchive className="w-3.5 h-3.5" />
                            Close Complaint
                        </button>
                    </>
                )}
            </div>
        </>
    );
}

function CreateReportModal({ open, onClose, onSubmit, userRole }) {
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('Technical');
    const [priority, setPriority] = useState('normal');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!open) return null;

    const handleSubmit = async (event) => {
        event.preventDefault();
        try {
            setIsSubmitting(true);
            await onSubmit({ title, category, priority, description });
            setTitle('');
            setCategory('Technical');
            setPriority('normal');
            setDescription('');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative z-10 w-full max-w-2xl rounded-3xl bg-white shadow-2xl p-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Create Complaint</h2>
                        <p className="text-sm text-slate-500 mt-1">This issue will appear directly in the admin reports queue.</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all">
                        <HiX className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Issue Title</label>
                        <input
                            required
                            value={title}
                            onChange={(event) => setTitle(event.target.value)}
                            placeholder="Short summary of the issue"
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Category</label>
                            <select
                                value={category}
                                onChange={(event) => setCategory(event.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500"
                            >
                                {CATEGORY_OPTIONS.map((item) => (
                                    <option key={item} value={item}>{item}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Priority</label>
                            <select
                                value={priority}
                                onChange={(event) => setPriority(event.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500"
                            >
                                {PRIORITY_OPTIONS.map((item) => (
                                    <option key={item.value} value={item.value}>{item.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Reporter Role</label>
                            <div className="px-4 py-3 rounded-xl border border-slate-200 bg-slate-100 text-sm font-semibold text-slate-600 capitalize">
                                {userRole || 'user'}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Issue Details</label>
                        <textarea
                            required
                            rows={5}
                            value={description}
                            onChange={(event) => setDescription(event.target.value)}
                            placeholder="Explain what happened, where it happened, and what the expected result should be."
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 resize-none"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                        <button type="button" onClick={onClose} disabled={isSubmitting} className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all">
                            Cancel
                        </button>
                        <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 text-sm font-bold text-white bg-violet-600 hover:bg-violet-700 rounded-xl transition-all disabled:opacity-60">
                            {isSubmitting ? 'Submitting...' : 'Submit Complaint'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function ReportDetailModal({ report, isAdmin, onClose, onStatusUpdate }) {
    if (!report) return null;

    const statusCfg = STATUS_CONFIG[report.status] || STATUS_CONFIG.closed;
    const StatusIcon = statusCfg.icon;
    const catCfg = CATEGORY_CONFIG[report.type] || CATEGORY_CONFIG.Other;
    const CatIcon = catCfg.icon;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative z-10 w-full max-w-2xl rounded-3xl bg-white shadow-2xl p-8">
                <div className="flex items-start justify-between gap-4 mb-6">
                    <div className="space-y-3">
                        <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border ${catCfg.color}`}>
                            <CatIcon className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-wider">{report.type}</span>
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">{report.name}</h2>
                        <p className="text-sm text-slate-500">
                            Raised by {report.reporterName} ({report.reporterRole}) on {report.date}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all">
                        <HiX className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-5">
                    <div className="flex flex-wrap gap-3">
                        <span className={`inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full ${statusCfg.color}`}>
                            <StatusIcon className="w-4 h-4" />
                            {statusCfg.label}
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700 capitalize">
                            Priority: {report.priority}
                        </span>
                    </div>

                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                        <p className="text-sm font-semibold text-slate-600 mb-2">Complaint Details</p>
                        <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">{report.description}</p>
                    </div>

                    {report.reporterEmail && (
                        <div className="rounded-2xl border border-slate-100 p-4 text-sm text-slate-600">
                            Reporter Email: <span className="font-semibold text-slate-800">{report.reporterEmail}</span>
                        </div>
                    )}

                    {isAdmin && (
                        <div className="rounded-2xl border border-slate-100 p-5 space-y-3">
                            <p className="text-sm font-semibold text-slate-700">Admin Actions</p>
                            <div className="flex flex-wrap gap-3">
                                <button onClick={() => onStatusUpdate(report.id, 'open')} className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition-all">
                                    Mark Open
                                </button>
                                <button onClick={() => onStatusUpdate(report.id, 'in_review')} className="px-4 py-2 text-xs font-bold rounded-xl bg-orange-50 text-orange-600 hover:bg-orange-100 transition-all">
                                    Mark In Review
                                </button>
                                <button onClick={() => onStatusUpdate(report.id, 'resolved')} className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-all">
                                    Mark Resolved
                                </button>
                                <button onClick={() => onStatusUpdate(report.id, 'closed')} className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all">
                                    Close
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
