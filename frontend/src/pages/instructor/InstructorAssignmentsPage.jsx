import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { HiPlus, HiClock, HiDocumentText, HiAcademicCap } from 'react-icons/hi';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import { ROUTES } from '../../constants/routes';
import {
    createAssignment,
    fetchAssignmentsByCourse,
} from '../../services/instructorApi';
import { fetchInstructorCourses } from '../../services/instructorApi';

const toDateInputValue = (date) => {
    const normalized = date instanceof Date ? date : new Date(date);
    if (Number.isNaN(normalized.getTime())) return '';
    const year = normalized.getFullYear();
    const month = String(normalized.getMonth() + 1).padStart(2, '0');
    const day = String(normalized.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export default function InstructorAssignmentsPage() {
    const [courses, setCourses] = useState([]);
    const [selectedCourseId, setSelectedCourseId] = useState('');
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        title: '',
        description: '',
        deadline: '',
        points: 100,
    });

    const selectedCourse = useMemo(
        () => courses.find((course) => String(course._id || course.id) === String(selectedCourseId)) || null,
        [courses, selectedCourseId]
    );

    const loadAssignments = async (courseId) => {
        if (!courseId) {
            setAssignments([]);
            return;
        }

        try {
            const data = await fetchAssignmentsByCourse(courseId);
            setAssignments(Array.isArray(data) ? data : []);
        } catch (err) {
            setAssignments([]);
            toast.error(err?.message || 'Failed to load assignments');
        }
    };

    useEffect(() => {
        const load = async () => {
            try {
                const data = await fetchInstructorCourses();
                const list = Array.isArray(data) ? data : [];
                setCourses(list);
                if (list.length > 0) {
                    const firstCourseId = String(list[0]._id || list[0].id);
                    setSelectedCourseId(firstCourseId);
                    await loadAssignments(firstCourseId);
                }
            } catch (err) {
                toast.error(err?.message || 'Failed to load courses');
            } finally {
                setLoading(false);
            }
        };

        load();
    }, []);

    const handleCourseChange = async (value) => {
        setSelectedCourseId(value);
        await loadAssignments(value);
    };

    const handleCreateAssignment = async (event) => {
        event.preventDefault();

        if (!selectedCourseId) {
            toast.error('Please select a course');
            return;
        }

        if (!form.title.trim() || !form.description.trim() || !form.deadline) {
            toast.error('Title, description, and deadline are required');
            return;
        }

        setSaving(true);
        try {
            await createAssignment({
                courseId: selectedCourseId,
                title: form.title.trim(),
                description: form.description.trim(),
                deadline: new Date(form.deadline).toISOString(),
                points: Number(form.points) || 100,
            });

            toast.success('Assignment posted successfully. Learners are notified instantly.');
            setForm({ title: '', description: '', deadline: '', points: 100 });
            await loadAssignments(selectedCourseId);
        } catch (err) {
            toast.error(err?.message || 'Failed to create assignment');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="p-6 text-sm text-slate-500">Loading assignments...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Assignments</h1>
                    <p className="text-sm text-text-secondary">Post assignments and track learner work submissions.</p>
                </div>
                <Link to={ROUTES.INSTRUCTOR_SUBMISSIONS}>
                    <Button variant="outline">Review Submissions</Button>
                </Link>
            </div>

            <div className="bg-white border border-surface-border rounded-xl p-5 space-y-4">
                <div className="max-w-sm">
                    <Select
                        label="Course"
                        value={selectedCourseId}
                        onChange={handleCourseChange}
                        options={courses.map((course) => ({
                            label: course.title,
                            value: String(course._id || course.id),
                        }))}
                    />
                </div>

                <form onSubmit={handleCreateAssignment} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-text-primary mb-1">Title</label>
                        <input
                            value={form.title}
                            onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                            className="w-full border border-surface-border rounded-lg px-3 py-2"
                            placeholder="Assignment title"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-text-primary mb-1">Description</label>
                        <textarea
                            value={form.description}
                            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                            rows={4}
                            className="w-full border border-surface-border rounded-lg px-3 py-2"
                            placeholder="Explain what learners need to submit"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-primary mb-1">Deadline</label>
                        <input
                            type="date"
                            value={form.deadline}
                            min={toDateInputValue(new Date())}
                            onChange={(e) => setForm((prev) => ({ ...prev, deadline: e.target.value }))}
                            className="w-full border border-surface-border rounded-lg px-3 py-2"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-primary mb-1">Points</label>
                        <input
                            type="number"
                            value={form.points}
                            min={0}
                            onChange={(e) => setForm((prev) => ({ ...prev, points: e.target.value }))}
                            className="w-full border border-surface-border rounded-lg px-3 py-2"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <Button type="submit" disabled={saving} icon={<HiPlus />}>
                            {saving ? 'Posting...' : 'Post Assignment'}
                        </Button>
                    </div>
                </form>
            </div>

            <div className="bg-white border border-surface-border rounded-xl p-5">
                <h2 className="font-semibold text-text-primary mb-4">
                    {selectedCourse ? `${selectedCourse.title} Assignments` : 'Assignments'}
                </h2>

                {assignments.length === 0 ? (
                    <p className="text-sm text-text-muted">No assignments posted for this course yet.</p>
                ) : (
                    <div className="space-y-3">
                        {assignments.map((assignment) => (
                            <div key={assignment._id || assignment.id} className="border border-surface-border rounded-lg p-4">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <p className="font-semibold text-text-primary">{assignment.title}</p>
                                        <p className="text-sm text-text-secondary mt-1">{assignment.description}</p>
                                        <div className="flex items-center gap-4 mt-3 text-xs text-text-muted">
                                            <span className="flex items-center gap-1"><HiClock /> Due: {new Date(assignment.deadline).toLocaleString()}</span>
                                            <span className="flex items-center gap-1"><HiAcademicCap /> {assignment.points || 100} points</span>
                                        </div>
                                    </div>
                                    <Link to={ROUTES.INSTRUCTOR_SUBMISSIONS}>
                                        <Button size="sm" variant="outline" icon={<HiDocumentText />}>Submissions</Button>
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
