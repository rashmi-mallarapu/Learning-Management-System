import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { HiCheck, HiCollection, HiEye, HiRefresh, HiX } from 'react-icons/hi';

import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Avatar from '../../components/ui/Avatar';
import { Table, Tbody, Td, Th, Thead, Tr } from '../../components/ui/Table';
import { fetchAdminCourses, updateAdminCourse } from '../../services/learnerApi';

const riskFromCourse = (course) => {
    if (course.status === 'draft') return 'medium';
    if ((course.rating || 0) < 2 && (course.reviewCount || 0) > 0) return 'high';
    return 'low';
};

const formatDate = (value) =>
    value
        ? new Date(value).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        })
        : 'N/A';

export default function CourseModeration() {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [savingId, setSavingId] = useState('');

    const loadCourses = async () => {
        try {
            setLoading(true);
            const data = await fetchAdminCourses();
            setCourses(Array.isArray(data) ? data : []);
            setError('');
        } catch (err) {
            setError(err.message || 'Failed to load courses');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCourses();
    }, []);

    const moderationRows = useMemo(() => courses.map((course) => ({
        ...course,
        risk: riskFromCourse(course),
    })), [courses]);

    const handleStatusUpdate = async (course, status) => {
        try {
            setSavingId(course._id);
            const updatedCourse = await updateAdminCourse(course._id, { status });
            setCourses((current) => current.map((entry) => (entry._id === course._id ? updatedCourse : entry)));
            toast.success(`${course.title} marked as ${status}.`);
        } catch (err) {
            toast.error(err.message || 'Course update failed');
        } finally {
            setSavingId('');
        }
    };

    const pendingCount = moderationRows.filter((course) => course.status === 'draft').length;

    return (
        <div className="space-y-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                <div>
                    <h1 className="text-3xl font-black text-slate-900">Course Moderation</h1>
                    <p className="text-slate-500 mt-2">
                        Review instructor-created courses, approve drafts when they are ready, and archive content that should no longer be learner-facing.
                    </p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <Badge color="amber" className="px-4 py-2 font-bold">
                        {pendingCount} draft courses
                    </Badge>
                    <Button variant="outline" icon={<HiRefresh />} onClick={loadCourses}>
                        Refresh
                    </Button>
                </div>
            </div>

            {error && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
                    {error}
                </div>
            )}

            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <Table>
                    <Thead>
                        <Th>Course</Th>
                        <Th>Instructor</Th>
                        <Th>Status</Th>
                        <Th>Created</Th>
                        <Th>Risk</Th>
                        <Th align="right">Actions</Th>
                    </Thead>
                    <Tbody>
                        {loading ? (
                            <Tr>
                                <Td colSpan={6} className="py-10 text-slate-500">Loading courses...</Td>
                            </Tr>
                        ) : moderationRows.length === 0 ? (
                            <Tr>
                                <Td colSpan={6} className="py-10 text-slate-500">No courses found.</Td>
                            </Tr>
                        ) : moderationRows.map((course) => (
                            <Tr key={course._id}>
                                <Td>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center">
                                            <HiCollection className="w-5 h-5" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-bold text-slate-900 truncate">{course.title}</p>
                                            <p className="text-xs text-slate-500 truncate">
                                                {course.category || 'General'} • {course.enrolledCount || 0} learners
                                            </p>
                                        </div>
                                    </div>
                                </Td>
                                <Td>
                                    <div className="flex items-center gap-2">
                                        <Avatar name={course.instructorId?.name || 'Instructor'} size="xs" />
                                        <div>
                                            <p className="text-sm font-medium text-slate-800">{course.instructorId?.name || 'Unknown instructor'}</p>
                                            <p className="text-xs text-slate-500">{course.instructorId?.email || 'No email available'}</p>
                                        </div>
                                    </div>
                                </Td>
                                <Td>
                                    <Badge color={course.status === 'published' ? 'emerald' : course.status === 'archived' ? 'rose' : 'amber'}>
                                        {course.status}
                                    </Badge>
                                </Td>
                                <Td className="text-sm text-slate-500">{formatDate(course.createdAt)}</Td>
                                <Td>
                                    <Badge color={course.risk === 'high' ? 'rose' : course.risk === 'medium' ? 'amber' : 'emerald'}>
                                        {course.risk}
                                    </Badge>
                                </Td>
                                <Td className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            icon={<HiEye />}
                                            onClick={() => toast.success(`Instructor: ${course.instructorId?.name || 'Unknown'}`)}
                                        >
                                            Inspect
                                        </Button>
                                        <Button
                                            size="sm"
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white border-none"
                                            icon={<HiCheck />}
                                            disabled={savingId === course._id || course.status === 'published'}
                                            onClick={() => handleStatusUpdate(course, 'published')}
                                        >
                                            Approve
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="text-rose-600 border-rose-200 hover:bg-rose-50"
                                            icon={<HiX />}
                                            disabled={savingId === course._id || course.status === 'archived'}
                                            onClick={() => handleStatusUpdate(course, 'archived')}
                                        >
                                            Archive
                                        </Button>
                                    </div>
                                </Td>
                            </Tr>
                        ))}
                    </Tbody>
                </Table>
            </div>

            <div className="rounded-3xl border border-violet-100 bg-violet-50 p-6">
                <h2 className="text-lg font-black text-slate-900">How admin now interacts with instructors and learners</h2>
                <p className="text-sm text-slate-600 mt-2">
                    Instructors are surfaced directly through their course records here, while learners are reflected through enrolled counts and can be managed from User Management and Messages without leaving the existing admin flow.
                </p>
            </div>
        </div>
    );
}
