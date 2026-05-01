import { useEffect, useMemo, useRef, useState } from 'react';
import { HiClock, HiCheckCircle, HiUpload, HiPaperClip, HiSearch } from 'react-icons/hi';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { fetchMyAssignments, submitAssignment } from '../../services/learnerApi';

const formatDeadline = (value) => {
    if (!value) return 'No deadline';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'No deadline';
    return date.toLocaleString();
};

const computeStatus = (assignment) => {
    if (assignment.status === 'graded') return 'graded';
    if (assignment.status === 'submitted') return 'submitted';
    return 'pending';
};

const statusBadge = {
    pending: { color: 'amber', label: 'PENDING' },
    submitted: { color: 'blue', label: 'SUBMITTED' },
    graded: { color: 'green', label: 'GRADED' },
};

export default function AssignmentsPage() {
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState('all');
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submittingId, setSubmittingId] = useState('');
    const [selectedAssignmentId, setSelectedAssignmentId] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const fileInputRef = useRef(null);

    const loadAssignments = async () => {
        setLoading(true);
        try {
            const data = await fetchMyAssignments();
            setAssignments(Array.isArray(data) ? data : []);
        } catch (err) {
            setAssignments([]);
            toast.error(err?.message || 'Failed to load assignments');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timerId = setTimeout(() => {
            loadAssignments();
        }, 0);

        return () => clearTimeout(timerId);
    }, []);

    const normalizedAssignments = useMemo(
        () => assignments.map((assignment) => ({
            ...assignment,
            id: String(assignment._id || assignment.id),
            statusKey: computeStatus(assignment),
        })),
        [assignments]
    );

    const filteredAssignments = useMemo(() => {
        return normalizedAssignments.filter((assignment) => {
            const matchesTab = activeTab === 'all' || assignment.statusKey === activeTab;
            const title = String(assignment.title || '').toLowerCase();
            const course = String(assignment.courseId?.title || '').toLowerCase();
            const query = search.toLowerCase();
            const matchesSearch = !query || title.includes(query) || course.includes(query);
            return matchesTab && matchesSearch;
        });
    }, [normalizedAssignments, activeTab, search]);

    const selectedAssignment = useMemo(
        () => normalizedAssignments.find((assignment) => assignment.id === selectedAssignmentId) || null,
        [normalizedAssignments, selectedAssignmentId]
    );

    const stats = useMemo(() => ({
        pending: normalizedAssignments.filter((assignment) => assignment.statusKey === 'pending').length,
        submitted: normalizedAssignments.filter((assignment) => assignment.statusKey === 'submitted').length,
        graded: normalizedAssignments.filter((assignment) => assignment.statusKey === 'graded').length,
    }), [normalizedAssignments]);

    const openFilePicker = (assignmentId) => {
        setSelectedAssignmentId(assignmentId);
        fileInputRef.current?.click();
    };

    const onFilePicked = (event) => {
        const file = event.target.files?.[0] || null;
        setSelectedFile(file);
        event.target.value = '';
    };

    const handleSubmit = async (assignment) => {
        if (!selectedFile || selectedAssignmentId !== assignment.id) {
            toast.error('Please choose a file first');
            return;
        }

        const formData = new FormData();
        formData.append('assignmentId', assignment.id);
        formData.append('file', selectedFile);

        setSubmittingId(assignment.id);
        try {
            await submitAssignment(formData);
            toast.success('Assignment submitted successfully');
            setSelectedFile(null);
            setSelectedAssignmentId('');
            await loadAssignments();
        } catch (err) {
            toast.error(err?.message || 'Failed to submit assignment');
        } finally {
            setSubmittingId('');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-text-primary">Assignments</h1>
                    <p className="text-sm text-text-secondary">Track pending work and submit files directly to your instructor.</p>
                </div>
                <div className="flex gap-3 text-xs">
                    <Badge color="amber">Pending: {stats.pending}</Badge>
                    <Badge color="blue">Submitted: {stats.submitted}</Badge>
                    <Badge color="green">Graded: {stats.graded}</Badge>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-3">
                <div className="relative md:w-80">
                    <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search assignments"
                        className="w-full border border-surface-border rounded-lg pl-10 pr-3 py-2"
                    />
                </div>
                <div className="flex gap-2">
                    {['all', 'pending', 'submitted', 'graded'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={clsx(
                                'px-3 py-2 text-xs font-bold rounded-lg uppercase',
                                activeTab === tab ? 'bg-primary-600 text-white' : 'bg-white border border-surface-border text-text-secondary'
                            )}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            <input
                ref={fileInputRef}
                type="file"
                onChange={onFilePicked}
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                className="hidden"
            />

            {loading ? (
                <div className="bg-white border border-surface-border rounded-xl p-6 text-sm text-text-muted">Loading assignments...</div>
            ) : filteredAssignments.length === 0 ? (
                <div className="bg-white border border-surface-border rounded-xl p-6 text-sm text-text-muted">No assignments found.</div>
            ) : (
                <div className="space-y-4">
                    {filteredAssignments.map((assignment) => {
                        const status = statusBadge[assignment.statusKey];
                        const isSelected = assignment.id === selectedAssignmentId;
                        const isSubmitting = submittingId === assignment.id;

                        return (
                            <div key={assignment.id} className="bg-white border border-surface-border rounded-xl p-5 space-y-3">
                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                                    <div className="space-y-1">
                                        <p className="text-lg font-semibold text-text-primary">{assignment.title}</p>
                                        <p className="text-sm text-text-secondary">{assignment.description}</p>
                                        <div className="flex items-center gap-4 text-xs text-text-muted">
                                            <span className="flex items-center gap-1"><HiClock /> {formatDeadline(assignment.deadline)}</span>
                                            <span>{assignment.courseId?.title || 'Course'}</span>
                                            <span>{assignment.points || 100} points</span>
                                        </div>
                                    </div>
                                    <Badge color={status.color}>{status.label}</Badge>
                                </div>

                                {assignment.statusKey === 'pending' && (
                                    <div className="flex flex-col md:flex-row md:items-center gap-2 pt-2">
                                        <Button variant="outline" icon={<HiUpload />} onClick={() => openFilePicker(assignment.id)}>
                                            {isSelected && selectedFile ? 'Change File' : 'Choose File'}
                                        </Button>

                                        {isSelected && selectedFile && (
                                            <div className="text-xs text-text-secondary flex items-center gap-1">
                                                <HiPaperClip className="text-primary-500" /> {selectedFile.name}
                                            </div>
                                        )}

                                        <Button
                                            onClick={() => handleSubmit(assignment)}
                                            disabled={!isSelected || !selectedFile || isSubmitting}
                                        >
                                            {isSubmitting ? 'Submitting...' : 'Submit Assignment'}
                                        </Button>
                                    </div>
                                )}

                                {assignment.statusKey === 'submitted' && (
                                    <div className="text-sm text-blue-600 flex items-center gap-2">
                                        <HiCheckCircle /> Submitted {assignment.submittedAt ? `on ${new Date(assignment.submittedAt).toLocaleString()}` : ''}
                                    </div>
                                )}

                                {assignment.statusKey === 'graded' && (
                                    <div className="text-sm text-emerald-600 flex items-center gap-2">
                                        <HiCheckCircle /> Graded: {assignment.grade}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {selectedAssignment && selectedFile && (
                <div className="text-xs text-text-muted">
                    Selected for submission: <span className="font-semibold text-text-primary">{selectedAssignment.title}</span>
                </div>
            )}
        </div>
    );
}
