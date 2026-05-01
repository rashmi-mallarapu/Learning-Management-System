import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchMyQuizAttempts, fetchQuizById } from '../../services/learnerApi';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';

const normalizeQuestion = (question, index) => ({
    id: String(question?._id || `q-${index}`),
    text: question?.question || '',
    options: Array.isArray(question?.options) ? question.options.map((option) => String(option || '')) : [],
    type: question?.type || 'multiple_choice',
});

export default function QuizResults() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [quiz, setQuiz] = useState(null);
    const [attempts, setAttempts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        Promise.all([
            fetchQuizById(id),
            fetchMyQuizAttempts(id).catch(() => []),
        ])
            .then(([quizData, attemptsData]) => {
                if (!mounted) return;

                const normalizedQuiz = {
                    ...quizData,
                    id: String(quizData?._id || id),
                    title: quizData?.title || 'Quiz',
                    questions: Array.isArray(quizData?.questions) ? quizData.questions.map(normalizeQuestion) : [],
                    maxAttempts: Number(quizData?.maxAttempts) > 0 ? Number(quizData.maxAttempts) : 3,
                    attemptsUsed: Number(quizData?.attemptsUsed) || 0,
                };

                setQuiz(normalizedQuiz);
                setAttempts(Array.isArray(attemptsData) ? attemptsData : []);
            })
            .finally(() => {
                if (mounted) setLoading(false);
            });

        return () => {
            mounted = false;
        };
    }, [id]);

    const latestAttempt = attempts[0] || null;

    const answerPairs = useMemo(() => {
        if (!latestAttempt || !quiz?.questions?.length) return [];

        return quiz.questions.map((question, index) => ({
            question,
            selectedAnswer: Array.isArray(latestAttempt.answers) ? latestAttempt.answers[index] : '',
        }));
    }, [latestAttempt, quiz]);

    if (loading) {
        return <div className="p-10 font-bold text-slate-500">Loading results...</div>;
    }

    if (!quiz) {
        return (
            <div className="p-10 text-center space-y-4">
                <p className="font-bold text-rose-500">Quiz not found</p>
                <Button variant="outline" onClick={() => navigate('/learner/quizzes')}>Back to Quizzes</Button>
            </div>
        );
    }

    if (!latestAttempt) {
        return (
            <div className="min-h-screen bg-slate-50 p-6 md:p-12">
                <div className="max-w-3xl mx-auto bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-4">
                    <h2 className="text-2xl font-black text-slate-800">No submission found yet</h2>
                    <p className="text-slate-500">Attempt this quiz to see your submission status and review details.</p>
                    <div className="flex justify-center gap-3">
                        <Button onClick={() => navigate(`/learner/quiz/${id}/attempt`)}>Attempt Quiz</Button>
                        <Button variant="outline" onClick={() => navigate('/learner/quizzes')}>Back to Quizzes</Button>
                    </div>
                </div>
            </div>
        );
    }

    const isReviewed = latestAttempt.status === 'reviewed' || Boolean(latestAttempt.reviewedAt);
    const canRetry = (quiz.maxAttempts - (quiz.attemptsUsed || 0)) > 0;

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-12">
            <div className="max-w-5xl mx-auto space-y-6">
                <div className="bg-white rounded-2xl p-6 border border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800">{quiz.title}</h1>
                        <p className="text-sm text-slate-500 mt-1">Latest attempt status</p>
                    </div>
                    {isReviewed ? (
                        <Badge color={latestAttempt.passed ? 'green' : 'red'}>
                            {latestAttempt.passed ? 'Reviewed · Passed' : 'Reviewed · Needs Improvement'}
                        </Badge>
                    ) : (
                        <Badge color="amber">Pending Instructor Review</Badge>
                    )}
                </div>

                {!isReviewed ? (
                    <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-4">
                        <h2 className="text-xl font-black text-slate-800">Submitted successfully</h2>
                        <p className="text-slate-500">Your quiz has been submitted and is waiting for instructor review. Immediate grading is disabled.</p>
                        <div className="flex justify-center gap-3 pt-2">
                            <Button variant="outline" onClick={() => navigate('/learner/quizzes')}>Back to Quizzes</Button>
                            <Button disabled={!canRetry} onClick={() => navigate(`/learner/quiz/${id}/attempt`)}>
                                {canRetry ? 'Retry Attempt' : 'Attempts Exhausted'}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="bg-white rounded-2xl p-6 border border-slate-200">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="p-4 rounded-xl bg-slate-50">
                                    <p className="text-xs font-bold text-slate-500 uppercase">Score</p>
                                    <p className="text-2xl font-black text-slate-800 mt-1">{latestAttempt.percentage ?? 0}%</p>
                                </div>
                                <div className="p-4 rounded-xl bg-slate-50">
                                    <p className="text-xs font-bold text-slate-500 uppercase">Points</p>
                                    <p className="text-2xl font-black text-slate-800 mt-1">{latestAttempt.score ?? 0} / {latestAttempt.total ?? 0}</p>
                                </div>
                                <div className="p-4 rounded-xl bg-slate-50">
                                    <p className="text-xs font-bold text-slate-500 uppercase">Reviewed At</p>
                                    <p className="text-sm font-bold text-slate-700 mt-2">{latestAttempt.reviewedAt ? new Date(latestAttempt.reviewedAt).toLocaleString() : '—'}</p>
                                </div>
                                <div className="p-4 rounded-xl bg-slate-50">
                                    <p className="text-xs font-bold text-slate-500 uppercase">Feedback</p>
                                    <p className="text-sm font-bold text-slate-700 mt-2">{latestAttempt.feedback || 'No feedback provided'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl p-6 border border-slate-200 space-y-6">
                            <h3 className="text-lg font-black text-slate-800">Submitted Answers</h3>
                            {answerPairs.map(({ question, selectedAnswer }, index) => (
                                <div key={question.id} className="border border-slate-100 rounded-xl p-4">
                                    <p className="font-bold text-slate-800">Q{index + 1}. {question.text}</p>
                                    <p className="text-sm text-slate-500 mt-2">Your answer:</p>
                                    <p className="text-sm font-semibold text-slate-700 mt-1 break-words">{selectedAnswer || 'No answer submitted'}</p>
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-3 justify-end">
                            <Button variant="outline" onClick={() => navigate('/learner/quizzes')}>Back to Quizzes</Button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
