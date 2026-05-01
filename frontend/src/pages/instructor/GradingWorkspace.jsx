import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
    HiAcademicCap,
    HiArrowLeft,
    HiCheck,
    HiClipboardCheck,
    HiClock,
    HiDocumentText,
    HiPresentationChartLine,
} from 'react-icons/hi';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import {
    fetchInstructorQuizAttempts,
    fetchInstructorSubmissionFeed,
    fetchQuizAttemptResult,
    fetchSubmissionById,
    gradeSubmission,
    reviewQuizAttempt,
} from '../../services/instructorApi';

const mapAssignmentRecord = (submission) => ({
    id: submission._id || submission.id,
    type: 'assignment',
    title: submission.assignmentId?.title || 'Assignment',
    course: submission.assignmentId?.courseId?.title || 'Course',
    studentName: submission.userId?.name || 'Unknown Student',
    studentEmail: submission.userId?.email || 'student@example.com',
    submittedAt: submission.createdAt || submission.gradedAt || null,
    grade: submission.grade ?? '',
    feedback: submission.feedback || '',
    meta: submission.fileUrl ? `File submission` : 'Assignment submission',
});

const mapQuizRecord = (attempt) => ({
    id: attempt._id || attempt.id,
    type: 'quiz',
    title: attempt.quizId?.title || 'Quiz',
    course: attempt.quizId?.courseId?.title || 'Course',
    studentName: attempt.userId?.name || 'Unknown Student',
    studentEmail: attempt.userId?.email || 'student@example.com',
    submittedAt: attempt.completedAt || attempt.reviewedAt || null,
    grade: attempt.percentage ?? '',
    feedback: attempt.feedback || '',
    meta: `Attempt score ${attempt.score ?? 0}/${attempt.total ?? 0}`,
});

const formatDate = (value) => {
    if (!value) return 'N/A';
    return new Date(value).toLocaleString();
};

