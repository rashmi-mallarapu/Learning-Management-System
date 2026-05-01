import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import {
    HiStar, HiClock, HiAcademicCap, HiChevronRight,
    HiCheckCircle, HiLockClosed, HiPlay, HiDocumentText,
    HiUserGroup, HiOutlineBadgeCheck, HiClipboardList, HiExternalLink
} from 'react-icons/hi';
import { ROUTES } from '../../constants/routes';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Tabs from '../../components/ui/Tabs';
import Avatar from '../../components/ui/Avatar';
import ProgressBar from '../../components/ui/ProgressBar';
import { fetchCourseDetails, enrollInCourse, checkEnrollment, sendMessageAPI, fetchMessageAccessStatus, requestMessageAccess, fetchMyProgress, fetchQuizzesByCourse, submitCourseRating } from '../../services/learnerApi';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { formatDuration } from '../../utils/formatDuration';

export default function CourseDetail() {
    const { courseId } = useParams();
    const location = useLocation();
    const { token } = useSelector(s => s.auth);
    const [activeTab, setActiveTab] = useState('curriculum');
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [enrolled, setEnrolled] = useState(false);
    const [completedLessons, setCompletedLessons] = useState(new Set());
    const [courseQuizzes, setCourseQuizzes] = useState([]);
    const [enrolling, setEnrolling] = useState(false);
    const [messageText, setMessageText] = useState('');
    const [accessStatus, setAccessStatus] = useState('none');
    const [requestingAccess, setRequestingAccess] = useState(false);
    const [currentProgress, setCurrentProgress] = useState(0);
    const [showRatingModal, setShowRatingModal] = useState(false);
    const [selectedRating, setSelectedRating] = useState(0);
    const [submittingRating, setSubmittingRating] = useState(false);

    const getInstructorId = (value) => {
        if (!value) return null;
        if (typeof value === 'string') return value;
        return value._id || value.id || null;
    };

    useEffect(() => {
        const load = async () => {
            try {
                const data = await fetchCourseDetails(courseId);
                setCourse(data);
            } catch (err) {
                console.error('Failed to load course details:', err);
                toast.error('Failed to load course details');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [courseId]);

    useEffect(() => {
        if (!token || !courseId) return;
        checkEnrollment(courseId)
            .then(data => setEnrolled(data?.enrolled || false))
            .catch(() => {});
            
        fetchMyProgress()
            .then(data => {
                if (data) {
                    const myProgress = data.find(p => String(p.courseId?._id || p.courseId) === String(courseId));
                    if (myProgress && myProgress.completedLessons) {
                        setCompletedLessons(new Set(myProgress.completedLessons.map(id => String(id))));
                    }
                    setCurrentProgress(Number(myProgress?.completionPercentage) || 0);
                }
            })
            .catch(() => {});
    }, [courseId, token]);

    useEffect(() => {
        if (!token || !courseId) {
            setCourseQuizzes([]);
            return;
        }

        fetchQuizzesByCourse(courseId)
            .then((data) => setCourseQuizzes(Array.isArray(data) ? data : []))
            .catch((error) => {
                console.error('Failed to load course quizzes:', error);
                setCourseQuizzes([]);
            });
    }, [courseId, token]);

    useEffect(() => {
        const instructorId = getInstructorId(course?.instructorId);
        if (!token || !instructorId) return;

        fetchMessageAccessStatus(instructorId)
            .then((data) => setAccessStatus(data?.status || 'none'))
            .catch(() => setAccessStatus('none'));
    }, [course?.instructorId, token]);

    const handleEnroll = async () => {
        if (!token) {
            toast.error('Please login to enroll');
            return;
        }
        try {
            setEnrolling(true);
            await enrollInCourse(courseId);
            setEnrolled(true);
            toast.success('Enrolled successfully!');
        } catch (err) {
            toast.error(err.message || 'Failed to enroll');
        } finally {
            setEnrolling(false);
        }
    };

    const handleMessageInstructor = async () => {
        const instructorId = getInstructorId(course?.instructorId);

        if (!token) {
            toast.error('Please login to message the instructor');
            return;
        }

        if (accessStatus !== 'approved') {
            toast.error('Request access first');
            return;
        }

        if (!instructorId) {
            toast.error('Instructor details are unavailable for this course');
            return;
        }

        try {
            const content = messageText.trim() || `Hi, I have a question about ${course?.title}.`;
            await sendMessageAPI({
                receiverId: instructorId,
                subject: `Question about ${course?.title}`,
                content,
            });
            setMessageText('');
            toast.success('Message sent to instructor');
        } catch (err) {
            toast.error(err.message || 'Failed to send message');
        }
    };

    const handleRequestAccess = async () => {
        const instructorId = getInstructorId(course?.instructorId);

        if (!token) {
            toast.error('Please login to request access');
            return;
        }

        if (!instructorId) {
            toast.error('Instructor details are unavailable for this course');
            return;
        }

        setRequestingAccess(true);
        try {
            await requestMessageAccess(instructorId, `Please approve my message and call access for ${course?.title}.`);
            setAccessStatus('pending');
            toast.success('Access request sent to the instructor');
        } catch (err) {
            toast.error(err.message || 'Failed to request access');
        } finally {
            setRequestingAccess(false);
        }
    };

    const handleSubmitRating = async () => {
        if (selectedRating < 1) {
            toast.error('Please choose a rating first');
            return;
        }

        try {
            setSubmittingRating(true);
            const updatedCourse = await submitCourseRating(courseId, selectedRating);
            setCourse((prev) => ({
                ...(prev || {}),
                ...(updatedCourse || {}),
            }));
            setShowRatingModal(false);
            toast.success('Thanks for rating this course');
        } catch (err) {
            toast.error(err.message || 'Failed to submit rating');
        } finally {
            setSubmittingRating(false);
        }
    };

    const c = course || {};
    const classroom = c.googleClassroom || {};
    const instructorName = c.instructorId?.name || 'Instructor';
    const lessons = c.lessons || [];
    const normalizedLessons = useMemo(() => {
        if (!Array.isArray(lessons)) return [];
        const sorted = lessons.slice().sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
        return sorted.map((lesson, index) => {
            const parsedOrder = Number(lesson.order);
            return {
                ...lesson,
                order: Number.isFinite(parsedOrder) && parsedOrder > 0 ? parsedOrder : index + 1,
            };
        });
    }, [lessons]);
    const lessonCount = normalizedLessons.length;
    const quizzesByLessonOrder = useMemo(() => {
        const map = new Map();
        (courseQuizzes || []).forEach((quiz) => {
            const lessonOrder = Number(quiz.lessonOrder);
            if (!Number.isFinite(lessonOrder) || lessonOrder <= 0) return;
            if (!map.has(lessonOrder)) {
                map.set(lessonOrder, []);
            }
            map.get(lessonOrder).push(quiz);
        });
        return map;
    }, [courseQuizzes]);
    const areLessonQuizzesPassed = (order) => {
        const quizzes = quizzesByLessonOrder.get(Number(order)) || [];
        if (quizzes.length === 0) {
            return true;
        }
        return quizzes.every((quiz) => quiz.status === 'completed' || quiz.passed);
    };
    const isLessonUnlocked = (lesson, index) => {
        if (!enrolled) {
            return false;
        }
        if (index === 0) {
            return true;
        }

        const previousLesson = normalizedLessons[index - 1];
        if (!previousLesson) {
            return true;
        }

        const previousCompleted = completedLessons.has(String(previousLesson._id || previousLesson.id));
        return previousCompleted && areLessonQuizzesPassed(previousLesson.order);
    };
    const firstActionableLesson = normalizedLessons.find((lesson) => {
        const lessonCompleted = completedLessons.has(String(lesson._id || lesson.id));
        return !lessonCompleted || !areLessonQuizzesPassed(lesson.order);
    });
    const isCourseCompleted = enrolled && currentProgress >= 100;

    useEffect(() => {
        if (location.state?.openRatingModal && isCourseCompleted) {
            setShowRatingModal(true);
        }
    }, [isCourseCompleted, location.state]);

    const tabs = [
        { key: 'curriculum', label: 'Curriculum', icon: <HiAcademicCap /> },
        { key: 'description', label: 'Description', icon: <HiDocumentText /> },
        { key: 'instructor', label: 'Instructor', icon: <HiUserGroup /> },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!course) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <HiAcademicCap className="w-16 h-16 text-slate-300" />
                <h2 className="text-xl font-bold text-text-primary">Course Not Found</h2>
                <p className="text-text-secondary">This course could not be loaded from the database.</p>
            </div>
        );
    }

    return (
        <div className="bg-surface-bg min-h-screen">
            {/* Course Hero */}
            <div className="bg-white border-b border-surface-border">
                <div className="max-w-7xl mx-auto px-6 py-12">
                    <div className="flex flex-col lg:flex-row gap-12">
                        <div className="flex-1 space-y-6">
                            <div className="flex items-center gap-3">
                                <Badge color="blue">{c.category || 'General'}</Badge>
                                <Badge color="gray">{c.difficulty || 'Beginner'}</Badge>
                            </div>
                            <h1 className="text-4xl font-extrabold text-text-primary leading-tight">
                                {c.title}
                            </h1>
                            <p className="text-lg text-text-secondary max-w-2xl">
                                {c.description}
                            </p>
                            <div className="flex flex-wrap items-center gap-6 pt-2">
                                <div className="flex items-center gap-2">
                                    <span className="flex items-center gap-1 text-amber-500 font-bold">
                                        <HiStar /> {c.rating || 0}
                                    </span>
                                    <span className="text-text-muted text-sm">({c.reviewCount || c.reviews || 0} reviews)</span>
                                </div>
                                <div className="flex items-center gap-2 text-text-secondary text-sm">
                                    <HiUserGroup className="text-primary-600" />
                                    <span>{c.enrolledCount || c.enrolled || 0} students enrolled</span>
                                </div>
                                {isCourseCompleted && (
                                    <div className="flex items-center gap-2 text-emerald-700 text-sm font-semibold">
                                        <HiCheckCircle className="text-emerald-500" />
                                        <span>Course completed. Share your rating.</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-2 text-text-secondary text-sm">
                                    <Avatar name={instructorName} size="xs" />
                                    <span>Created by <span className="font-semibold text-text-primary">{instructorName}</span></span>
                                </div>
                            </div>
                        </div>

                        {/* Sticky Preview Card */}
                        <div className="lg:w-96 flex-shrink-0">
                            <div className="bg-white rounded-2xl border border-surface-border shadow-card-lg overflow-hidden sticky top-6">
                                <div className="h-52 bg-slate-100 flex items-center justify-center relative overflow-hidden">
                                    {c.thumbnail ? (
                                        <img src={c.thumbnail} alt={c.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <HiAcademicCap className="w-16 h-16 text-slate-300" />
                                    )}
                                    <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                                        <button className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg text-primary-600 hover:scale-110 transition-transform">
                                            <HiPlay className="w-6 h-6 ml-1" />
                                        </button>
                                    </div>
                                </div>
                                <div className="p-6 space-y-6">
                                    <div className="space-y-3 pt-2">
                                        {enrolled ? (
                                            normalizedLessons.length > 0 ? (
                                                <div className="space-y-3">
                                                    <Link 
                                                        to={`/learner/courses/${courseId}/lessons/${
                                                            firstActionableLesson?.order ||
                                                            normalizedLessons[normalizedLessons.length - 1]?.order ||
                                                            1
                                                        }`}
                                                    >
                                                        <Button fullWidth size="lg">Continue Learning</Button>
                                                    </Link>
                                                    {classroom.alternateLink && (
                                                        <Button
                                                            fullWidth
                                                            variant="outline"
                                                            className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                                                            onClick={() => window.open(classroom.alternateLink, '_blank', 'noopener,noreferrer')}
                                                        >
                                                            <HiExternalLink className="mr-2" /> Join Google Classroom
                                                        </Button>
                                                    )}
                                                    {isCourseCompleted && (
                                                        <Button
                                                            fullWidth
                                                            variant="outline"
                                                            className="border-amber-300 text-amber-700 hover:bg-amber-50"
                                                            onClick={() => setShowRatingModal(true)}
                                                        >
                                                            Give Rating
                                                        </Button>
                                                    )}
                                                </div>
                                            ) : (
                                                <Button fullWidth size="lg" disabled>No Lessons Yet</Button>
                                            )
                                        ) : (
                                            <Button
                                                fullWidth
                                                size="lg"
                                                onClick={handleEnroll}
                                                disabled={enrolling}
                                            >
                                                {enrolling ? 'Enrolling...' : 'Enroll Now — Free'}
                                            </Button>
                                        )}
                                        {getInstructorId(c.instructorId) && accessStatus !== 'approved' && (
                                            <Button
                                                fullWidth
                                                variant="outline"
                                                className="border-amber-300 text-amber-700 hover:bg-amber-50"
                                                onClick={handleRequestAccess}
                                                disabled={requestingAccess}
                                            >
                                                {requestingAccess
                                                    ? 'Requesting...'
                                                    : accessStatus === 'pending'
                                                        ? 'Access Request Pending'
                                                        : 'Request Message Access'}
                                            </Button>
                                        )}
                                    </div>
                                    <div className="space-y-4 pt-4 border-t border-surface-border">
                                        {enrolled && classroom.id && (
                                            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                                                <p className="text-sm font-bold text-emerald-900">Google Classroom is live</p>
                                                <p className="mt-1 text-xs text-emerald-800">
                                                    Join code: <span className="font-black">{classroom.enrollmentCode || 'Check the classroom link'}</span>
                                                </p>
                                            </div>
                                        )}
                                        <p className="text-sm font-bold text-text-primary">This course includes:</p>
                                        <ul className="space-y-2">
                                            {[
                                                { icon: HiPlay, text: `${typeof c.duration === 'number' ? formatDuration(c.duration) : (c.duration || 'Video')} content` },
                                                { icon: HiAcademicCap, text: `${lessonCount} lessons` },
                                                { icon: HiDocumentText, text: 'Downloadable resources' },
                                                { icon: HiOutlineBadgeCheck, text: 'Certificate of completion' },
                                                { icon: HiClock, text: 'Full lifetime access' },
                                            ].map((item, i) => (
                                                <li key={i} className="flex items-center gap-3 text-sm text-text-secondary">
                                                    <item.icon className="w-4 h-4 text-primary-500" />
                                                    {item.text}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Sections */}
            <div className="max-w-7xl mx-auto px-6 py-12">
                <div className="lg:w-2/3">
                    <Tabs
                        tabs={tabs}
                        activeTab={activeTab}
                        onChange={setActiveTab}
                        className="mb-8"
                    />

                    <div className="mt-8 space-y-12">
                        {activeTab === 'curriculum' && (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-2xl font-bold text-text-primary">Course Curriculum</h2>
                                    <p className="text-sm text-text-muted">{lessonCount} lessons</p>
                                </div>
                                <div className="space-y-4">
                                    {/* If we have real lessons from API */}
                                    {normalizedLessons.length > 0 ? (
                                        <div className="bg-white border border-surface-border rounded-xl overflow-hidden shadow-sm">
                                            <div className="divide-y divide-surface-border">
                                                {normalizedLessons.map((lesson, j) => {
                                                    const lid = String(lesson._id || lesson.id);
                                                    const isLocked = !isLessonUnlocked(lesson, j);
                                                    const lessonQuizzes = quizzesByLessonOrder.get(Number(lesson.order)) || [];
                                                    const lessonQuizzesPassed = areLessonQuizzesPassed(lesson.order);
                                                    
                                                    return (
                                                        <div key={lid} className="divide-y divide-surface-border/70">
                                                            <Link
                                                                to={!isLocked ? `/learner/courses/${courseId}/lessons/${lesson.order}` : '#'}
                                                                className={`px-6 py-4 flex items-center justify-between group transition-colors ${isLocked ? 'cursor-not-allowed opacity-60' : 'hover:bg-primary-50/30'}`}
                                                                onClick={(e) => {
                                                                    if (isLocked) {
                                                                        e.preventDefault();
                                                                        if (enrolled) toast.error('Complete the previous lessons to unlock this one!');
                                                                    }
                                                                }}
                                                            >
                                                                <div className="flex items-center gap-3 min-w-0">
                                                                    <div className="w-8 h-8 rounded-lg bg-surface-muted flex items-center justify-center text-text-muted group-hover:bg-primary-100 group-hover:text-primary-600 transition-colors">
                                                                        {lesson.type === 'pdf' ? <HiDocumentText className="w-4 h-4" /> : <HiPlay className="w-4 h-4" />}
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-sm font-medium text-text-secondary truncate">{lesson.title}</p>
                                                                        {lesson.duration && (
                                                                            <p className="text-xs text-text-muted">
                                                                                {typeof lesson.duration === 'number' ? formatDuration(lesson.duration) : lesson.duration}
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-4 text-xs text-text-muted">
                                                                    <Badge color={lesson.type === 'pdf' ? 'rose' : 'blue'} className="text-[9px]">{(lesson.type || 'video').toUpperCase()}</Badge>
                                                                    {isLocked && <HiLockClosed className="opacity-40 w-4 h-4" />}
                                                                    {completedLessons.has(lid) && <HiCheckCircle className="text-emerald-500 w-4 h-4" />}
                                                                    {completedLessons.has(lid) && lessonQuizzes.length > 0 && !lessonQuizzesPassed && (
                                                                        <Badge color="amber" className="text-[9px]">QUIZ PENDING</Badge>
                                                                    )}
                                                                </div>
                                                            </Link>
                                                            {lessonQuizzes.map((lessonQuiz) => {
                                                                const quizStatus = lessonQuiz?.status || 'available';
                                                                const isQuizLocked = !enrolled || quizStatus === 'locked';
                                                                const quizTarget = quizStatus === 'completed'
                                                                    ? `/learner/quiz/${lessonQuiz?._id}/results`
                                                                    : `/learner/quiz/${lessonQuiz?._id}/attempt`;

                                                                return (
                                                                    <Link
                                                                        key={lessonQuiz._id}
                                                                        to={!isQuizLocked ? quizTarget : '#'}
                                                                        className={`px-6 py-3 ml-6 flex items-center justify-between transition-colors bg-slate-50/70 ${isQuizLocked ? 'cursor-not-allowed opacity-75' : 'hover:bg-amber-50/70'}`}
                                                                        onClick={(e) => {
                                                                            if (isQuizLocked) {
                                                                                e.preventDefault();
                                                                                toast.error(lessonQuiz.requirement || 'Finish this lesson to unlock the quiz.');
                                                                            }
                                                                        }}
                                                                    >
                                                                        <div className="flex items-center gap-3 min-w-0">
                                                                            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                                                                                <HiClipboardList className="w-4 h-4" />
                                                                            </div>
                                                                            <div>
                                                                                <p className="text-sm font-semibold text-text-primary truncate">{lessonQuiz.title}</p>
                                                                                <p className="text-xs text-text-muted">
                                                                                    {lessonQuiz.questionCount || lessonQuiz.questions?.length || 0} questions · Pass score {lessonQuiz.passingScore || 60}%
                                                                                </p>
                                                                                {isQuizLocked && (
                                                                                    <p className="text-xs text-amber-700 mt-1">
                                                                                        {lessonQuiz.requirement || 'Finish this lesson to unlock the quiz.'}
                                                                                    </p>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex items-center gap-3 text-xs">
                                                                            {quizStatus === 'completed' && <Badge color="green">COMPLETED</Badge>}
                                                                            {quizStatus === 'available' && <Badge color="blue">AVAILABLE</Badge>}
                                                                            {quizStatus === 'locked' && <Badge color="gray">LOCKED</Badge>}
                                                                            {isQuizLocked && <HiLockClosed className="opacity-50 w-4 h-4 text-slate-500" />}
                                                                            {quizStatus === 'completed' && <HiCheckCircle className="text-emerald-500 w-4 h-4" />}
                                                                        </div>
                                                                    </Link>
                                                                );
                                                            })}
                                                            {lessonQuizzes.length > 0 && (
                                                                <div className="px-6 py-2 ml-6 bg-slate-50/40 text-[11px] font-semibold text-slate-500">
                                                                    {lessonQuizzes.length} quiz{lessonQuizzes.length === 1 ? '' : 'zes'} attached to this lesson
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-white border border-surface-border rounded-xl p-8 text-center">
                                            <HiAcademicCap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                            <p className="text-sm font-bold text-text-primary">No lessons yet</p>
                                            <p className="text-xs text-text-muted mt-1">The instructor hasn't added any lessons to this course yet.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'description' && (
                            <div className="space-y-6 prose prose-slate max-w-none">
                                <h2 className="text-2xl font-bold text-text-primary">About this course</h2>
                                <p className="text-text-secondary leading-relaxed">
                                    {c.description}
                                </p>
                                {c.tags && c.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-2 pt-4">
                                        {c.tags.map((tag, i) => (
                                            <Badge key={i} color="gray">{tag}</Badge>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'instructor' && (
                            <div className="bg-white p-8 rounded-2xl border border-surface-border shadow-card flex flex-col md:flex-row gap-8">
                                <div className="flex flex-col items-center gap-4 flex-shrink-0">
                                    <Avatar name={instructorName} size="xl" />
                                    <div className="text-center space-y-1">
                                        <Badge color="blue">Instructor</Badge>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <h3 className="text-2xl font-bold text-text-primary">{instructorName}</h3>
                                        <p className="text-primary-600 font-medium">{c.instructorId?.email || 'instructor@lms.com'}</p>
                                    </div>
                                    <p className="text-text-secondary leading-relaxed">
                                        Experienced educator passionate about teaching and helping students achieve their learning goals.
                                    </p>
                                    {getInstructorId(c.instructorId) && accessStatus !== 'approved' && (
                                        <div className="pt-4 space-y-3">
                                            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                                                {accessStatus === 'pending'
                                                    ? 'Your request is pending instructor approval.'
                                                    : 'Request access to message or call this instructor.'}
                                            </div>
                                            <Button
                                                size="sm"
                                                className="bg-amber-600 hover:bg-amber-700 text-white"
                                                onClick={handleRequestAccess}
                                                disabled={requestingAccess}
                                            >
                                                {requestingAccess ? 'Requesting...' : 'Request Message Access'}
                                            </Button>
                                        </div>
                                    )}
                                    {getInstructorId(c.instructorId) && accessStatus === 'approved' && (
                                        <div className="pt-4 space-y-3">
                                            <textarea
                                                value={messageText}
                                                onChange={(e) => setMessageText(e.target.value)}
                                                placeholder="Write a message to the instructor..."
                                                className="w-full min-h-28 rounded-xl border border-surface-border px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                                            />
                                            <Button
                                                size="sm"
                                                className="bg-primary-600 hover:bg-primary-700 text-white"
                                                onClick={handleMessageInstructor}
                                            >
                                                Message Instructor
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            {showRatingModal && (
                <div className="fixed inset-0 z-50 bg-slate-950/55 backdrop-blur-sm flex items-center justify-center px-4">
                    <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-xs font-black uppercase tracking-[0.25em] text-amber-500">Course Completed</p>
                                <h3 className="mt-2 text-2xl font-black text-slate-900">Rate this course</h3>
                                <p className="mt-2 text-sm text-slate-600">
                                    Your rating will update the live score for <span className="font-bold">{c.title}</span>.
                                </p>
                            </div>
                            <button
                                type="button"
                                className="text-slate-400 hover:text-slate-700 text-xl leading-none"
                                onClick={() => setShowRatingModal(false)}
                            >
                                ×
                            </button>
                        </div>

                        <div className="mt-6 flex items-center justify-center gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setSelectedRating(star)}
                                    className="transition-transform hover:scale-110"
                                >
                                    <HiStar className={`w-10 h-10 ${star <= selectedRating ? 'text-amber-400' : 'text-slate-300'}`} />
                                </button>
                            ))}
                        </div>

                        <p className="mt-4 text-center text-sm font-semibold text-slate-600">
                            {selectedRating > 0 ? `${selectedRating} out of 5` : 'Choose 1 to 5 stars'}
                        </p>

                        <div className="mt-6 flex gap-3">
                            <Button
                                fullWidth
                                variant="outline"
                                className="border-slate-200 text-slate-600"
                                onClick={() => setShowRatingModal(false)}
                            >
                                Later
                            </Button>
                            <Button
                                fullWidth
                                className="bg-amber-500 hover:bg-amber-600 text-white border-none"
                                onClick={handleSubmitRating}
                                disabled={submittingRating}
                            >
                                {submittingRating ? 'Saving...' : 'Submit Rating'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
