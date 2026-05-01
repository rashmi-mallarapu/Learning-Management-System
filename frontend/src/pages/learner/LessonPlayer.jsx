import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
    HiChevronLeft, HiChevronRight, HiCheckCircle,
    HiPlay, HiDocumentText, HiBookmark, HiChatAlt,
    HiMenu, HiX, HiAcademicCap, HiClock, HiPause,
    HiClipboardList, HiDownload, HiExternalLink, HiLockClosed, HiArrowsExpand, HiStar
} from 'react-icons/hi';
import { ROUTES } from '../../constants/routes';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import DiscussionList from '../../components/discussion/DiscussionList';
import DiscussionDetail from '../../components/discussion/DiscussionDetail';
import CreateDiscussionModal from '../../components/discussion/CreateDiscussionModal';
import clsx from 'clsx';
import confetti from 'canvas-confetti';
import {
    fetchLessonsByCourse,
    fetchCourseById,
    updateProgress,
    fetchMyProgress,
    createNote,
    fetchNotesByLesson,
    deleteNote,
    createDiscussionThread,
    fetchDiscussionsByLesson,
    fetchRepliesByDiscussion,
    createDiscussionReply,
    upvoteDiscussion,
    upvoteReply,
    markBestAnswer,
    resolveDiscussion,
    deleteDiscussionThread,
    deleteDiscussionReply,
    fetchQuizByLesson,
    submitQuizAnswers,
    fetchQuizzesByCourse,
    issueCertificate,
} from '../../services/learnerApi';
import toast from 'react-hot-toast';
import ReactPlayer from 'react-player';
import { formatDuration } from '../../utils/formatDuration';

