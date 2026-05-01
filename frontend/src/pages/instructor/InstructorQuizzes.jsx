import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, BarChart2, Trash2, Clock, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import SearchBar from '../../components/ui/SearchBar';
import { fetchInstructorQuizzes, fetchInstructorCourses, createQuiz } from '../../services/instructorApi';

const createQuestion = () => ({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type: 'multiple_choice',
    question: '',
    options: ['', ''],
    correctAnswer: '',
    points: 1,
    explanation: '',
});

export default function InstructorQuizzes() {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [quizzes, setQuizzes] = useState([]);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [creating, setCreating] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        courseId: '',
        timeLimit: 30,
        passingScore: 70,
        questions: [createQuestion()],
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [quizData, courseData] = await Promise.all([
                fetchInstructorQuizzes(),
                fetchInstructorCourses(),
            ]);

            if (Array.isArray(quizData)) {
                setQuizzes(quizData.map(q => ({
                    id: q._id || q.id,
                    title: q.title,
                    course: q.courseId?.title || 'Unknown Course',
                    courseId: q.courseId?._id || q.courseId,
                    questions: q.questions || [],
                    timeLimit: q.timeLimit || 30,
                    passingScore: q.passingScore || 70,
                    createdAt: q.createdAt,
                })));
            }

            if (Array.isArray(courseData)) {
                setCourses(courseData);
            }
        } catch (err) {
            toast.error(err?.message || 'Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateQuiz = async (e) => {
        e.preventDefault();

        if (!formData.title.trim() || !formData.courseId) {
            toast.error('Please fill in all required fields');
            return;
        }

        if (!Array.isArray(formData.questions) || formData.questions.length === 0) {
            toast.error('Add at least one question');
            return;
        }

        const normalizedQuestions = formData.questions.map((question, index) => {
            const type = question.type || 'multiple_choice';
            const options = type === 'descriptive' || type === 'survey'
                ? []
                : (question.options || []).map((option) => String(option || '').trim()).filter(Boolean);

            return {
                type,
                question: String(question.question || '').trim(),
                options: type === 'descriptive' || type === 'survey' ? [] : options,
                correctAnswer: type === 'survey' ? '' : String(question.correctAnswer || '').trim(),
                points: Number(question.points) > 0 ? Number(question.points) : 1,
                explanation: String(question.explanation || '').trim(),
                order: index + 1,
            };
        }).filter((question) => question.question && (question.type === 'survey' || question.correctAnswer));

        if (normalizedQuestions.length === 0) {
            toast.error('Each question needs text. Non-survey questions also need a correct answer.');
            return;
        }

        setCreating(true);
        try {
            const payload = {
                title: formData.title,
                courseId: formData.courseId,
                timeLimit: parseInt(formData.timeLimit),
                passingScore: parseInt(formData.passingScore),
                questions: normalizedQuestions,
            };

            await createQuiz(payload);
            
            toast.success('Quiz created successfully! Enrolled learners have been notified.');
            
            setFormData({ title: '', courseId: '', timeLimit: 30, passingScore: 70, questions: [createQuestion()] });
            setShowForm(false);
            await loadData();
        } catch (err) {
            toast.error(err?.message || 'Failed to create quiz');
        } finally {
            setCreating(false);
        }
    };

    const updateQuestion = (questionId, updates) => {
        setFormData((prev) => ({
            ...prev,
            questions: prev.questions.map((question) =>
                question.id === questionId ? { ...question, ...updates } : question
            ),
        }));
    };

    const addQuestion = () => {
        setFormData((prev) => ({
            ...prev,
            questions: [...prev.questions, createQuestion()],
        }));
    };

    const removeQuestion = (questionId) => {
        setFormData((prev) => ({
            ...prev,
            questions: prev.questions.length > 1
                ? prev.questions.filter((question) => question.id !== questionId)
                : prev.questions,
        }));
    };

    const filteredQuizzes = quizzes.filter(q => 
        q.title.toLowerCase().includes(search.toLowerCase()) ||
        q.course.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 bg-slate-50 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800">Quizzes</h1>
                    <p className="text-slate-500 font-medium mt-1">Create and manage quizzes for your courses. All enrolled learners will be notified instantly.</p>
                </div>
                <Button
                    onClick={() => setShowForm(!showForm)}
                    icon={<Plus className="w-5 h-5" />}
                    className="bg-primary-600 hover:bg-primary-700 text-white"
                >
                    Create New Quiz
                </Button>
            </div>

            {/* Quiz Creation Form */}
            {showForm && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="bg-white border border-primary-200 rounded-xl p-6 space-y-6"
                >
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-slate-800">Create Quiz</h2>
                        <button
                            onClick={() => setShowForm(false)}
                            className="text-slate-400 hover:text-slate-600 text-xl"
                        >
                            ✕
                        </button>
                    </div>

                    <form onSubmit={handleCreateQuiz} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">
                                    Quiz Title <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="e.g. Module 1 Assessment"
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">
                                    Course <span className="text-rose-500">*</span>
                                </label>
                                <select
                                    value={formData.courseId}
                                    onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white"
                                >
                                    <option value="">Select a course</option>
                                    {courses.map((c) => (
                                        <option key={c._id || c.id} value={c._id || c.id}>{c.title}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">
                                    Time Limit (minutes)
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={formData.timeLimit}
                                    onChange={(e) => setFormData({ ...formData, timeLimit: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">
                                    Passing Score (%)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={formData.passingScore}
                                    onChange={(e) => setFormData({ ...formData, passingScore: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                                />
                            </div>
                        </div>

                        <div className="space-y-4 border-t border-slate-200 pt-6">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <h3 className="text-base font-bold text-slate-800">Questions</h3>
                                    <p className="text-sm text-slate-500">Add multiple choice, true/false, descriptive, or survey questions.</p>
                                </div>
                                <Button type="button" variant="outline" onClick={addQuestion}>Add Question</Button>
                            </div>

                            <div className="space-y-4">
                                {formData.questions.map((question, index) => (
                                    <div key={question.id} className="rounded-xl border border-slate-200 p-4 bg-slate-50 space-y-4">
                                        <div className="flex items-center justify-between gap-3">
                                            <h4 className="font-bold text-slate-800">Question {index + 1}</h4>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                disabled={formData.questions.length === 1}
                                                onClick={() => removeQuestion(question.id)}
                                            >
                                                Remove
                                            </Button>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-600 mb-2">Question Type</label>
                                                <select
                                                    value={question.type}
                                                    onChange={(e) => {
                                                        const nextType = e.target.value;
                                                        const nextUpdates = { type: nextType };
                                                        if (nextType === 'true_false') {
                                                            nextUpdates.options = ['True', 'False'];
                                                            nextUpdates.correctAnswer = '';
                                                        } else if (nextType === 'descriptive' || nextType === 'survey') {
                                                            nextUpdates.options = [];
                                                            nextUpdates.correctAnswer = '';
                                                        } else {
                                                            nextUpdates.options = question.options?.length >= 2 ? question.options : ['', ''];
                                                            nextUpdates.correctAnswer = '';
                                                        }
                                                        updateQuestion(question.id, nextUpdates);
                                                    }}
                                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-white"
                                                >
                                                    <option value="multiple_choice">Multiple Choice</option>
                                                    <option value="true_false">True / False</option>
                                                    <option value="descriptive">Descriptive / Short Answer</option>
                                                    <option value="survey">Survey (No Correct Answer)</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold text-slate-600 mb-2">Points</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={question.points}
                                                    onChange={(e) => updateQuestion(question.id, { points: e.target.value })}
                                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-white"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 mb-2">Question Text</label>
                                            <textarea
                                                rows={2}
                                                value={question.question}
                                                onChange={(e) => updateQuestion(question.id, { question: e.target.value })}
                                                placeholder="Type the question here"
                                                className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-white resize-none"
                                            />
                                        </div>

                                        {question.type !== 'descriptive' && question.type !== 'survey' && (
                                            <div className="space-y-3">
                                                <label className="block text-xs font-bold text-slate-600">Options</label>
                                                <div className="grid gap-2">
                                                    {question.options?.map((option, optionIndex) => (
                                                        <input
                                                            key={`${question.id}-opt-${optionIndex}`}
                                                            type="text"
                                                            value={option}
                                                            onChange={(e) => {
                                                                const nextOptions = [...(question.options || [])];
                                                                nextOptions[optionIndex] = e.target.value;
                                                                updateQuestion(question.id, { options: nextOptions });
                                                            }}
                                                            placeholder={`Option ${optionIndex + 1}`}
                                                            className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-white"
                                                        />
                                                    ))}
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() => updateQuestion(question.id, { options: [...(question.options || []), ''] })}
                                                >
                                                    Add Option
                                                </Button>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {question.type !== 'survey' && (
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-600 mb-2">Correct Answer</label>
                                                    <input
                                                        type="text"
                                                        value={question.correctAnswer}
                                                        onChange={(e) => updateQuestion(question.id, { correctAnswer: e.target.value })}
                                                        placeholder={question.type === 'descriptive' ? 'Expected answer' : 'Correct option text'}
                                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-white"
                                                    />
                                                </div>
                                            )}
                                            <div>
                                                <label className="block text-xs font-bold text-slate-600 mb-2">Explanation / Extra</label>
                                                <input
                                                    type="text"
                                                    value={question.explanation}
                                                    onChange={(e) => updateQuestion(question.id, { explanation: e.target.value })}
                                                    placeholder="Optional explanation or notes"
                                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-white"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-3 justify-end pt-4 border-t border-slate-200">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowForm(false)}
                                disabled={creating}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={creating}
                                className="bg-primary-600 hover:bg-primary-700 text-white"
                            >
                                {creating ? 'Creating...' : 'Create & Notify Students'}
                            </Button>
                        </div>
                    </form>
                </motion.div>
            )}

            {/* Search */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                <SearchBar
                    value={search}
                    onChange={setSearch}
                    placeholder="Search quizzes by title or course..."
                    className="w-full max-w-md"
                />
            </div>

            {/* Quizzes List */}
            {loading ? (
                <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
                    <p className="text-slate-500 font-medium">Loading quizzes...</p>
                </div>
            ) : filteredQuizzes.length === 0 ? (
                <div className="bg-white border border-dashed border-slate-300 rounded-xl p-20 text-center">
                    <h3 className="font-bold text-slate-800 mb-2">No quizzes yet</h3>
                    <p className="text-sm text-slate-500">Create your first quiz to get started. All enrolled learners will be notified instantly.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredQuizzes.map(quiz => (
                        <motion.div
                            key={quiz.id}
                            layout
                            className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all hover:border-primary-300"
                        >
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-slate-800 mb-1">{quiz.title}</h3>
                                    <p className="text-sm text-slate-600 mb-3">{quiz.course}</p>
                                    <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                                        <span className="flex items-center gap-1">
                                            <FileText className="w-4 h-4" /> {quiz.questions.length} questions
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-4 h-4" /> {quiz.timeLimit} min
                                        </span>
                                        <span>Pass: {quiz.passingScore}%</span>
                                    </div>
                                </div>
                                <div className="flex gap-2 self-end md:self-auto">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        icon={<BarChart2 className="w-4 h-4" />}
                                        onClick={() => navigate(`/instructor/quiz/${quiz.id}/analytics`)}
                                    >
                                        Analytics
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        icon={<Pencil className="w-4 h-4" />}
                                        onClick={() => navigate(`/instructor/quiz/${quiz.id}/edit`)}
                                    >
                                        Edit
                                    </Button>
                                    <button className="p-2 text-rose-400 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors">
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
