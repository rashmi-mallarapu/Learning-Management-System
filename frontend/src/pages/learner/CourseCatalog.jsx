import { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
    HiFilter, HiStar, HiClock, HiAcademicCap,
    HiChevronRight, HiChevronDown, HiTag, HiBookmark, HiUsers
} from 'react-icons/hi';
import { DIFFICULTY } from '../../constants/status';
import { ROUTES } from '../../constants/routes';
import { Link } from 'react-router-dom';
import Button from '../../components/ui/Button';
import SearchBar from '../../components/ui/SearchBar';
import Select from '../../components/ui/Select';
import Pagination from '../../components/ui/Pagination';
import Badge from '../../components/ui/Badge';
import { fetchCourses, enrollInCourse, fetchMyEnrollments } from '../../services/learnerApi';
import toast from 'react-hot-toast';
import { useSelector } from 'react-redux';

export default function CourseCatalog() {
    const location = useLocation();
    const { token } = useSelector(s => s.auth);
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('All');
    const [difficulty, setDifficulty] = useState('All');
    const [page, setPage] = useState(1);
    const [liveCourses, setLiveCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [enrollingId, setEnrollingId] = useState(null);
    const [enrolledCourseIds, setEnrolledCourseIds] = useState(new Set());

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const q = queryParams.get('q');
        if (q) {
            setSearch(q);
        }
    }, [location.search]);

    useEffect(() => {
        const load = async () => {
            try {
                const params = {};
                if (category !== 'All') params.category = category;
                if (difficulty !== 'All') params.difficulty = difficulty;
                if (search) params.search = search;
                
                const [data, myEnrollments] = await Promise.all([
                    fetchCourses(params),
                    token ? fetchMyEnrollments().catch(() => []) : Promise.resolve([])
                ]);
                
                setLiveCourses(data);
                
                if (myEnrollments && myEnrollments.length > 0) {
                    const ids = new Set(myEnrollments.map(e => String(e.courseId?._id || e.courseId)));
                    setEnrolledCourseIds(ids);
                }
            } catch {
                // fallback to mock
                setLiveCourses([]);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [category, difficulty, search]);

    // Map live courses to display format
    const allCourses = useMemo(() => {
        return liveCourses.map(c => ({
            id: c._id,
            title: c.title,
            description: c.description,
            instructorName: c.instructorId?.name || 'Instructor',
            category: c.category || 'General',
            difficulty: c.difficulty || 'Beginner',
            duration: c.duration || '',
            thumbnail: c.thumbnail,
            enrolled: c.enrolledCount || 0,
            rating: c.rating || 0,
            tags: c.tags || [],
            status: c.status,
            _id: c._id,
        }));
    }, [liveCourses]);

    const categories = ['All', 'Web Development', 'Data Science', 'Design', 'Cloud', 'Business', 'General'];
    const difficultyOptions = [
        { label: 'All Levels', value: 'All' },
        { label: 'Beginner', value: DIFFICULTY.BEGINNER },
        { label: 'Intermediate', value: DIFFICULTY.INTERMEDIATE },
        { label: 'Advanced', value: DIFFICULTY.ADVANCED },
    ];

    // Client-side filter (search already sent to API, but this handles local filtering too)
    const filteredCourses = useMemo(() => {
        return allCourses;
    }, [allCourses]);

    const itemsPerPage = 8;
    const totalPages = Math.ceil(filteredCourses.length / itemsPerPage);
    const displayedCourses = filteredCourses.slice((page - 1) * itemsPerPage, page * itemsPerPage);

    const handleEnroll = async (courseId) => {
        if (!token) {
            toast.error('Please login to enroll');
            return;
        }
        try {
            setEnrollingId(courseId);
            await enrollInCourse(courseId);
            toast.success('Enrolled successfully!');
            setEnrolledCourseIds(prev => new Set([...prev, String(courseId)]));
        } catch (err) {
            toast.error(err.message || 'Failed to enroll');
        } finally {
            setEnrollingId(null);
        }
    };

    return (
        <div className="p-6 space-y-8 max-w-7xl mx-auto pb-20">
            {/* Header & Search */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <h1 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tighter">Browse Courses</h1>
                    <p className="text-slate-500 font-medium text-lg">Discover your next skill with our professional collections.</p>
                </div>
                <div className="flex-1 max-w-md flex gap-3">
                    <SearchBar
                        value={search}
                        onChange={setSearch}
                        onClear={() => setSearch('')}
                        placeholder="Search courses..."
                        className="w-full shadow-lg shadow-slate-100"
                    />
                    <Button variant="outline" className="px-6 border-gray-200" icon={<HiFilter className="w-4 h-4" />}>Filters</Button>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="relative z-50 bg-white/50 backdrop-blur-sm p-2 rounded-2xl border border-slate-100 flex flex-wrap gap-4 items-center">
                <div className="flex gap-2 p-1 bg-slate-100/50 rounded-xl overflow-x-auto whitespace-nowrap">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => { setCategory(cat); setPage(1); }}
                            className={`px-6 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${category === cat
                                ? 'bg-white text-primary-500 shadow-md'
                                : 'text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
                <div className="flex-1" />
                <div className="flex items-center gap-6 px-4">
                    <div className="w-48">
                        <Select
                            value={difficulty}
                            onChange={(v) => { setDifficulty(v); setPage(1); }}
                            options={difficultyOptions}
                        />
                    </div>
                </div>
            </div>

            {/* Loading */}
            {loading && (
                <div className="py-20 text-center">
                    <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">Loading courses...</p>
                </div>
            )}

            {/* Grid */}
            {!loading && displayedCourses.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {displayedCourses.map(course => (
                        <div key={course.id || course._id} className="bg-white rounded-xl border border-gray-200 shadow-md hover-lift group flex flex-col transition-all duration-300">
                            {/* Premium Thumbnail */}
                            <div className="relative h-32 overflow-hidden rounded-t-xl mb-3">
                                <img
                                    src={course.thumbnail || `https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800&auto=format&fit=crop&${course.id}`}
                                    alt={course.title}
                                    onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800&auto=format&fit=crop'; e.currentTarget.onerror = null; }}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                                <div className="absolute top-2 left-2">
                                    <Badge color={course.category === 'Design' ? 'violet' : course.category === 'Data Science' ? 'emerald' : 'blue'} variant="glass" className="font-black uppercase tracking-widest text-[8px] py-1 shadow-md backdrop-blur-md">
                                        {course.category?.toUpperCase() || 'DEVELOPMENT'}
                                    </Badge>
                                </div>
                            </div>

                            <div className="flex flex-col flex-1 p-4 pt-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-4 h-4 bg-primary-100 rounded-full flex items-center justify-center text-[7px] font-bold text-primary-500">
                                        {course.instructorName?.split(' ')?.[1]?.[0] || 'T'}
                                    </div>
                                    <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">{course.instructorName}</span>
                                </div>

                                <h4 className="text-sm font-black text-gray-800 leading-tight mb-2 group-hover:text-primary-500 transition-colors line-clamp-1">{course.title}</h4>
                                <p className="text-[9px] text-gray-500 font-bold line-clamp-2 mb-4 tracking-tight leading-relaxed">
                                    {course.description}
                                </p>

                                <div className="flex items-center justify-between mb-4 pt-3 border-t border-slate-100/50">
                                    <div className="flex items-center gap-1 text-gray-500 font-bold text-[9px] uppercase tracking-wider">
                                        <HiUsers className="w-3.5 h-3.5 text-gray-300" />
                                        <span>{course.enrolled?.toLocaleString() || 0}</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-amber-500 font-black text-[9px]">
                                        <HiStar className="w-3.5 h-3.5 fill-current" />
                                        <span>{course.rating || '—'}</span>
                                    </div>
                                </div>

                                <div className="mt-auto space-y-2">
                                    <Link to={`/learner/courses/${course._id || course.id}`}>
                                        <Button fullWidth size="sm" variant="outline" className="py-2 font-black uppercase tracking-widest text-[10px] rounded-lg">
                                            View Details
                                        </Button>
                                    </Link>
                                    {enrolledCourseIds.has(String(course._id || course.id)) ? (
                                        <Link to={`/learner/courses/${course._id || course.id}`}>
                                            <Button
                                                fullWidth
                                                size="sm"
                                                className="py-2 font-black uppercase tracking-widest text-[10px] shadow-md transition-all rounded-lg border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50"
                                                variant="outline"
                                            >
                                                Already Enrolled
                                            </Button>
                                        </Link>
                                    ) : (
                                        <Button
                                            fullWidth
                                            size="sm"
                                            className="py-2 font-black uppercase tracking-widest text-[10px] shadow-md hover:shadow-lg transition-all rounded-lg"
                                            onClick={() => handleEnroll(course._id || course.id)}
                                            disabled={enrollingId === (course._id || course.id)}
                                        >
                                            {enrollingId === (course._id || course.id) ? 'Enrolling...' : 'Enroll Now'}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {!loading && displayedCourses.length === 0 && (
                <div className="py-20 text-center">
                    <HiFilter className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                    <h3 className="text-xl font-black text-gray-800 mb-2">No Courses Found</h3>
                    <p className="text-gray-600 font-medium">Try adjusting your filters to find what you're looking for.</p>
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center pt-12">
                    <Pagination
                        currentPage={page}
                        totalPages={totalPages}
                        onPageChange={setPage}
                    />
                </div>
            )}
        </div>
    );
}
