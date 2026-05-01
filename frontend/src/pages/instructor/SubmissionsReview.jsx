import { useEffect, useMemo, useState } from 'react';
import {
    HiAcademicCap,
    HiClock,
    HiDocumentText,
    HiDownload,
    HiFilter,
    HiPencil,
    HiPresentationChartLine,
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Avatar from '../../components/ui/Avatar';
import SearchBar from '../../components/ui/SearchBar';
import Select from '../../components/ui/Select';
import {
    fetchInstructorQuizAttempts,
    fetchInstructorSubmissionFeed,
    gradeSubmission,
    reviewQuizAttempt,
} from '../../services/instructorApi';

const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://127.0.0.1:5000';

const mapAssignmentSubmission = (submission) => ({
    id: submission._id || submission.id,
    type: 'assignment',
    label: 'Assignment',
    title: submission.assignmentId?.title || 'Assignment',
    course: submission.assignmentId?.courseId?.title || 'Course',
    studentName: submission.userId?.name || 'Unknown Student',
    studentEmail: submission.userId?.email || 'student@example.com',
    submittedAt: submission.createdAt || null,
    grade: submission.grade,
    feedback: submission.feedback || '',
    status: submission.grade === null || submission.grade === undefined ? 'needs_grading' : 'graded',
    fileUrl: submission.fileUrl || '',
});

const mapQuizAttempt = (attempt) => ({
    id: attempt._id || attempt.id,
    type: 'quiz',
    label: 'Quiz',
    title: attempt.quizId?.title || 'Quiz',
    course: attempt.quizId?.courseId?.title || 'Course',
    studentName: attempt.userId?.name || 'Unknown Student',
    studentEmail: attempt.userId?.email || 'student@example.com',
    submittedAt: attempt.completedAt || null,
    grade: attempt.percentage ?? 0,
    feedback: attempt.feedback || '',
    status: attempt.reviewedAt ? 'graded' : 'needs_grading',
    scoreText: `${attempt.score ?? 0}/${attempt.total ?? 0}`,
});

const formatDate = (value) => {
    if (!value) return 'N/A';
    return new Date(value).toLocaleString();
};

export default function SubmissionsReview() {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingRecord, setEditingRecord] = useState(null);
    const [editOpen, setEditOpen] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const [assignmentData, quizData] = await Promise.all([
                    fetchInstructorSubmissionFeed('all'),
                    fetchInstructorQuizAttempts('all'),
                ]);

                const assignmentRows = Array.isArray(assignmentData) ? assignmentData.map(mapAssignmentSubmission) : [];
                const quizRows = Array.isArray(quizData) ? quizData.map(mapQuizAttempt) : [];

                setRecords(
                    [...assignmentRows, ...quizRows].sort(
                        (a, b) => new Date(b.submittedAt || 0).getTime() - new Date(a.submittedAt || 0).getTime()
                    )
                );
            } catch (error) {
                toast.error(error?.message || 'Failed to load submissions');
                setRecords([]);
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [refreshKey]);

    const filteredRecords = useMemo(() => {
        return records.filter((record) => {
            const query = search.trim().toLowerCase();
            const matchesSearch = !query
                || record.studentName.toLowerCase().includes(query)
                || record.studentEmail.toLowerCase().includes(query)
                || record.title.toLowerCase().includes(query)
                || record.course.toLowerCase().includes(query);
            const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
            const matchesType = typeFilter === 'all' || record.type === typeFilter;

            return matchesSearch && matchesStatus && matchesType;
        });
    }, [records, search, statusFilter, typeFilter]);

    const pendingCount = filteredRecords.filter((record) => record.status === 'needs_grading').length;

    return (
        <div className="p-6 space-y-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold text-slate-900">Submissions</h1>
                    <p className="text-slate-600">Review every assignment submission and quiz attempt in one place.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" icon={<HiDownload />} onClick={() => toast.success('Export is being prepared.')}>
                        Export
                    </Button>
                    <Badge color="amber" size="lg" className="px-4 py-2 font-bold">
                        {pendingCount} Pending
                    </Badge>
                </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-surface-border shadow-card flex flex-col lg:flex-row gap-4">
                <SearchBar
                    value={search}
                    onChange={setSearch}
                    placeholder="Search students, assessments, or courses..."
                    className="flex-1"
                />
                <div className="lg:w-52">
                    <Select
                        value={typeFilter}
                        onChange={setTypeFilter}
                        options={[
                            { label: 'All Types', value: 'all' },
                            { label: 'Assignments', value: 'assignment' },
                            { label: 'Quizzes', value: 'quiz' },
                        ]}
                    />
                </div>
                <div className="lg:w-52">
                    <Select
                        value={statusFilter}
                        onChange={setStatusFilter}
                        options={[
                            { label: 'All Statuses', value: 'all' },
                            { label: 'Needs Grading', value: 'needs_grading' },
                            { label: 'Graded', value: 'graded' },
                        ]}
                    />
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-surface-border shadow-card overflow-hidden">
                {loading ? (
                    <div className="p-10 text-center text-slate-500 font-medium">Loading submissions...</div>
                ) : filteredRecords.length === 0 ? (
                    <div className="p-16 text-center">
                        <HiDocumentText className="w-14 h-14 text-slate-200 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-slate-800">No records found</h3>
                        <p className="text-sm text-slate-500">Submissions and quiz attempts will appear here once learners start participating.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-surface-border">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-500">Student</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-500">Assessment</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-500">Course</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-500">Submitted</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-500">Status</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-500 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-surface-border">
                                {filteredRecords.map((record) => (
                                    <tr key={`${record.type}-${record.id}`} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <Avatar name={record.studentName} size="sm" />
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900">{record.studentName}</p>
                                                    <p className="text-[11px] text-slate-500">{record.studentEmail}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                <p className="text-sm font-semibold text-slate-900">{record.title}</p>
                                                <Badge color={record.type === 'assignment' ? 'blue' : 'violet'}>
                                                    {record.label}
                                                </Badge>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-slate-700">{record.course}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-xs text-slate-600">
                                                <HiClock className="w-4 h-4 text-slate-400" />
                                                {formatDate(record.submittedAt)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                <Badge color={record.status === 'graded' ? 'green' : 'amber'} dot>
                                                    {record.status === 'graded' ? 'GRADED' : 'NEEDS GRADING'}
                                                </Badge>
                                                {record.type === 'quiz' ? (
                                                    <p className="text-[11px] font-semibold text-slate-600">
                                                        Score: {record.scoreText} ({record.grade}%)
                                                    </p>
                                                ) : record.grade !== null && record.grade !== undefined ? (
                                                    <p className="text-[11px] font-semibold text-slate-600">Grade: {record.grade}%</p>
                                                ) : null}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                {record.type === 'assignment' && record.fileUrl && (
                                                    <a href={`${API_BASE}${record.fileUrl}`} target="_blank" rel="noreferrer">
                                                        <Button size="sm" variant="outline">Open File</Button>
                                                    </a>
                                                )}
                                                <Button
                                                    size="sm"
                                                    icon={record.type === 'quiz' ? <HiPresentationChartLine /> : <HiPencil />}
                                                    onClick={() => {
                                                        setEditingRecord(record);
                                                        setEditOpen(true);
                                                    }}
                                                >
                                                    {record.status === 'graded' ? 'Edit Grade' : 'Review & Grade'}
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <ReviewModal
                open={editOpen}
                record={editingRecord}
                onClose={() => {
                    setEditOpen(false);
                    setEditingRecord(null);
                }}
                onSaved={() => setRefreshKey((value) => value + 1)}
            />
        </div>
    );
}

function ReviewModal({ open, record, onClose, onSaved }) {
    const [grade, setGrade] = useState('');
    const [feedback, setFeedback] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!open || !record) return;
        setGrade(record.grade ?? '');
        setFeedback(record.feedback || '');
    }, [open, record]);

    if (!open || !record) return null;

    const handleSave = async () => {
        const parsedGrade = Number(grade);
        if (!Number.isFinite(parsedGrade) || parsedGrade < 0 || parsedGrade > 100) {
            toast.error('Grade must be between 0 and 100');
            return;
        }

        setSaving(true);
        try {
            if (record.type === 'assignment') {
                await gradeSubmission(record.id, { grade: parsedGrade, feedback });
            } else {
                await reviewQuizAttempt(record.id, { grade: parsedGrade, feedback });
            }

            toast.success(`${record.label} graded successfully`);
            onSaved?.();
            onClose?.();
        } catch (error) {
            toast.error(error?.message || 'Failed to save grade');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-lg rounded-2xl bg-white border border-surface-border shadow-card p-6 space-y-5">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-xs font-black uppercase tracking-widest text-primary-500">{record.label}</p>
                        <h2 className="text-xl font-bold text-slate-900">{record.title}</h2>
                        <p className="text-sm text-slate-500 mt-1">{record.studentName} · {record.course}</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">Close</button>
                </div>

                {record.type === 'quiz' && (
                    <div className="rounded-xl border border-violet-200 bg-violet-50 p-4 text-sm text-violet-900">
                        Auto-calculated result: <span className="font-bold">{record.scoreText}</span> which is <span className="font-bold">{record.grade}%</span>.
                    </div>
                )}

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-slate-800 mb-2">Final Grade (%)</label>
                        <input
                            type="number"
                            min="0"
                            max="100"
                            value={grade}
                            onChange={(event) => setGrade(event.target.value)}
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-800 mb-2">Feedback</label>
                        <textarea
                            rows={4}
                            value={feedback}
                            onChange={(event) => setFeedback(event.target.value)}
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 resize-none"
                            placeholder="Add feedback for the learner"
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
                    <Button onClick={handleSave} disabled={saving || grade === ''}>
                        {saving ? 'Saving...' : 'Save Grade'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