export default function LessonPlayer() {
    const { courseId, lessonOrder } = useParams();
    const lessonOrderNum = Number(lessonOrder);
    const navigate = useNavigate();
    const currentUser = useSelector(state => state.auth?.user);
    const videoRef = useRef(null);
    const playerRef = useRef(null);       // ReactPlayer ref
    const playerContainerRef = useRef(null); // outer container for fullscreen

    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [activeTab, setActiveTab] = useState('notes');
    const [isBookmarked, setIsBookmarked] = useState(false);

    // Live data states
    const [course, setCourse] = useState(null);
    const [currentLesson, setCurrentLesson] = useState(null);
    const [allLessons, setAllLessons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Video player state
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [canComplete, setCanComplete] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showSpeedMenu, setShowSpeedMenu] = useState(false);
    
    // Strict watch time tracking
    const watchTimeRef = useRef(0);
    const lastTimeRef = useRef(0);
    const hasCompletedRef = useRef(false);

    // Completed lessons state
    const [completedLessons, setCompletedLessons] = useState(new Set());

    // Notes state
    const [noteInput, setNoteInput] = useState('');
    const [notes, setNotes] = useState([]);
    const [notesLoading, setNotesLoading] = useState(false);
    const [notesSaving, setNotesSaving] = useState(false);
    const [notesError, setNotesError] = useState('');

    // Discussion state
    const [discussions, setDiscussions] = useState([]);
    const [selectedDiscussion, setSelectedDiscussion] = useState(null);
    const [discussionsLoading, setDiscussionsLoading] = useState(false);
    const [discussionsError, setDiscussionsError] = useState('');
    const [repliesLoading, setRepliesLoading] = useState(false);
    const [replies, setReplies] = useState([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [discussionSortBy, setDiscussionSortBy] = useState('latest');
    const [creatingDiscussion, setCreatingDiscussion] = useState(false);
    const [creatingReply, setCreatingReply] = useState(false);

    // Quiz state
    const [lessonQuiz, setLessonQuiz] = useState(null);          // quiz for current lesson (null = none)
    const [quizLoading, setQuizLoading] = useState(false);
    const [quizAnswers, setQuizAnswers] = useState({});           // { [questionIndex]: selectedOption }
    const [quizSubmitting, setQuizSubmitting] = useState(false);
    const [quizResult, setQuizResult] = useState(null);          // { passed, percentage, score, total }
    const [quizPassed, setQuizPassed] = useState(false);         // persisted via localStorage
    const [courseQuizzes, setCourseQuizzes] = useState([]);

    const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://127.0.0.1:5000';

    const resolveLessonRawUrl = (lesson) => {
        if (!lesson) return '';
        const candidate = lesson.contentUrl || lesson.videoUrl || lesson.fileUrl || lesson.url || '';
        return String(candidate || '').trim();
    };

    const inferLessonType = (lesson) => {
        const explicitType = String(lesson?.type || '').toLowerCase().trim();
        if (explicitType === 'video' || explicitType === 'pdf') return explicitType;

        const rawUrl = resolveLessonRawUrl(lesson).toLowerCase();
        if (!rawUrl) return 'video';
        if (rawUrl.includes('youtube.com') || rawUrl.includes('youtu.be')) return 'video';
        if (rawUrl.endsWith('.pdf')) return 'pdf';
        return 'video';
    };

    // Fullscreen change listener + F key shortcut
    useEffect(() => {
        const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', onFsChange);

        const onKeyDown = (e) => {
            // Only trigger when not typing in an input/textarea
            const tag = document.activeElement?.tagName?.toLowerCase();
            if (tag === 'input' || tag === 'textarea' || document.activeElement?.isContentEditable) return;
            if (e.key === 'f' || e.key === 'F') {
                e.preventDefault();
                if (!document.fullscreenElement) {
                    playerContainerRef.current?.requestFullscreen();
                } else {
                    document.exitFullscreen();
                }
            }
        };
        document.addEventListener('keydown', onKeyDown);

        return () => {
            document.removeEventListener('fullscreenchange', onFsChange);
            document.removeEventListener('keydown', onKeyDown);
        };
    }, []);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            playerContainerRef.current?.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    };

    const handleSpeedChange = (speed) => {
        setPlaybackRate(speed);
        setShowSpeedMenu(false);

        if (videoRef.current) {
            videoRef.current.playbackRate = speed;
        }

        // Also notify the YouTube internal player directly
        try { playerRef.current?.getInternalPlayer()?.setPlaybackRate(speed); } catch (_) {}
    };

    // Load ALL lessons for the course sorted by order, plus course info and progress
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            setError(null);
            try {
                const [lessonsData, courseData, progressData] = await Promise.all([
                    fetchLessonsByCourse(courseId),
                    fetchCourseById(courseId),
                    fetchMyProgress().catch(() => null),
                ]);

                // Sort lessons by order and normalize missing/invalid orders to a stable 1..N sequence
                const sorted = (lessonsData || []).slice().sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
                const normalized = sorted.map((lesson, index) => {
                    const orderValue = Number(lesson.order);
                    return {
                        ...lesson,
                        order: Number.isFinite(orderValue) && orderValue > 0 ? orderValue : index + 1,
                    };
                });
                setAllLessons(normalized);

                // Resolve route param as either lesson order or lesson id
                const routeParam = String(lessonOrder || '').trim();
                let lesson = null;

                if (Number.isFinite(lessonOrderNum) && lessonOrderNum > 0) {
                    lesson = normalized.find((l) => Number(l.order) === lessonOrderNum) || null;
                }

                if (!lesson && routeParam) {
                    lesson = normalized.find((l) => String(l._id || l.id || '') === routeParam) || null;
                }

                if (!lesson) {
                    lesson = normalized[0] || null;
                }

                if (!lesson) throw new Error('No lessons found for this course');
                setCurrentLesson(lesson);

                setCourse(courseData);

                if (progressData) {
                    const myProgress = progressData.find(p => String(p.courseId?._id || p.courseId) === String(courseId));
                    if (myProgress && myProgress.completedLessons) {
                        setCompletedLessons(new Set(myProgress.completedLessons.map(id => String(id))));
                    }
                }
            } catch (err) {
                console.error('LessonPlayer load error:', err);
                setError(err.message || 'Failed to load lesson data');
                toast.error('Failed to load lesson. Please try again.');
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [courseId, lessonOrderNum]);

    useEffect(() => {
        if (!courseId) {
            setCourseQuizzes([]);
            return;
        }

        fetchQuizzesByCourse(courseId)
            .then((data) => {
                setCourseQuizzes(Array.isArray(data) ? data : []);
            })
            .catch(() => {
                setCourseQuizzes([]);
            });
    }, [courseId, lessonOrderNum, quizPassed]);

    // Reset player state on lesson order change
    useEffect(() => {
        setIsPlaying(false);
        setCurrentTime(0);
        setDuration(0);
        
        watchTimeRef.current = 0;
        lastTimeRef.current = 0;
        hasCompletedRef.current = false;
        
        // If they already completed this lesson previously, unlock completion button instantly
        const lessonId = currentLesson?._id;
        if (lessonId && completedLessons.has(String(lessonId))) {
            setCanComplete(true);
            hasCompletedRef.current = true;
        } else {
            setCanComplete(false);
        }
        
        setIsBookmarked(false);
    }, [lessonOrderNum, completedLessons, currentLesson]);

    useEffect(() => {
        const lessonId = currentLesson?._id || currentLesson?.id;
        if (!lessonId) {
            setNotes([]);
            setNotesError('');
            return;
        }

        setNotesLoading(true);
        setNotesError('');

        fetchNotesByLesson(lessonId)
            .then((data) => {
                const items = Array.isArray(data) ? data : [];
                setNotes(
                    items
                        .slice()
                        .sort((a, b) => {
                            const ta = Number.isFinite(Number(a?.timestamp)) ? Number(a.timestamp) : Number.MAX_SAFE_INTEGER;
                            const tb = Number.isFinite(Number(b?.timestamp)) ? Number(b.timestamp) : Number.MAX_SAFE_INTEGER;
                            if (ta !== tb) return ta - tb;
                            return new Date(a?.createdAt || 0) - new Date(b?.createdAt || 0);
                        })
                );
            })
            .catch((err) => {
                setNotesError(err?.message || 'Failed to load notes');
            })
            .finally(() => {
                setNotesLoading(false);
            });
    }, [currentLesson?._id, currentLesson?.id]);

    // Load discussions for current lesson
    useEffect(() => {
        const lessonId = currentLesson?._id || currentLesson?.id;
        if (!lessonId) {
            setDiscussions([]);
            setDiscussionsError('');
            setSelectedDiscussion(null);
            return;
        }

        setDiscussionsLoading(true);
        setDiscussionsError('');

        fetchDiscussionsByLesson(lessonId, discussionSortBy)
            .then((data) => {
                const items = Array.isArray(data) ? data : [];
                setDiscussions(items);
                setSelectedDiscussion(null);
            })
            .catch((err) => {
                setDiscussionsError(err?.message || 'Failed to load discussions');
            })
            .finally(() => {
                setDiscussionsLoading(false);
            });
    }, [currentLesson?._id, currentLesson?.id, discussionSortBy]);

    // Load replies for selected discussion
    useEffect(() => {
        if (!selectedDiscussion?._id) {
            setReplies([]);
            return;
        }

        setRepliesLoading(true);

        fetchRepliesByDiscussion(selectedDiscussion._id)
            .then((data) => {
                const items = Array.isArray(data) ? data : [];
                setReplies(items);
            })
            .catch((err) => {
                toast.error('Failed to load replies');
            })
            .finally(() => {
                setRepliesLoading(false);
            });
    }, [selectedDiscussion?._id]);

    // Load quiz for current lesson and restore any previous pass result from localStorage
    useEffect(() => {
        if (!courseId || !lessonOrderNum) return;

        const storageKey = `quiz_${courseId}_${lessonOrderNum}`;
        const stored = localStorage.getItem(storageKey);
        const alreadyPassed = stored === 'passed';

        setQuizResult(null);
        setQuizAnswers({});
        setLessonQuiz(null);
        setQuizPassed(alreadyPassed);
        setQuizLoading(true);

        fetchQuizByLesson(courseId, lessonOrderNum)
            .then((quiz) => {
                setLessonQuiz(quiz || null);
                // If quiz exists but already passed, keep quizPassed = true
            })
            .catch(() => {
                setLessonQuiz(null); // treat fetch error as "no quiz"
            })
            .finally(() => setQuizLoading(false));
    }, [courseId, lessonOrderNum]);

    const handleQuizSubmit = async () => {
        if (!lessonQuiz) return;
        const total = lessonQuiz.questions.length;
        const answered = Object.keys(quizAnswers).length;
        if (answered < total) {
            toast.error(`Please answer all ${total} questions before submitting.`);
            return;
        }

        // Build answers array in question order
        const answersArray = lessonQuiz.questions.map((_, i) => quizAnswers[i] ?? '');

        setQuizSubmitting(true);
        try {
            const result = await submitQuizAnswers(lessonQuiz._id, answersArray);
            const passed = result.passed || result.percentage >= 60;
            setQuizResult(result);
            setQuizPassed(passed);
            if (passed) {
                const storageKey = `quiz_${courseId}_${lessonOrderNum}`;
                localStorage.setItem(storageKey, 'passed');
                toast.success(`ðŸŽ‰ Quiz passed! ${result.percentage}% â€” you can proceed to the next lesson.`);
            } else {
                toast.error(`Quiz failed (${result.percentage}%). You need 60% to proceed. Try again!`);
            }
        } catch (err) {
            toast.error(err?.message || 'Failed to submit quiz');
        } finally {
            setQuizSubmitting(false);
        }
    };

    // Navigation helpers â€” use order numbers for URLs, not ObjectIds
    const currentLessonOrder = Number(currentLesson?.order);
    const currentIndex = allLessons.findIndex(l => Number(l.order) === currentLessonOrder);
    const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
    const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

    const goToLesson = (lesson) => {
        if (lesson) navigate(`/learner/courses/${courseId}/lessons/${lesson.order}`);
    };

    // Progress
    const progressPercent = allLessons.length > 0
        ? Math.round(((currentIndex + 1) / allLessons.length) * 100)
        : 0;
    const currentLessonId = String(currentLesson?._id || currentLesson?.id || '');
    const isCurrentLessonCompleted = currentLesson
        ? completedLessons.has(currentLessonId) || hasCompletedRef.current
        : false;
    const lessonQuizLocked = !!lessonQuiz && !quizPassed && !isCurrentLessonCompleted;
    const quizzesByLessonOrder = allLessons.reduce((map, lesson) => {
        map.set(Number(lesson.order), []);
        return map;
    }, new Map());

    (courseQuizzes || []).forEach((quiz) => {
        const order = Number(quiz.lessonOrder);
        if (!Number.isFinite(order) || order <= 0) return;
        if (!quizzesByLessonOrder.has(order)) {
            quizzesByLessonOrder.set(order, []);
        }
        quizzesByLessonOrder.get(order).push(quiz);
    });

    const areLessonQuizzesPassed = (order) => {
        const quizzes = quizzesByLessonOrder.get(Number(order)) || [];
        if (quizzes.length === 0) {
            return true;
        }
        return quizzes.every((quiz) => quiz.status === 'completed' || quiz.passed);
    };

    const isLessonUnlocked = (lesson) => {
        if (!lesson) {
            return false;
        }

        const order = Number(lesson.order);
        if (!Number.isFinite(order) || order <= 1) {
            return true;
        }

        const previousLesson = allLessons.find((candidate) => Number(candidate.order) === order - 1);
        if (!previousLesson) {
            return true;
        }

        const previousLessonId = String(previousLesson._id || previousLesson.id || '');
        const previousCompleted = completedLessons.has(previousLessonId);
        return previousCompleted && areLessonQuizzesPassed(previousLesson.order);
    };
    const currentLessonQuizzesPassed = currentLesson ? areLessonQuizzesPassed(currentLesson.order) : true;
    const completionReadyLessonIds = new Set(completedLessons);
    if (isCurrentLessonCompleted && currentLessonId) {
        completionReadyLessonIds.add(currentLessonId);
    }
    const hasCompletedEntireCourse = allLessons.length > 0 && allLessons.every((lesson) => {
        const lessonId = String(lesson._id || lesson.id || '');
        return completionReadyLessonIds.has(lessonId) && areLessonQuizzesPassed(lesson.order);
    });
    const canClaimCertificate = hasCompletedEntireCourse;

    // Video event handlers for ReactPlayer
    const handleProgress = (state) => {
        const currentVideoTime = state.playedSeconds;
        const delta = currentVideoTime - lastTimeRef.current;
        
        // Only add to watch time if the delta is positive and less than 2 seconds (not a seek)
        if (delta > 0 && delta < 2) {
            watchTimeRef.current += delta;
        }
        
        lastTimeRef.current = currentVideoTime;
        setCurrentTime(currentVideoTime);
        
        // Enable completion after genuinely watching 80% of the video
        if (!hasCompletedRef.current && duration > 0 && watchTimeRef.current >= duration * 0.8) {
            setCanComplete(true);
            hasCompletedRef.current = true;
        }
    };

    const handleDuration = (dur) => {
        setDuration(dur);
        lastTimeRef.current = 0; // Reset last time when video loads
    };

    const handleReady = (player) => {
        playerRef.current = player;
        // Get duration via the internal player API
        try {
            const dur = player.getDuration();
            if (dur && !isNaN(dur)) {
                setDuration(dur);
                lastTimeRef.current = 0;
            }
        } catch (e) {
            // getDuration may not be available immediately for some sources
        }
    };

    const handleComplete = async () => {
        if (!canComplete) {
            toast.error('Please actually watch at least 80% of the video before continuing');
            return;
        }

        try {
            await updateProgress(courseId, currentLesson._id);
            setCompletedLessons(prev => new Set([...prev, String(currentLesson._id)]));
        } catch (err) {
            console.error('Failed to update progress:', err);
            toast.error('Failed to save progress, but you can proceed.');
        }

        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#3b82f6', '#8b5cf6', '#10b981']
        });

        if (nextLesson) {
            goToLesson(nextLesson);
        } else {
            toast.success('ðŸŽ‰ Congratulations! You finished the course!');
            navigate(`/learner/courses/${courseId}`);
        }
    };

    const handleClaimCertificate = async () => {
        if (!canClaimCertificate) {
            toast.error('Finish every lesson and pass all required quizzes to unlock your certificate.');
            return;
        }

        try {
            await issueCertificate(courseId);
            toast.success('Certificate is ready for you.');
            navigate(ROUTES.LEARNER_CERTIFICATES);
        } catch (err) {
            toast.error(err?.message || 'Failed to unlock certificate');
        }
    };

    const handleReviewCourse = () => {
        navigate(`/learner/courses/${courseId}`, {
            state: { openRatingModal: true },
        });
    };

    // Build the full content URL
    const getContentUrl = (lesson) => {
        const rawUrl = resolveLessonRawUrl(lesson);
        if (!rawUrl) return null;
        
        // Convert YouTube embed URLs to watch URLs (ReactPlayer requires watch format)
        // e.g. https://www.youtube.com/embed/pQN-pnXPaVg -> https://www.youtube.com/watch?v=pQN-pnXPaVg
        if (rawUrl.includes('youtube.com/embed/')) {
            const videoId = rawUrl.split('youtube.com/embed/')[1]?.split('?')[0];
            if (videoId) return `https://www.youtube.com/watch?v=${videoId}`;
        }
        
        // Handle youtu.be short links
        if (rawUrl.includes('youtu.be/')) {
            const videoId = rawUrl.split('youtu.be/')[1]?.split('?')[0];
            if (videoId) return `https://www.youtube.com/watch?v=${videoId}`;
        }
        
        // If it's already an absolute URL (CDN, direct video, etc.)
        if (/^https?:\/\//i.test(rawUrl)) return rawUrl;
        
        // Otherwise, prefix with the backend base URL (local uploads)
        const normalizedPath = rawUrl.startsWith('/') ? rawUrl : `/${rawUrl}`;
        return `${API_BASE}${normalizedPath}`;
    };

    const isYouTubeUrl = (url) => {
        if (!url) return false;
        return /youtube\.com|youtu\.be/i.test(url);
    };

    const isDirectVideoFileUrl = (url) => {
        if (!url) return false;
        return /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(url) || /\/uploads\//i.test(url);
    };

    const formatTimestamp = (seconds) => {
        if (!Number.isFinite(Number(seconds)) || Number(seconds) < 0) return '--:--';
        const whole = Math.floor(Number(seconds));
        const mins = Math.floor(whole / 60);
        const secs = whole % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    const seekToTimestamp = (seconds) => {
        const numeric = Number(seconds);
        if (!Number.isFinite(numeric) || numeric < 0) return;

        if (videoRef.current) {
            videoRef.current.currentTime = numeric;
            return;
        }

        try {
            playerRef.current?.seekTo(numeric, 'seconds');
        } catch (_) {
        }
    };

    // Get actual current time from video element/player (not from state)
    const getActualCurrentTime = () => {
        // Try native video ref first
        if (videoRef.current?.currentTime !== undefined) {
            return videoRef.current.currentTime;
        }
        // Then try ReactPlayer ref
        if (playerRef.current?.getCurrentTime) {
            try {
                const time = playerRef.current.getCurrentTime();
                if (Number.isFinite(time)) {
                    return time;
                }
            } catch (_) {
                // ignore
            }
        }
        // Fallback to state
        return currentTime;
    };

    const handleSaveNote = async () => {
        const lessonId = currentLesson?._id || currentLesson?.id;
        const content = String(noteInput || '').trim();

        if (!lessonId) {
            toast.error('Lesson not loaded');
            return;
        }

        if (!content) {
            toast.error('Please write a note before saving');
            return;
        }

        // Capture the live playback position at save time
        const noteTimestamp = isVideo ? Math.floor(getActualCurrentTime() || 0) : null;

        setNotesSaving(true);
        try {
            const saved = await createNote({
                lessonId,
                content,
                timestamp: noteTimestamp,
            });

            setNotes((prev) =>
                [...prev, saved].sort((a, b) => {
                    const ta = Number.isFinite(Number(a?.timestamp)) ? Number(a.timestamp) : Number.MAX_SAFE_INTEGER;
                    const tb = Number.isFinite(Number(b?.timestamp)) ? Number(b.timestamp) : Number.MAX_SAFE_INTEGER;
                    if (ta !== tb) return ta - tb;
                    return new Date(a?.createdAt || 0) - new Date(b?.createdAt || 0);
                })
            );
            setNoteInput('');
            toast.success('Note saved');
        } catch (err) {
            toast.error(err?.message || 'Failed to save note');
        } finally {
            setNotesSaving(false);
        }
    };

    const handleDeleteNote = async (noteId) => {
        try {
            await deleteNote(noteId);
            setNotes((prev) => prev.filter((note) => String(note._id || note.id) !== String(noteId)));
            toast.success('Note deleted');
        } catch (err) {
            toast.error(err?.message || 'Failed to delete note');
        }
    };

    // Discussion handlers
    const handleCreateDiscussion = async ({ title, content, tags }) => {
        const lessonId = currentLesson?._id || currentLesson?.id;
        if (!lessonId) {
            toast.error('Lesson not loaded');
            return;
        }

        setCreatingDiscussion(true);
        try {
            await createDiscussionThread({
                lessonId,
                title,
                content,
                tags,
            });

            // Reload discussions
            const updated = await fetchDiscussionsByLesson(lessonId, discussionSortBy);
            setDiscussions(updated || []);
            setShowCreateModal(false);
            toast.success('Discussion created successfully');
        } catch (err) {
            toast.error(err?.message || 'Failed to create discussion');
            throw err;
        } finally {
            setCreatingDiscussion(false);
        }
    };

    const handleAddReply = async (discussionId, content) => {
        setCreatingReply(true);
        try {
            await createDiscussionReply({
                discussionId,
                content,
            });

            // Reload replies
            const updated = await fetchRepliesByDiscussion(discussionId);
            setReplies(updated || []);
            toast.success('Reply posted successfully');
        } catch (err) {
            toast.error(err?.message || 'Failed to post reply');
            throw err;
        } finally {
            setCreatingReply(false);
        }
    };

    const handleUpvoteDiscussion = async (discussionId) => {
        try {
            const updated = await upvoteDiscussion(discussionId);
            setDiscussions(prev =>
                prev.map(d =>
                    String(d._id) === String(discussionId)
                        ? { ...d, upvotes: updated.upvotes }
                        : d
                )
            );
            if (selectedDiscussion?._id === discussionId) {
                setSelectedDiscussion(prev => ({ ...prev, upvotes: updated.upvotes }));
            }
            toast.success('Upvoted');
        } catch (err) {
            toast.error(err?.message || 'Failed to upvote');
        }
    };

    const handleUpvoteReply = async (replyId) => {
        try {
            const updated = await upvoteReply(replyId);
            setReplies(prev =>
                prev.map(r =>
                    String(r._id) === String(replyId)
                        ? { ...r, upvotes: updated.upvotes }
                        : r
                )
            );
            toast.success('Reply upvoted');
        } catch (err) {
            toast.error(err?.message || 'Failed to upvote reply');
        }
    };

    const handleMarkBestAnswer = async (replyId, discussionId) => {
        try {
            await markBestAnswer(replyId, { discussionId });
            const updated = await fetchRepliesByDiscussion(discussionId);
            setReplies(updated || []);
            toast.success('Best answer marked');
        } catch (err) {
            toast.error(err?.message || 'Failed to mark best answer');
        }
    };

    const handleResolveDiscussion = async (discussionId) => {
        try {
            const updated = await resolveDiscussion(discussionId);
            setDiscussions(prev =>
                prev.map(d =>
                    String(d._id) === String(discussionId)
                        ? { ...d, isResolved: updated.isResolved }
                        : d
                )
            );
            setSelectedDiscussion(prev => ({ ...prev, isResolved: updated.isResolved }));
            toast.success(updated.isResolved ? 'Marked as resolved' : 'Marked as unresolved');
        } catch (err) {
            toast.error(err?.message || 'Failed to update discussion');
        }
    };

    const handleDeleteDiscussion = async (discussionId) => {
        try {
            await deleteDiscussionThread(discussionId);
            setDiscussions(prev => prev.filter(d => String(d._id) !== String(discussionId)));
            setSelectedDiscussion(null);
            toast.success('Discussion deleted');
        } catch (err) {
            toast.error(err?.message || 'Failed to delete discussion');
        }
    };

    const handleDeleteReply = async (replyId) => {
        try {
            await deleteDiscussionReply(replyId);
            setReplies(prev => prev.filter(r => String(r._id) !== String(replyId)));
            toast.success('Reply deleted');
        } catch (err) {
            toast.error(err?.message || 'Failed to delete reply');
        }
    };

    // â”€â”€ Loading State â”€â”€
    if (loading) {
        return (
            <div className="flex flex-col h-screen items-center justify-center bg-slate-900 text-white">
                <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-slate-400 font-medium">Loading lesson...</p>
            </div>
        );
    }

    // â”€â”€ Error State â”€â”€
    if (error || !currentLesson) {
        return (
            <div className="flex flex-col h-screen items-center justify-center bg-slate-900 text-white space-y-4">
                <HiX className="w-16 h-16 text-rose-500" />
                <h2 className="text-xl font-bold">Lesson Not Found</h2>
                <p className="text-slate-400">{error || 'This lesson could not be loaded.'}</p>
                <Link to={`/learner/courses/${courseId}`}>
                    <Button variant="outline" className="text-white border-white/20 hover:bg-white/10">
                        Back to Course
                    </Button>
                </Link>
            </div>
        );
    }

    const contentUrl = getContentUrl(currentLesson);
    const lessonType = inferLessonType(currentLesson);
    const isVideo = lessonType === 'video';
    const isPdf = lessonType === 'pdf';
    const useNativeVideo = isVideo && contentUrl && !isYouTubeUrl(contentUrl) && isDirectVideoFileUrl(contentUrl);
    const courseTitle = course?.title || currentLesson.courseId?.title || 'Course';

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-white">
            {/* Top Header */}
            <header className="h-14 bg-slate-900 text-white border-b border-white/10 flex items-center justify-between px-4 z-50">
                <div className="flex items-center gap-4">
                    <Link to={`/learner/courses/${courseId}`} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                        <HiChevronLeft className="w-5 h-5" />
                    </Link>
                    <div className="h-6 w-px bg-white/20 hidden sm:block" />
                    <div className="hidden sm:block">
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">{courseTitle}</p>
                        <h1 className="text-sm font-semibold truncate max-w-xs">{currentLesson.title}</h1>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="hidden md:flex items-center gap-2 mr-4">
                        <p className="text-xs text-slate-400">Progress</p>
                        <div className="w-32 h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div className="bg-indigo-500 h-full rounded-full transition-all duration-1000" style={{ width: `${progressPercent}%` }} />
                        </div>
                        <span className="text-xs font-bold">{progressPercent}%</span>
                    </div>
                    <Button 
                        size="sm" 
                        variant="secondary" 
                        className={clsx(
                            "border-none transition-all",
                            isBookmarked ? "bg-amber-500 text-white" : "bg-white/10 text-white hover:bg-white/20"
                        )}
                        onClick={() => {
                            setIsBookmarked(!isBookmarked);
                            toast.success(isBookmarked ? 'Bookmark removed' : 'Lesson bookmarked');
                        }}
                    >
                        <HiBookmark className="w-4 h-4 mr-1" /> {isBookmarked ? 'Saved' : 'Save'}
                    </Button>
                    <Button 
                        size="sm" 
                        className={clsx(
                            "border-none transition-all",
                            !canComplete ? "bg-slate-700 text-slate-400 cursor-not-allowed opacity-50" : "bg-primary-600 active:scale-95"
                        )}
                        onClick={handleComplete}
                    >
                        {!canComplete ? (
                            <span className="flex items-center gap-2">
                                Watch to continue <HiClock className="w-3 h-3 animate-pulse" />
                            </span>
                        ) : (
                            nextLesson ? 'Complete & Continue' : 'Finish Course'
                        )}
                    </Button>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* Main content Area */}
                <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
                    {/* Player / Content Container */}
                    <div className="flex-1 bg-black relative flex items-center justify-center">
                        {isVideo && contentUrl ? (
                            /* â”€â”€ ReactPlayer with YouTube native controls (fullscreen + speed built-in) â”€â”€ */
                            <div
                                ref={playerContainerRef}
                                className="w-full h-full bg-black"
                            >
                                {useNativeVideo ? (
                                    <video
                                        ref={videoRef}
                                        src={contentUrl}
                                        className="w-full h-full"
                                        controls
                                        playsInline
                                        preload="metadata"
                                        onPlay={() => setIsPlaying(true)}
                                        onPause={() => setIsPlaying(false)}
                                        onEnded={() => {
                                            setIsPlaying(false);
                                            setCanComplete(true);
                                        }}
                                        onLoadedMetadata={(event) => {
                                            const loadedDuration = event.currentTarget.duration;
                                            if (Number.isFinite(loadedDuration)) {
                                                setDuration(loadedDuration);
                                            }
                                            event.currentTarget.playbackRate = playbackRate;
                                            lastTimeRef.current = 0;
                                        }}
                                        onTimeUpdate={(event) => {
                                            const currentVideoTime = event.currentTarget.currentTime || 0;
                                            const delta = currentVideoTime - lastTimeRef.current;

                                            if (delta > 0 && delta < 2) {
                                                watchTimeRef.current += delta;
                                            }

                                            lastTimeRef.current = currentVideoTime;
                                            setCurrentTime(currentVideoTime);

                                            if (!hasCompletedRef.current && duration > 0 && watchTimeRef.current >= duration * 0.8) {
                                                setCanComplete(true);
                                                hasCompletedRef.current = true;
                                            }
                                        }}
                                        onError={() => {
                                            toast.error('Video failed to load. Please check the lesson file URL.');
                                        }}
                                    />
                                ) : (
                                    <ReactPlayer
                                        ref={playerRef}
                                        src={contentUrl}
                                        url={contentUrl}
                                        width="100%"
                                        height="100%"
                                        controls={true}
                                        playsInline={true}
                                        playbackRate={playbackRate}
                                        onPlay={() => setIsPlaying(true)}
                                        onPause={() => setIsPlaying(false)}
                                        onEnded={() => { setIsPlaying(false); setCanComplete(true); }}
                                        onProgress={handleProgress}
                                        onReady={handleReady}
                                        onError={() => {
                                            toast.error('Video failed to load. Please check the lesson URL.');
                                        }}
                                        progressInterval={1000}
                                        config={{
                                            youtube: {
                                                playerVars: {
                                                    rel: 0,
                                                    modestbranding: 1,
                                                    fs: 1,
                                                }
                                            }
                                        }}
                                    />
                                )}
                            </div>
                        ) : isPdf && contentUrl ? (
                            /* â”€â”€ PDF Viewer â”€â”€ */
                            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 p-8">
                                <div className="max-w-2xl w-full space-y-6 text-center">
                                    <div className="w-24 h-24 bg-rose-500/10 rounded-3xl flex items-center justify-center mx-auto">
                                        <HiDocumentText className="w-12 h-12 text-rose-400" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-white">{currentLesson.title}</h3>
                                    <p className="text-slate-400">PDF Document</p>
                                    <div className="flex gap-4 justify-center">
                                        <a href={contentUrl} target="_blank" rel="noopener noreferrer">
                                            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white" icon={<HiExternalLink className="w-4 h-4" />}>
                                                Open PDF
                                            </Button>
                                        </a>
                                        <a href={contentUrl} download>
                                            <Button variant="outline" className="text-white border-white/20 hover:bg-white/10" icon={<HiDownload className="w-4 h-4" />}>
                                                Download
                                            </Button>
                                        </a>
                                    </div>
                                    <iframe
                                        src={contentUrl}
                                        className="w-full h-[400px] rounded-2xl border border-white/10 mt-6"
                                        title={currentLesson.title}
                                    />
                                </div>
                                {/* Auto-enable completion for PDF lessons */}
                                {!canComplete && setTimeout(() => setCanComplete(true), 5000) && null}
                            </div>
                        ) : (
                            /* â”€â”€ No Content Fallback â”€â”€ */
                            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 text-white space-y-4">
                                <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center animate-pulse">
                                    <HiAcademicCap className="w-10 h-10 text-indigo-400" />
                                </div>
                                <h3 className="text-lg font-bold">{currentLesson.title}</h3>
                                <p className="text-slate-400 text-sm max-w-md text-center">
                                    {currentLesson.description || 'No video content available for this lesson yet. Check back soon!'}
                                </p>
                                {/* Enable completion after 3 seconds for content-less lessons */}
                                {!canComplete && setTimeout(() => setCanComplete(true), 3000) && null}
                            </div>
                        )}

                        {/* Float Controls Overlay */}
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-slate-900/80 backdrop-blur-md p-2 rounded-2xl border border-white/10 shadow-2xl z-30">
                            <Button 
                                size="sm" 
                                variant="ghost" 
                                disabled={!prevLesson} 
                                className="text-white hover:bg-white/10"
                                onClick={() => goToLesson(prevLesson)}
                            >
                                <HiChevronLeft /> Prev
                            </Button>
                            {isVideo && contentUrl && (
                                <>
                                    <div className="h-4 w-px bg-white/20 mx-1" />
                                    <div className="relative">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="text-white hover:bg-white/10"
                                            onClick={() => setShowSpeedMenu((prev) => !prev)}
                                        >
                                            {playbackRate}x
                                        </Button>
                                        {showSpeedMenu && (
                                            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-slate-900 border border-white/20 rounded-xl p-1 min-w-24">
                                                {[0.5, 1, 1.25, 1.5, 2].map((speed) => (
                                                    <button
                                                        key={speed}
                                                        onClick={() => handleSpeedChange(speed)}
                                                        className={clsx(
                                                            'w-full text-left px-3 py-1.5 text-xs rounded-lg transition-colors',
                                                            playbackRate === speed ? 'bg-indigo-600 text-white' : 'text-slate-200 hover:bg-white/10'
                                                        )}
                                                    >
                                                        {speed}x
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="text-white hover:bg-white/10"
                                        onClick={toggleFullscreen}
                                    >
                                        <HiArrowsExpand /> Fullscreen
                                    </Button>
                                </>
                            )}
                            <div className="h-4 w-px bg-white/20 mx-1" />
                            <span className="text-xs text-white px-2">Lesson {currentIndex >= 0 ? currentIndex + 1 : 1} of {allLessons.length}</span>
                            <div className="h-4 w-px bg-white/20 mx-1" />
                            <Button 
                                size="sm" 
                                variant="ghost" 
                                disabled={!nextLesson || (!hasCompletedRef.current && !completedLessons.has(String(currentLesson?._id))) || !currentLessonQuizzesPassed}
                                className="text-white hover:bg-white/10"
                                onClick={() => {
                                    const lessonDone = hasCompletedRef.current || completedLessons.has(String(currentLesson?._id));
                                    if (!nextLesson) return;
                                    if (!lessonDone) {
                                        toast.error('Please complete this lesson to unlock the next one!');
                                    } else if (!currentLessonQuizzesPassed) {
                                        toast.error('Pass the quiz to unlock the next lesson!');
                                        setActiveTab('quiz');
                                    } else {
                                        goToLesson(nextLesson);
                                    }
                                }}
                            >
                                Next <HiChevronRight />
                            </Button>
                        </div>
                    </div>

                    {/* Bottom Content / Tabs */}
                    <div className="h-1/3 bg-white border-t border-surface-border overflow-y-auto">
                        <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-text-primary">{currentLesson.title}</h2>
                                <div className="flex gap-4">
                                    <button className={clsx("text-sm font-semibold pb-2 border-b-2 transition-all", activeTab === 'notes' ? "border-primary-600 text-primary-600" : "border-transparent text-text-muted")} onClick={() => setActiveTab('notes')}>Notes</button>
                                    <button className={clsx("text-sm font-semibold pb-2 border-b-2 transition-all", activeTab === 'resources' ? "border-primary-600 text-primary-600" : "border-transparent text-text-muted")} onClick={() => setActiveTab('resources')}>Resources</button>
                                    <button className={clsx("text-sm font-semibold pb-2 border-b-2 transition-all", activeTab === 'discussion' ? "border-primary-600 text-primary-600" : "border-transparent text-text-muted")} onClick={() => setActiveTab('discussion')}>Discussion</button>
                                    {(lessonQuiz || quizLoading) && (
                                        <button
                                            className={clsx("text-sm font-semibold pb-2 border-b-2 transition-all flex items-center gap-1", activeTab === 'quiz' ? "border-primary-600 text-primary-600" : "border-transparent text-text-muted")}
                                            onClick={() => setActiveTab('quiz')}
                                        >
                                            Quiz
                                            {lessonQuiz && !quizPassed && <span className="ml-1 w-2 h-2 rounded-full bg-rose-500 inline-block" />}
                                            {lessonQuiz && quizPassed && <span className="ml-1 w-2 h-2 rounded-full bg-emerald-500 inline-block" />}
                                        </button>
                                    )}
                                </div>
                            </div>

                            {activeTab === 'notes' && (
                                <div className="space-y-4">
                                    <div className="bg-white rounded-xl p-4 border border-surface-border space-y-3">
                                        <h4 className="text-sm font-bold text-text-primary">My Notes</h4>
                                        <textarea
                                            value={noteInput}
                                            onChange={(event) => setNoteInput(event.target.value)}
                                            onFocus={() => {
                                                // Refresh the display when user focuses
                                                setCurrentTime(getActualCurrentTime());
                                            }}
                                            onMouseEnter={() => {
                                                // Also update when hovering
                                                setCurrentTime(getActualCurrentTime());
                                            }}
                                            placeholder={isVideo ? `Write your note... (current time ${formatTimestamp(getActualCurrentTime())})` : 'Write your note...'}
                                            className="w-full min-h-[96px] rounded-lg border border-surface-border p-3 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                                        />
                                        <div className="flex items-center justify-between">
                                            <p className="text-xs text-text-muted">
                                                {isVideo ? `Timestamp: ${formatTimestamp(getActualCurrentTime())} (${Math.floor(getActualCurrentTime() || 0)}s)` : 'Timestamp is available for video lessons'}
                                            </p>
                                            <Button
                                                size="sm"
                                                className="bg-primary-600 text-white hover:bg-primary-700"
                                                disabled={notesSaving}
                                                onClick={handleSaveNote}
                                            >
                                                {notesSaving ? 'Saving...' : 'Save Note'}
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="bg-surface-muted rounded-xl p-4 border border-surface-border space-y-3">
                                        <h4 className="text-sm font-bold text-text-primary">Saved Notes</h4>

                                        {notesLoading && <p className="text-sm text-text-muted">Loading notes...</p>}
                                        {!notesLoading && notesError && <p className="text-sm text-rose-600">{notesError}</p>}

                                        {!notesLoading && !notesError && notes.length === 0 && (
                                            <p className="text-sm text-text-muted">No notes yet for this lesson.</p>
                                        )}

                                        {!notesLoading && !notesError && notes.length > 0 && (
                                            <div className="space-y-2">
                                                {notes.map((note) => {
                                                    const noteId = note._id || note.id;
                                                    const hasTimestamp = Number.isFinite(Number(note?.timestamp)) && Number(note.timestamp) >= 0;
                                                    return (
                                                        <div
                                                            key={noteId}
                                                            className="rounded-lg border border-surface-border bg-white p-3 flex items-start justify-between gap-3"
                                                        >
                                                            <button
                                                                type="button"
                                                                className="text-left flex-1"
                                                                onClick={() => {
                                                                    if (hasTimestamp) {
                                                                        seekToTimestamp(Number(note.timestamp));
                                                                        toast.success(`Seeked to ${formatTimestamp(note.timestamp)}`);
                                                                    }
                                                                }}
                                                            >
                                                                <p className="text-sm text-text-primary whitespace-pre-wrap">{note.content}</p>
                                                                <p className="text-xs text-text-muted mt-2">
                                                                    {hasTimestamp
                                                                        ? `${formatTimestamp(note.timestamp)} (${Math.floor(Number(note.timestamp))}s)`
                                                                        : 'No timestamp'}
                                                                </p>
                                                            </button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="text-rose-600 border-rose-200 hover:bg-rose-50"
                                                                onClick={() => handleDeleteNote(noteId)}
                                                            >
                                                                Delete
                                                            </Button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    <div className="bg-surface-muted rounded-xl p-4 border border-surface-border">
                                        <h4 className="text-sm font-bold text-text-primary mb-2 flex items-center gap-2">
                                            <HiBookmark className="text-amber-500" /> Lesson Info
                                        </h4>
                                        <ul className="text-sm text-text-secondary space-y-2">
                                            <li className="flex items-center gap-2">
                                                <HiClock className="w-4 h-4 text-slate-400" />
                                                Duration: {isVideo && duration > 0 ? formatDuration(duration) : currentLesson.duration || 'N/A'}
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <HiDocumentText className="w-4 h-4 text-slate-400" />
                                                Type: <Badge color={isVideo ? 'blue' : 'rose'} className="text-[10px]">{String(currentLesson.type || lessonType || '').toUpperCase()}</Badge>
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <HiAcademicCap className="w-4 h-4 text-slate-400" />
                                                Course: {courseTitle}
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'resources' && (
                                <div className="space-y-4">
                                    {contentUrl && (
                                        <div className="bg-surface-muted rounded-xl p-4 border border-surface-border flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                {isVideo ? <HiPlay className="w-5 h-5 text-indigo-500" /> : <HiDocumentText className="w-5 h-5 text-rose-500" />}
                                                <div>
                                                    <p className="text-sm font-bold text-text-primary">{currentLesson.title}</p>
                                                    <p className="text-xs text-text-muted">{isVideo ? 'Video File' : 'PDF Document'}</p>
                                                </div>
                                            </div>
                                            <a href={contentUrl} target="_blank" rel="noopener noreferrer">
                                                <Button size="sm" variant="outline" icon={<HiExternalLink className="w-3 h-3" />}>Open</Button>
                                            </a>
                                        </div>
                                    )}
                                    {!contentUrl && (
                                        <p className="text-text-muted text-sm">No downloadable resources for this lesson.</p>
                                    )}
                                </div>
                            )}

                            {activeTab === 'discussion' && (
                                <>
                                    {!selectedDiscussion ? (
                                        <DiscussionList
                                            discussions={discussions}
                                            loading={discussionsLoading}
                                            error={discussionsError}
                                            sortBy={discussionSortBy}
                                            onSortChange={setDiscussionSortBy}
                                            onSelectDiscussion={setSelectedDiscussion}
                                            onCreateNew={() => setShowCreateModal(true)}
                                            onUpvote={handleUpvoteDiscussion}
                                        />
                                    ) : (
                                        <DiscussionDetail
                                            discussion={selectedDiscussion}
                                            replies={replies}
                                            currentUserId={currentUser?._id || currentUser?.id}
                                            currentUserRole={currentUser?.role || 'learner'}
                                            loading={false}
                                            repliesLoading={repliesLoading}
                                            error={null}
                                            onBack={() => setSelectedDiscussion(null)}
                                            onAddReply={handleAddReply}
                                            onUpvoteReply={handleUpvoteReply}
                                            onMarkBestAnswer={handleMarkBestAnswer}
                                            onDeleteReply={handleDeleteReply}
                                            onUpvoteDiscussion={handleUpvoteDiscussion}
                                            onResolveDiscussion={handleResolveDiscussion}
                                            onDeleteDiscussion={handleDeleteDiscussion}
                                        />
                                    )}
                                </>
                            )}

                                {activeTab === 'quiz' && (
                                    <div className="space-y-5">
                                        {quizLoading && (
                                            <p className="text-sm text-text-muted">Loading quiz...</p>
                                        )}
                                        {!quizLoading && !lessonQuiz && (
                                            <p className="text-sm text-text-muted">No quiz for this lesson.</p>
                                        )}
                                        {!quizLoading && lessonQuiz && (
                                            <>
                                                <div className="flex items-center justify-between">
                                                    <h4 className="text-base font-bold text-text-primary">{lessonQuiz.title}</h4>
                                                    {quizPassed && (
                                                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-xs font-bold border border-emerald-200">
                                                            <HiCheckCircle className="w-3 h-3" /> Passed
                                                        </span>
                                                    )}
                                                    {!quizPassed && quizResult && (
                                                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-rose-50 text-rose-600 text-xs font-bold border border-rose-200">
                                                            Failed — {quizResult.percentage}%
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-text-muted">
                                                    Pass mark: {lessonQuiz.passingScore || 60}% · {(lessonQuiz.questionCount || lessonQuiz.questions.length)} question{(lessonQuiz.questionCount || lessonQuiz.questions.length) !== 1 ? 's' : ''}
                                                </p>
                                                {lessonQuizLocked ? (
                                                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center space-y-3">
                                                        <div className="w-12 h-12 mx-auto rounded-2xl bg-white border border-slate-200 flex items-center justify-center">
                                                            <HiLockClosed className="w-6 h-6 text-slate-400" />
                                                        </div>
                                                        <p className="text-sm font-bold text-slate-700">Quiz locked</p>
                                                        <p className="text-sm text-text-muted">
                                                            {lessonQuiz.requirement || 'Finish watching this lesson to unlock the quiz.'}
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="space-y-6">
                                                            {lessonQuiz.questions.map((q, qi) => {
                                                                const resultItem = quizResult?.results?.[qi];
                                                                return (
                                                                    <div key={qi} className={clsx(
                                                                        'rounded-xl border p-4 space-y-3 transition-all',
                                                                        quizResult ? (resultItem?.isCorrect ? 'border-emerald-200 bg-emerald-50/40' : 'border-rose-200 bg-rose-50/40') : 'border-surface-border bg-white'
                                                                    )}>
                                                                        <p className="text-sm font-semibold text-text-primary">{qi + 1}. {q.question}</p>
                                                                        <div className="space-y-2">
                                                                            {q.options.map((opt, oi) => {
                                                                                const isSelected = quizAnswers[qi] === opt;
                                                                                const isCorrectOpt = quizResult && resultItem?.correctAnswer === opt;
                                                                                const isWrongOpt = quizResult && isSelected && !resultItem?.isCorrect;
                                                                                return (
                                                                                    <button
                                                                                        key={oi}
                                                                                        disabled={!!quizResult}
                                                                                        onClick={() => { if (!quizResult) setQuizAnswers(prev => ({ ...prev, [qi]: opt })); }}
                                                                                        className={clsx(
                                                                                            'w-full text-left text-sm px-4 py-2.5 rounded-lg border transition-all',
                                                                                            isCorrectOpt ? 'border-emerald-400 bg-emerald-50 text-emerald-700 font-semibold'
                                                                                                : isWrongOpt ? 'border-rose-400 bg-rose-50 text-rose-700'
                                                                                                : isSelected ? 'border-primary-500 bg-primary-50 text-primary-700 font-semibold'
                                                                                                : 'border-surface-border text-text-secondary hover:border-primary-300 hover:bg-primary-50/30',
                                                                                            quizResult && 'cursor-default'
                                                                                        )}
                                                                                    >
                                                                                        {opt}
                                                                                        {isCorrectOpt && <span className="ml-2 text-emerald-600">✓</span>}
                                                                                        {isWrongOpt && <span className="ml-2 text-rose-600">✗</span>}
                                                                                    </button>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                        {!quizResult && (
                                                            <Button
                                                                className="bg-primary-600 text-white hover:bg-primary-700 w-full"
                                                                disabled={quizSubmitting || Object.keys(quizAnswers).length < lessonQuiz.questions.length}
                                                                onClick={handleQuizSubmit}
                                                            >
                                                                {quizSubmitting ? 'Submitting...' : `Submit Quiz (${Object.keys(quizAnswers).length}/${lessonQuiz.questions.length} answered)`}
                                                            </Button>
                                                        )}
                                                        {quizResult && !quizPassed && (
                                                            <Button
                                                                variant="outline"
                                                                className="w-full border-rose-300 text-rose-600 hover:bg-rose-50"
                                                                onClick={() => { setQuizResult(null); setQuizAnswers({}); }}
                                                            >
                                                                Retry Quiz
                                                            </Button>
                                                        )}
                                                        {quizResult && quizPassed && (
                                                            <div className="text-center py-4 space-y-1">
                                                                <p className="text-emerald-600 font-bold text-lg">Quiz Passed!</p>
                                                                <p className="text-sm text-text-muted">You scored {quizResult.score}/{quizResult.total} ({quizResult.percentage}%)</p>
                                                                <p className="text-xs text-text-muted">You can now proceed to the next lesson.</p>
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </>
                                        )}
                                    </div>
                                )}

                            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5">
                                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                    <div className="space-y-1">
                                        <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-400">Course Actions</p>
                                        <h3 className="text-lg font-black text-slate-900">Keep your momentum after this lesson</h3>
                                        <p className="text-sm text-slate-600">
                                            Claim your certificate as soon as the full course is complete, or leave a review for the instructor.
                                        </p>
                                    </div>
                                    <div className="flex flex-col gap-3 sm:flex-row">
                                        <Button
                                            className={clsx(
                                                'border-none',
                                                canClaimCertificate
                                                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                                    : 'bg-slate-200 text-slate-500 hover:bg-slate-200'
                                            )}
                                            onClick={handleClaimCertificate}
                                        >
                                            <HiAcademicCap className="w-4 h-4 mr-2" />
                                            {canClaimCertificate ? 'Get Certificate' : 'Certificate Locked'}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="border-amber-300 text-amber-700 hover:bg-amber-50"
                                            onClick={handleReviewCourse}
                                        >
                                            <HiStar className="w-4 h-4 mr-2" />
                                            Review Course
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Lesson Navigator */}
                <aside className={clsx(
                    "bg-white border-l border-surface-border flex flex-col transition-all duration-300",
                    sidebarOpen ? "w-80" : "w-0 overflow-hidden"
                )}>
                    <div className="p-4 border-b border-surface-border flex items-center justify-between bg-surface-muted/50">
                        <h3 className="font-bold text-sm text-text-primary uppercase tracking-wider">Course Content</h3>
                        <button onClick={() => setSidebarOpen(false)} className="md:hidden"><HiX /></button>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {allLessons.length > 0 ? (
                            <div className="divide-y divide-surface-border">
                                {allLessons.map((lesson) => {
                                    const lid = String(lesson._id || lesson.id);
                                    const active = lesson.order === lessonOrderNum;
                                    const isCompleted = completedLessons.has(lid) || (active && hasCompletedRef.current);
                                    
                                    // Locked if the previous lesson (by order) is not completed
                                    const isLocked = !isLessonUnlocked(lesson);
                                    const lessonQuizzes = quizzesByLessonOrder.get(Number(lesson.order)) || [];
                                    const allLessonQuizzesPassed = areLessonQuizzesPassed(lesson.order);

                                    return (
                                        <div key={lid} className="border-b border-surface-border">
                                            <button
                                                onClick={() => {
                                                    if (isLocked) {
                                                        toast.error('Complete the previous lesson and pass its quiz to unlock this one!');
                                                        return;
                                                    }
                                                    navigate(`/learner/courses/${courseId}/lessons/${lesson.order}`);
                                                }}
                                                className={clsx(
                                                    "w-full flex items-center gap-3 p-4 transition-all group/item text-left",
                                                    active ? "bg-indigo-50 border-l-2 border-indigo-600" : "hover:bg-slate-50",
                                                    isLocked && "opacity-50 cursor-not-allowed"
                                                )}
                                            >
                                                <div className="relative flex-shrink-0">
                                                    {isCompleted ? (
                                                        <HiCheckCircle className="w-5 h-5 text-emerald-500" />
                                                    ) : isLocked ? (
                                                        <div className="w-5 h-5 flex items-center justify-center">
                                                            <HiLockClosed className="w-4 h-4 text-slate-300" />
                                                        </div>
                                                    ) : (
                                                        <div className={clsx(
                                                            "w-5 h-5 rounded-full border-2 flex items-center justify-center text-[8px] font-black",
                                                            active ? "border-indigo-600 bg-indigo-50 text-indigo-600" : "border-slate-300 text-slate-400"
                                                        )}>
                                                            {lesson.order}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={clsx(
                                                        "text-xs font-bold truncate",
                                                        active ? "text-indigo-600" : "text-slate-700"
                                                    )}>
                                                        {lesson.title}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        {lesson.type === 'pdf' ? (
                                                            <HiDocumentText className="w-3 h-3 text-rose-400" />
                                                        ) : (
                                                            <HiPlay className="w-3 h-3 text-slate-300" />
                                                        )}
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                            {lesson.duration || lesson.type}
                                                        </span>
                                                    </div>
                                                </div>
                                            </button>
                                            {lessonQuizzes.map((quiz) => {
                                                const quizLocked = !isCompleted;
                                                const quizPassedState = quiz.status === 'completed' || quiz.passed;
                                                return (
                                                    <button
                                                        key={quiz._id}
                                                        onClick={() => {
                                                            if (quizLocked) {
                                                                toast.error(quiz.requirement || 'Finish this lesson to unlock the quiz.');
                                                                return;
                                                            }
                                                            setActiveTab('quiz');
                                                        }}
                                                        className={clsx(
                                                            "w-full flex items-center gap-3 px-4 py-3 pl-12 text-left bg-slate-50/80 transition-all",
                                                            quizLocked ? "opacity-60 cursor-not-allowed" : "hover:bg-amber-50"
                                                        )}
                                                    >
                                                        <div className="w-5 h-5 flex items-center justify-center">
                                                            {quizPassedState ? (
                                                                <HiCheckCircle className="w-4 h-4 text-emerald-500" />
                                                            ) : quizLocked ? (
                                                                <HiLockClosed className="w-4 h-4 text-slate-300" />
                                                            ) : (
                                                                <HiClipboardList className="w-4 h-4 text-amber-500" />
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-[11px] font-bold text-slate-700 truncate">{quiz.title}</p>
                                                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                                                                {quizPassedState ? 'Quiz Passed' : quizLocked ? 'Locked' : 'Quiz Required'}
                                                            </p>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                            {lessonQuizzes.length > 0 && isCompleted && !allLessonQuizzesPassed && (
                                                <div className="px-4 pb-3 pl-12 text-[10px] font-semibold text-amber-700 bg-slate-50/80">
                                                    Pass this quiz to unlock the next lesson.
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="p-6 text-center text-sm text-text-muted">
                                No lessons available for this course.
                            </div>
                        )}
                    </div>
                </aside>

                {/* Mini Toggle handle for sidebar if closed */}
                {!sidebarOpen && (
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="fixed right-0 top-1/2 -translate-y-1/2 bg-slate-900 text-white p-1 rounded-l-lg z-50 shadow-xl"
                    >
                        <HiMenu className="w-5 h-5" />
                    </button>
                )}

                {/* Create Discussion Modal */}
                <CreateDiscussionModal
                    isOpen={showCreateModal}
                    onClose={() => setShowCreateModal(false)}
                    onSubmit={handleCreateDiscussion}
                    loading={creatingDiscussion}
                />
            </div>
        </div>
    );
}
