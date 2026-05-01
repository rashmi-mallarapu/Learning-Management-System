import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { HiOutlineClock, HiMenu, HiChevronLeft, HiChevronRight, HiFlag, HiX, HiOutlineFlag } from 'react-icons/hi';
import { fetchQuizById, submitQuiz } from '../../services/learnerApi';
import { startAttempt, setAnswer, toggleFlag } from '../../features/quiz/quizSlice';
import { useTimer } from '../../hooks/useTimer';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import QuestionCard from '../../components/quiz/QuestionCard';
import QuizProgressBar from '../../components/quiz/QuizProgressBar';
import clsx from 'clsx';

export default function QuizAttempt() {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const normalizeQuestion = (question, index) => {
        const typeMap = {
            multiple_choice: 'mcq',
            true_false: 'true_false',
            descriptive: 'short_answer',
            survey: Array.isArray(question.options) && question.options.length > 0 ? 'mcq' : 'short_answer',
        };

        const normalizedType = typeMap[question.type] || 'mcq';
        const normalizedOptions = Array.isArray(question.options)
            ? question.options.map((option, optionIndex) => ({
                id: `${index}-opt-${optionIndex}`,
                text: String(option || ''),
            }))
            : [];

        return {
            id: String(question._id || `q-${index}`),
            text: question.question || '',
            type: normalizedType,
            options: normalizedType === 'mcq' ? normalizedOptions : [],
            correctOption: null,
            points: Number(question.points) || 1,
            explanation: question.explanation || '',
            difficulty: 'medium',
            isSurvey: question.type === 'survey',
        };
    };

    const [quiz, setQuiz] = useState(null);
    const [quizLoading, setQuizLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [hasStarted, setHasStarted] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [submitModalOpen, setSubmitModalOpen] = useState(false);
    const [timeUpPulse, setTimeUpPulse] = useState(false);
    const [forceSubmitting, setForceSubmitting] = useState(false);

    useEffect(() => {
        setQuizLoading(true);
        fetchQuizById(id)
            .then(data => {
                const normalizedQuiz = {
                    ...data,
                    id: String(data?._id || id),
                    timeLimit: Number(data?.timeLimit) > 0 ? Number(data.timeLimit) : 30,
                    maxAttempts: Number(data?.maxAttempts) > 0 ? Number(data.maxAttempts) : 3,
                    attemptsUsed: Number(data?.attemptsUsed) || 0,
                    questions: Array.isArray(data?.questions) ? data.questions.map(normalizeQuestion) : [],
                    course: data?.courseId?.title || 'Course',
                };
                setQuiz(normalizedQuiz);
                setLoadError('');
            })
            .catch((error) => {
                setQuiz(null);
                setLoadError(error.message || 'Quiz not found');
            })
            .finally(() => setQuizLoading(false));
    }, [id]);

    const timeLimitMinutes = Number(quiz?.timeLimit) > 0 ? Number(quiz.timeLimit) : 30;

    const { currentAttempt } = useSelector(s => s.quiz);
    const attemptRef = useRef(currentAttempt);
    const quizRef = useRef(quiz);
    const secondsRef = useRef(timeLimitMinutes * 60);

    const mapAnswerForSubmission = useCallback((question, selected) => {
        if (selected == null || selected === '') {
            return '';
        }

        if (question.type === 'mcq') {
            const matchedOption = (question.options || []).find((option) => option.id === selected);
            return matchedOption?.text || '';
        }

        if (question.type === 'true_false') {
            return selected === 'true' ? 'True' : selected === 'false' ? 'False' : String(selected);
        }

        return String(selected);
    }, []);

    const buildAnswerArray = useCallback((quizData, answersMap) => {
        return (quizData?.questions || []).map((question) =>
            mapAnswerForSubmission(question, answersMap?.[question.id])
        );
    }, [mapAnswerForSubmission]);

    const handleAutoSubmit = useCallback(async () => {
        setForceSubmitting(true);
        try {
            const latestQuiz = quizRef.current;
            const answersMap = attemptRef.current?.answers || {};
            const answerArray = buildAnswerArray(latestQuiz, answersMap);
            const totalSeconds = (Number(latestQuiz?.timeLimit) > 0 ? Number(latestQuiz.timeLimit) : 30) * 60;
            const timeTaken = Math.max(0, totalSeconds - secondsRef.current);
            await submitQuiz(id, { answers: answerArray, timeTaken });
        } finally {
            navigate(`/learner/quiz/${id}/results`);
        }
    }, [buildAnswerArray, id, navigate]);

    const { seconds, resume, isRunning, reset } = useTimer(id, timeLimitMinutes * 60, handleAutoSubmit);

    useEffect(() => {
        attemptRef.current = currentAttempt;
    }, [currentAttempt]);

    useEffect(() => {
        quizRef.current = quiz;
    }, [quiz]);

    useEffect(() => {
        secondsRef.current = seconds;
    }, [seconds]);

    useEffect(() => {
        if (quiz && !hasStarted) {
            reset();
        }
    }, [quiz, hasStarted, reset]);

    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (hasStarted && !forceSubmitting) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [hasStarted, forceSubmitting]);

    useEffect(() => {
        if (isRunning && seconds < 60) setTimeUpPulse(true);
    }, [seconds, isRunning]);

    if (quizLoading) return <div className="p-10 text-center font-semibold text-slate-500">Loading quiz...</div>;
    if (!quiz) {
        return (
            <div className="p-10 max-w-xl mx-auto text-center space-y-4">
                <p className="text-lg font-bold text-slate-700">{loadError || 'Quiz not found'}</p>
                <Button variant="outline" onClick={() => navigate('/learner/quizzes')}>Back to Quizzes</Button>
            </div>
        );
    }

    const handleStart = () => {
        dispatch(startAttempt(quiz));
        setHasStarted(true);
        resume();
    };

    const handleManualSubmit = async () => {
        setForceSubmitting(true);
        try {
            const answersMap = currentAttempt?.answers || {};
            const answerArray = buildAnswerArray(quiz, answersMap);
            const totalSeconds = timeLimitMinutes * 60;
            const timeTaken = Math.max(0, totalSeconds - seconds);
            await submitQuiz(id, { answers: answerArray, timeTaken });
        } finally {
            navigate(`/learner/quiz/${id}/results`);
        }
    };

    if (forceSubmitting) {
        return (
            <div className="fixed inset-0 bg-slate-900/90 z-50 flex items-center justify-center backdrop-blur-sm">
                <div className="bg-white p-8 rounded-2xl flex flex-col items-center animate-in zoom-in">
                    <div className="w-16 h-16 border-4 border-slate-100 border-t-primary-500 rounded-full animate-spin mb-6" />
                    <h2 className="text-2xl font-black text-slate-800">Time's Up!</h2>
                    <p className="text-slate-500 font-medium">Submitting your answers...</p>
                </div>
            </div>
        );
    }

    if (!hasStarted) {
        return (
            <div className="fixed inset-0 bg-slate-50 z-50 flex items-center justify-center p-6">
                <div className="bg-white max-w-md w-full p-8 rounded-3xl shadow-xl border border-slate-100">
                    <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <HiOutlineClock className="w-8 h-8 text-primary-600" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-800 text-center mb-2">{quiz.title}</h2>
                    <p className="text-slate-500 text-center text-sm mb-8">You are about to start this assessment. Once started, the timer cannot be paused.</p>

                    <div className="space-y-3 mb-8">
                        <div className="flex justify-between p-3 bg-slate-50 rounded-xl font-bold">
                            <span className="text-slate-500">Time Limit</span>
                            <span className="text-slate-800">{timeLimitMinutes} Minutes</span>
                        </div>
                        <div className="flex justify-between p-3 bg-slate-50 rounded-xl font-bold">
                            <span className="text-slate-500">Questions</span>
                            <span className="text-slate-800">{quiz.questions.length} Items</span>
                        </div>
                        <div className="flex justify-between p-3 bg-slate-50 rounded-xl font-bold">
                            <span className="text-slate-500">Attempts</span>
                            <span className="text-slate-800">Attempt {quiz.attemptsUsed + 1} of {quiz.maxAttempts}</span>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <Button variant="outline" fullWidth onClick={() => navigate('/learner/quizzes')}>Cancel</Button>
                        <Button 
                            fullWidth 
                            disabled={quiz.attemptsUsed >= quiz.maxAttempts}
                            onClick={handleStart}
                            variant={quiz.attemptsUsed >= quiz.maxAttempts ? "gray" : "primary"}
                        >
                            {quiz.attemptsUsed >= quiz.maxAttempts ? 'Attempts Exhausted' : 'Start Now'}
                        </Button>
                    </div>
                    {quiz.attemptsUsed >= quiz.maxAttempts && (
                        <p className="text-center text-[10px] text-rose-500 font-bold uppercase tracking-widest mt-4">
                             You have no attempts remaining for this quiz.
                        </p>
                    )}
                </div>
            </div>
        );
    }

    const currentQ = quiz.questions[currentIndex];
    // Ensure we do not crash if questions array is empty (e.g. mock data missing questions)
    if (!currentQ) return <div className="p-10">No questions configured.</div>

    const answers = currentAttempt?.answers || {};
    const flagged = currentAttempt?.flagged || [];
    const answeredCount = Object.keys(answers).length;
    const isFlagged = flagged.includes(currentQ?.id);

    const formatTime = () => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const timerColor = seconds < 60 ? 'text-red-500' : seconds < 300 ? 'text-amber-500' : 'text-emerald-500';

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <header className="sticky top-0 bg-white border-b border-slate-200 z-30 shadow-sm">
                <QuizProgressBar total={quiz.questions.length} answered={answeredCount} flagged={flagged.length} />
                <div className="flex items-center justify-between px-6 h-16">
                    <div className="flex items-center gap-4 flex-1">
                        <button onClick={() => navigate('/learner/quizzes')} className="text-slate-400 hover:text-slate-600 transition-colors">
                            <HiX className="w-6 h-6" />
                        </button>
                        <div className="hidden md:block">
                            <h1 className="font-bold text-slate-800 leading-tight">{quiz.title}</h1>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{quiz.course}</p>
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col items-center">
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Question {currentIndex + 1} of {quiz.questions.length}</span>
                        <div className="flex gap-1.5">
                            {quiz.questions.map((q, i) => (
                                <div key={q.id} className={clsx(
                                    "w-2 h-2 rounded-full transition-colors",
                                    i === currentIndex ? "bg-primary-500 ring-2 ring-primary-200" :
                                        flagged.includes(q.id) ? "bg-amber-400" :
                                            answers[q.id] ? "bg-blue-200" : "bg-slate-200"
                                )} />
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 flex justify-end items-center gap-6">
                        <div className={clsx("flex items-center gap-2 font-mono font-bold text-lg", timerColor, timeUpPulse && "animate-pulse")}>
                            <HiOutlineClock className="w-5 h-5 flex-shrink-0" />
                            {formatTime()}
                        </div>
                        <button onClick={() => setDrawerOpen(!drawerOpen)} className="p-2 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors relative">
                            <HiMenu className="w-5 h-5" />
                            {flagged.length > 0 && <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 border-2 border-white rounded-full" />}
                        </button>
                    </div>
                </div>
            </header>

            <main className="flex-1 flex w-full relative">
                <div className={clsx("flex-1 p-6 md:p-12 overflow-y-auto transition-all duration-300", drawerOpen && "md:mr-80")}>
                    <div className="max-w-3xl mx-auto space-y-6">
                        <div className="flex justify-between items-center bg-white p-2 rounded-xl shadow-sm border border-slate-100">
                            <div className="flex items-center gap-3 px-3">
                                <span className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-black text-slate-600">{currentIndex + 1}</span>
                                <Badge color={currentQ.difficulty === 'easy' ? 'green' : currentQ.difficulty === 'hard' ? 'red' : 'amber'}>{currentQ.difficulty}</Badge>
                                <Badge color="gray">{currentQ.points} pts</Badge>
                            </div>
                            <Button
                                variant="ghost"
                                onClick={() => dispatch(toggleFlag(currentQ.id))}
                                className={clsx(isFlagged ? "text-amber-500 bg-amber-50" : "text-slate-400")}
                                icon={isFlagged ? <HiFlag /> : <HiOutlineFlag />}
                            >
                                {isFlagged ? "Flagged" : "Flag"}
                            </Button>
                        </div>

                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 slide-in-from-right-4 animate-in">
                            <QuestionCard
                                question={currentQ}
                                mode="attempt"
                                selectedAnswer={answers[currentQ.id]}
                                onAnswer={(ans) => dispatch(setAnswer({ questionId: currentQ.id, answer: ans }))}
                            />
                        </div>
                    </div>
                </div>

                {/* Drawer */}
                <div className={clsx(
                    "fixed right-0 top-16 bottom-[72px] bg-white border-l border-slate-200 w-80 shadow-2xl transition-transform duration-300 flex flex-col z-20",
                    drawerOpen ? "translate-x-0" : "translate-x-full"
                )}>
                    <div className="p-4 border-b border-slate-100">
                        <h3 className="font-bold text-slate-800">Question Navigator</h3>
                        <p className="text-xs text-slate-500 mt-1">{answeredCount} answered · {flagged.length} flagged · {quiz.questions.length - answeredCount} unanswered</p>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 grid grid-cols-4 gap-2 content-start">
                        {quiz.questions.map((q, i) => (
                            <button
                                key={q.id}
                                onClick={() => setCurrentIndex(i)}
                                className={clsx(
                                    "aspect-square rounded-xl flex items-center justify-center font-bold text-sm transition-all border-2",
                                    i === currentIndex ? "border-primary-500 text-primary-600 bg-primary-50" :
                                        flagged.includes(q.id) ? "border-amber-200 bg-amber-50 text-amber-700" :
                                            answers[q.id] ? "border-blue-100 bg-blue-50 text-blue-700" : "border-slate-100 bg-white text-slate-500 hover:border-slate-300"
                                )}
                            >
                                {i + 1}
                            </button>
                        ))}
                    </div>
                    <div className="p-4 border-t border-slate-100">
                        <Button fullWidth variant="danger" onClick={() => setSubmitModalOpen(true)}>Submit Quiz</Button>
                    </div>
                </div>
            </main>

            <footer className="h-[72px] bg-white border-t border-slate-200 px-6 flex items-center justify-between sticky bottom-0 z-30">
                <Button
                    variant="outline"
                    disabled={currentIndex === 0}
                    onClick={() => setCurrentIndex(c => c - 1)}
                    icon={<HiChevronLeft />}
                >
                    Previous
                </Button>

                {currentIndex === quiz.questions.length - 1 ? (
                    <Button onClick={() => setSubmitModalOpen(true)}>Submit Quiz</Button>
                ) : (
                    <Button onClick={() => setCurrentIndex(c => c + 1)} iconRight={<HiChevronRight />}>Save & Continue</Button>
                )}
            </footer>

            {submitModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white max-w-md w-full rounded-2xl p-6 shadow-xl animate-in zoom-in-95">
                        <h3 className="text-xl font-bold text-slate-800 mb-2">Submit Quiz?</h3>
                        {quiz.questions.length > answeredCount ? (
                            <div className="p-3 bg-amber-50 text-amber-800 rounded-lg text-sm font-medium mb-6">
                                Warning: {quiz.questions.length - answeredCount} questions are unanswered.
                            </div>
                        ) : (
                            <p className="text-slate-600 mb-6 font-medium">You have answered all questions. Ready to submit?</p>
                        )}

                        <div className="flex gap-3 justify-end mt-4">
                            <Button variant="ghost" onClick={() => setSubmitModalOpen(false)}>Go Back</Button>
                            <Button variant="primary" onClick={handleManualSubmit}>Submit Anyway</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