export default function GradingWorkspace() {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const [records, setRecords] = useState([]);
    const [record, setRecord] = useState(null);
    const [grade, setGrade] = useState('');
    const [feedback, setFeedback] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const recordType = new URLSearchParams(location.search).get('type');

    useEffect(() => {
        const loadList = async () => {
            setLoading(true);
            try {
                const [assignmentData, quizData] = await Promise.all([
                    fetchInstructorSubmissionFeed('graded'),
                    fetchInstructorQuizAttempts('graded'),
                ]);

                const nextRecords = [
                    ...(Array.isArray(assignmentData) ? assignmentData.map(mapAssignmentRecord) : []),
                    ...(Array.isArray(quizData) ? quizData.map(mapQuizRecord) : []),
                ].sort((a, b) => new Date(b.submittedAt || 0).getTime() - new Date(a.submittedAt || 0).getTime());

                setRecords(nextRecords);
            } catch (error) {
                toast.error(error?.message || 'Failed to load graded records');
                setRecords([]);
            } finally {
                setLoading(false);
            }
        };

        if (!id) {
            loadList();
        }
    }, [id]);

    useEffect(() => {
        const loadDetail = async () => {
            if (!id) return;

            setLoading(true);
            try {
                let nextRecord = null;

                if (recordType === 'assignment') {
                    nextRecord = mapAssignmentRecord(await fetchSubmissionById(id));
                } else if (recordType === 'quiz') {
                    nextRecord = mapQuizRecord(await fetchQuizAttemptResult(id));
                } else {
                    try {
                        nextRecord = mapAssignmentRecord(await fetchSubmissionById(id));
                    } catch {
                        nextRecord = mapQuizRecord(await fetchQuizAttemptResult(id));
                    }
                }

                setRecord(nextRecord);
                setGrade(nextRecord.grade ?? '');
                setFeedback(nextRecord.feedback || '');
            } catch (error) {
                toast.error(error?.message || 'Failed to load grade record');
                setRecord(null);
            } finally {
                setLoading(false);
            }
        };

        loadDetail();
    }, [id, recordType]);

    const groupedRecords = useMemo(() => {
        return records.reduce((groups, current) => {
            if (!groups[current.course]) {
                groups[current.course] = [];
            }
            groups[current.course].push(current);
            return groups;
        }, {});
    }, [records]);

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

            toast.success('Grade updated successfully');
            navigate('/instructor/grading');
        } catch (error) {
            toast.error(error?.message || 'Failed to update grade');
        } finally {
            setSaving(false);
        }
    };

    if (!id) {
        return (
            <div className="p-6 space-y-8 max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-bold text-slate-900">Grading</h1>
                        <p className="text-slate-600">All instructor-graded assignments and quizzes, organized course-wise.</p>
                    </div>
                    <Badge color="green" size="lg" className="px-4 py-2 font-bold">
                        {records.length} Graded
                    </Badge>
                </div>

                {loading ? (
                    <div className="bg-white rounded-2xl border border-surface-border shadow-card p-10 text-center text-slate-500">
                        Loading graded records...
                    </div>
                ) : records.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-surface-border shadow-card p-16 text-center">
                        <HiClipboardCheck className="w-14 h-14 text-slate-200 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-slate-800">No graded work yet</h3>
                        <p className="text-sm text-slate-500">Once you grade assignment submissions or quiz attempts, they will appear here by course.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {Object.entries(groupedRecords).map(([course, items]) => (
                            <section key={course} className="bg-white rounded-2xl border border-surface-border shadow-card overflow-hidden">
                                <div className="px-6 py-5 border-b border-surface-border flex items-center justify-between">
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-900">{course}</h2>
                                        <p className="text-sm text-slate-500">{items.length} graded record{items.length === 1 ? '' : 's'}</p>
                                    </div>
                                    <Badge color="blue">{items.filter((item) => item.type === 'assignment').length} assignments</Badge>
                                </div>
                                <div className="divide-y divide-surface-border">
                                    {items.map((item) => (
                                        <div key={`${item.type}-${item.id}`} className="px-6 py-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-base font-semibold text-slate-900">{item.title}</p>
                                                    <Badge color={item.type === 'assignment' ? 'blue' : 'violet'}>
                                                        {item.type === 'assignment' ? 'Assignment' : 'Quiz'}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-slate-600">{item.studentName} · {item.studentEmail}</p>
                                                <p className="text-xs text-slate-500">{item.meta} · {formatDate(item.submittedAt)}</p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <Badge color="green">Grade {item.grade}%</Badge>
                                                <Button
                                                    size="sm"
                                                    onClick={() => navigate(`/instructor/grading/${item.id}?type=${item.type}`)}
                                                >
                                                    Edit Grade
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex h-[calc(100vh-64px)] items-center justify-center bg-slate-50">
                <div className="text-slate-500 font-medium">Loading grade record...</div>
            </div>
        );
    }

    if (!record) {
        return (
            <div className="flex h-[calc(100vh-64px)] items-center justify-center bg-slate-50 p-8 text-center">
                <div className="max-w-md">
                    <HiDocumentText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-slate-800 mb-2">Grade record not found</h2>
                    <p className="text-slate-500 mb-6">The selected graded item could not be loaded.</p>
                    <Button onClick={() => navigate('/instructor/grading')}>Back to Grading</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
            <Button variant="outline" onClick={() => navigate('/instructor/grading')}>
                <HiArrowLeft className="mr-2" /> Back to Grading
            </Button>

            <div className="bg-white rounded-2xl border border-surface-border shadow-card p-8 space-y-6">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Badge color={record.type === 'assignment' ? 'blue' : 'violet'}>
                                {record.type === 'assignment' ? 'Assignment' : 'Quiz'}
                            </Badge>
                            <Badge color="green">Graded</Badge>
                        </div>
                        <h1 className="text-3xl font-bold text-slate-900">{record.title}</h1>
                        <p className="text-slate-600">{record.course}</p>
                        <p className="text-sm text-slate-500">{record.studentName} · {record.studentEmail}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 border border-slate-200 px-5 py-4 text-right">
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Current Grade</p>
                        <p className="text-3xl font-black text-primary-600">{record.grade}%</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-xl border border-slate-200 p-4">
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Submitted</p>
                        <p className="text-sm text-slate-700 flex items-center gap-2"><HiClock className="w-4 h-4" /> {formatDate(record.submittedAt)}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 p-4">
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Assessment Info</p>
                        <p className="text-sm text-slate-700 flex items-center gap-2">
                            {record.type === 'assignment' ? <HiDocumentText className="w-4 h-4" /> : <HiPresentationChartLine className="w-4 h-4" />}
                            {record.meta}
                        </p>
                    </div>
                </div>

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
                            rows={6}
                            value={feedback}
                            onChange={(event) => setFeedback(event.target.value)}
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 resize-none"
                            placeholder="Add feedback for the learner"
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={() => navigate('/instructor/grading')} disabled={saving}>Cancel</Button>
                    <Button onClick={handleSave} disabled={saving || grade === ''}>
                        <HiCheck className="mr-2" />
                        {saving ? 'Saving...' : 'Update Grade'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
