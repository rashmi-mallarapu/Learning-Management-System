import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, BarChart2, Trash2, Clock, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import SearchBar from '../../components/ui/SearchBar';
import { fetchInstructorQuizzes, fetchInstructorCourses } from '../../services/instructorApi';

export default function InstructorQuizzesPage() {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [quizzes, setQuizzes] = useState([]);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [creating] = useState(false);

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

    useEffect(() => {
        const timerId = setTimeout(() => {
            loadData();
        }, 0);

        return () => clearTimeout(timerId);
    }, []);

    const handleCreateQuiz = () => {
        navigate('/instructor/quiz/create');
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
                <div className="bg-white border border-primary-200 rounded-xl p-6 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-slate-800">Quick Quiz Creation</h2>
                        <button
                            onClick={() => setShowForm(false)}
                            className="text-slate-400 hover:text-slate-600"
                        >
                            ✕
                        </button>
                    </div>

                    <form onSubmit={(e) => { e.preventDefault(); handleCreateQuiz(); }} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">
                                    Quiz Title <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    disabled
                                    value="Use full quiz builder"
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-400"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">
                                    Course <span className="text-rose-500">*</span>
                                </label>
                                <select
                                    disabled
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-400"
                                >
                                    <option value="">Select a course</option>
                                    {courses.map(c => (
                                        <option key={c._id} value={c._id}>{c.title}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">
                                    Time Limit (minutes)
                                </label>
                                <input
                                    type="number"
                                    disabled
                                    value={30}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-400"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">
                                    Passing Score (%)
                                </label>
                                <input
                                    type="number"
                                    disabled
                                    value={70}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-400"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 justify-end pt-4 border-t border-slate-200">
                            <Button
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
                                Open Full Quiz Builder
                            </Button>
                        </div>
                    </form>
                </div>
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
                        <div
                            key={quiz.id}
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
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
