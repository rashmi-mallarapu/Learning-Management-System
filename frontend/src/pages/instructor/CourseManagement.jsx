import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
    HiPlus, HiSearch, HiFilter, HiCollection,
    HiPencil, HiTrash, HiDotsVertical, HiEye,
    HiTrendingUp, HiUsers, HiStar, HiDocumentDuplicate, HiArchive, HiLightningBolt
} from 'react-icons/hi';

import { ROUTES } from '../../constants/routes';
import { Link } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import SearchBar from '../../components/ui/SearchBar';
import { Table, Thead, Tbody, Tr, Th, Td } from '../../components/ui/Table';
import Pagination from '../../components/ui/Pagination';
import { fetchInstructorCourses, deleteCourse, createGoogleClassroomForCourse } from '../../services/instructorApi';
import { useEffect } from 'react';

export default function CourseManagement() {
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [showFilters, setShowFilters] = useState(false);
    const [showExport, setShowExport] = useState(false);
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterCategory, setFilterCategory] = useState('all');
    const [openActionMenuId, setOpenActionMenuId] = useState(null);

    // Add local state so we can actually mutate the course list
    const [instructorCourses, setInstructorCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchInstructorCourses()
            .then(data => {
                if (data && data.length > 0) {
                    setInstructorCourses(data.map(c => ({
                        id: c._id || c.id,
                        title: c.title,
                        category: c.category || 'Web Development',
                        status: c.status || 'draft',
                        enrolled: c.enrollmentCount || c.enrolledCount || 0,
                        rating: c.rating || 0,
                        googleClassroom: c.googleClassroom || {}
                    })));
                }
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const ITEMS_PER_PAGE = 5;

    const filtered = instructorCourses.filter(c => {
        if (c.status === 'archived' && filterStatus !== 'archived') return false;
        const matchesSearch = c.title.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = filterStatus === 'all' ? (c.status !== 'archived') : c.status === filterStatus;
        const matchesCategory = filterCategory === 'all' ||
            (c.category === 'Web Development' && filterCategory === 'web') ||
            (c.category === 'Data Science' && filterCategory === 'ds') ||
            (c.category === 'Design' && filterCategory === 'design') ||
            (c.category === 'Cloud Computing' && filterCategory === 'cloud') ||
            (c.category === 'Business' && filterCategory === 'business') ||
            (c.category === 'Security' && filterCategory === 'security');

        return matchesSearch && matchesStatus && matchesCategory;
    });

    const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
    const paginatedCourses = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

    const handleDuplicate = (course) => {
        const newCourse = {
            ...course,
            id: Math.random().toString(36).substr(2, 9),
            title: `${course.title} (Copy)`,
            status: 'draft',
            enrolled: 0,
            rating: 0
        };
        setInstructorCourses([newCourse, ...instructorCourses]);
        setOpenActionMenuId(null);
        toast.success(`Successfully duplicated "${course.title}"`);
    };

    const handleArchive = (courseId) => {
        setInstructorCourses(instructorCourses.map(c =>
            c.id === courseId ? { ...c, status: 'archived' } : c
        ));
        setOpenActionMenuId(null);
        toast('Course moved to archive.', { icon: '📦' });
    };

    const handleDelete = (courseId) => {
        setInstructorCourses(instructorCourses.filter(c => c.id !== courseId));
        setOpenActionMenuId(null);
        toast.error('Course permanently deleted.');
    };

    const handleCreateClassroom = async (course) => {
        setOpenActionMenuId(null);
        const toastId = toast.loading(`Provisioning Google Classroom for ${course.title}...`);
        try {
            const data = await createGoogleClassroomForCourse(course.id);
            setInstructorCourses((prev) =>
                prev.map((item) =>
                    item.id === course.id
                        ? { ...item, googleClassroom: data?.classroom || item.googleClassroom }
                        : item
                )
            );

            toast.success(
                data?.alreadyExists
                    ? `Google Classroom already exists for ${course.title}.`
                    : `Google Classroom created and ${data?.notifiedStudents || 0} students alerted.`,
                { id: toastId }
            );

            if (data?.classroom?.alternateLink) {
                window.open(data.classroom.alternateLink, '_blank', 'noopener,noreferrer');
            }
        } catch (error) {
            toast.error(error.message || 'Failed to create Google Classroom', { id: toastId });
        }
    };

    return (
        <div className="p-6 space-y-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold text-text-primary">My Courses</h1>
                    <p className="text-text-secondary">Manage your curriculum, enrollment, and course settings.</p>
                </div>
                <Link to={ROUTES.INSTRUCTOR_COURSE_CREATE}>
                    <Button className="bg-violet-600 hover:bg-violet-700 text-white" icon={<HiPlus />}>Create New Course</Button>
                </Link>
            </div>

            {/* Control Bar */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <SearchBar
                    value={search}
                    onChange={(val) => { setSearch(val); setPage(1); }}
                    onClear={() => { setSearch(''); setPage(1); }}
                    placeholder="Search by course title..."
                    className="w-full md:max-w-md"
                />
                <div className="flex items-center gap-3 w-full md:w-auto relative">
                    <div className="relative">
                        <Button
                            onClick={() => { setShowFilters(!showFilters); setShowExport(false); }}
                            variant="outline"
                            className={showFilters ? '!border-violet-500 !bg-violet-50 !text-violet-700 ring-2 ring-violet-500/20' : ''}
                            icon={<HiFilter className={showFilters ? 'text-violet-600' : ''} />}
                        >
                            Filters
                        </Button>
                        {showFilters && (
                            <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-surface-border p-4 z-20 animate-fade-in">
                                <h4 className="font-bold text-sm text-text-primary mb-3">Filter Options</h4>
                                <div className="space-y-4">
                                    <Select
                                        label={<span className="text-[10px] uppercase font-bold text-text-muted">Status</span>}
                                        value={filterStatus}
                                        onChange={(val) => { setFilterStatus(val); setPage(1); }}
                                        options={[
                                            { label: 'All Statuses', value: 'all' },
                                            { label: 'Published', value: 'published' },
                                            { label: 'Draft', value: 'draft' }
                                        ]}
                                    />
                                    <Select
                                        label={<span className="text-[10px] uppercase font-bold text-text-muted">Category</span>}
                                        value={filterCategory}
                                        onChange={(val) => { setFilterCategory(val); setPage(1); }}
                                        options={[
                                            { label: 'All Categories', value: 'all' },
                                            { label: 'Web Development', value: 'web' },
                                            { label: 'Data Science', value: 'ds' },
                                            { label: 'Design', value: 'design' },
                                            { label: 'Cloud Computing', value: 'cloud' },
                                            { label: 'Business', value: 'business' },
                                            { label: 'Security', value: 'security' }
                                        ]}
                                    />
                                    <Button size="sm" fullWidth className="bg-violet-600 hover:bg-violet-700 text-white shadow-md mt-2" onClick={() => { setShowFilters(false); toast.success('Filters applied successfully'); }}>
                                        Apply Filters
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="relative">
                        <Button
                            onClick={() => { setShowExport(!showExport); setShowFilters(false); }}
                            variant="outline"
                            className={showExport ? '!border-violet-500 !bg-violet-50 !text-violet-700 ring-2 ring-violet-500/20' : ''}
                            icon={<HiTrendingUp className={showExport ? 'text-violet-600' : ''} />}
                        >
                            Export Report
                        </Button>
                        {showExport && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-surface-border p-2 z-20 animate-fade-in">
                                <button onClick={() => { setShowExport(false); toast.success('Downloading as CSV...'); }} className="w-full text-left px-4 py-2 text-sm font-medium text-text-primary hover:bg-violet-50 hover:text-violet-600 rounded-lg transition-colors">
                                    Export as CSV
                                </button>
                                <button onClick={() => { setShowExport(false); toast.success('Downloading as PDF...'); }} className="w-full text-left px-4 py-2 text-sm font-medium text-text-primary hover:bg-violet-50 hover:text-violet-600 rounded-lg transition-colors">
                                    Export as PDF
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Courses Table */}
            <div className="bg-white rounded-2xl border border-surface-border shadow-card overflow-visible">
                <Table>
                    <Thead>
                        <Th>Course</Th>
                        <Th>Category</Th>
                        <Th>Status</Th>
                        <Th align="right">Enrolled</Th>
                        <Th align="right">Rating</Th>
                        <Th align="right">Actions</Th>
                    </Thead>
                    <Tbody>
                        {paginatedCourses.map(course => (
                            <Tr key={course.id}>
                                <Td>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <HiCollection className="w-6 h-6 text-slate-300" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-bold text-text-primary truncate">{course.title}</p>
                                            <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider">ID: #{course.id}</p>
                                        </div>
                                    </div>
                                </Td>
                                <Td><Badge color="blue">{course.category}</Badge></Td>
                                <Td>
                                    <Badge color={course.status === 'published' ? 'green' : course.status === 'archived' ? 'rose' : 'orange'}>
                                        {course.status}
                                    </Badge>
                                    {course.status === 'draft' && (
                                        <p className="text-[10px] text-slate-500 font-semibold mt-1">Waiting for admin approval</p>
                                    )}
                                </Td>
                                <Td>
                                    <div className="flex items-center justify-end gap-1.5 font-medium text-text-primary mt-1">
                                        <HiUsers className="text-text-muted" /> {course.enrolled.toLocaleString()}
                                    </div>
                                </Td>
                                <Td>
                                    <div className="flex items-center justify-end gap-1 font-bold text-amber-500 text-xs mt-1">
                                        <HiStar /> {course.rating}
                                    </div>
                                </Td>
                                <Td className="text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button onClick={() => navigate(ROUTES.INSTRUCTOR_ANALYTICS)} title="View Analytics" className="p-2 text-text-muted hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors">
                                            <HiTrendingUp className="w-4 h-4" />
                                        </button>
                                        <button 
                                            onClick={() => navigate(`/instructor/courses/${course.id}/edit`)} 
                                            title="Edit Course" 
                                            className="p-2 text-text-muted hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                                        >
                                            <HiPencil className="w-4 h-4" />
                                        </button>
                                        <div className="relative">
                                            <button onClick={() => setOpenActionMenuId(openActionMenuId === course.id ? null : course.id)} title="More Actions" className="p-2 text-text-muted hover:text-text-primary hover:bg-surface-muted rounded-lg transition-colors">
                                                <HiDotsVertical className="w-4 h-4" />
                                            </button>
                                            {openActionMenuId === course.id && (
                                                <>
                                                    <div className="fixed inset-0 z-40" onClick={() => setOpenActionMenuId(null)}></div>
                                                    <div className="absolute right-0 mt-1 w-48 bg-white border border-surface-border rounded-xl shadow-dropdown py-1.5 z-50 animate-fade-in origin-top-right">
                                                        <button onClick={() => handleDuplicate(course)} className="w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-surface-muted transition-colors flex items-center gap-2">
                                                            <HiDocumentDuplicate className="w-4 h-4 text-text-muted" /> Duplicate
                                                        </button>
                                                        <button onClick={() => handleArchive(course.id)} className="w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-surface-muted transition-colors flex items-center gap-2">
                                                            <HiArchive className="w-4 h-4 text-text-muted" /> Archive
                                                        </button>
                                                        <div className="my-1 border-t border-surface-border"></div>
                                                        <button onClick={() => handleCreateClassroom(course)} className="w-full text-left px-4 py-2 text-sm text-emerald-700 hover:bg-emerald-50 transition-colors flex items-center gap-2 font-bold">
                                                            <HiLightningBolt className="w-4 h-4 text-emerald-500" /> {course.googleClassroom?.id ? 'Open Classroom' : 'Create Classroom'}
                                                        </button>
                                                        <div className="my-1 border-t border-surface-border"></div>
                                                        <button onClick={() => handleDelete(course.id)} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2">
                                                            <HiTrash className="w-4 h-4 text-red-500" /> Delete Course
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </Td>
                            </Tr>
                        ))}
                    </Tbody>
                </Table>
                {filtered.length === 0 && (
                    <div className="py-20 text-center">
                        <HiCollection className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-text-primary">No courses found</h3>
                        <p className="text-sm text-text-secondary">Try searching with a different term.</p>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {filtered.length > 0 && (
                <div className="flex justify-center">
                    <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
                </div>
            )}
        </div>
    );
}
