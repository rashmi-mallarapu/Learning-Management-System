import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { HiPlus, HiTrash, HiChevronLeft, HiEye, HiCog, HiOutlineDocumentText, HiMenu, HiCheck } from 'react-icons/hi';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import QuestionCard from '../../components/quiz/QuestionCard';
import clsx from 'clsx';
import { createQuiz, fetchInstructorCourses } from '../../services/instructorApi';

const generateId = () => Math.random().toString(36).substr(2, 9);

export default function QuizBuilder() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [courses, setCourses] = useState([]);
    const [saving, setSaving] = useState(false);

    const [activeTab, setActiveTab] = useState('questions'); // 'questions' | 'settings'
    const [previewMode, setPreviewMode] = useState(false);
    const [activeQuestionId, setActiveQuestionId] = useState(null);

    const [quizSettings, setQuizSettings] = useState({
        title: 'Untitled Quiz',
        course: '',
        instructions: '',
        timed: true,
        timeLimit: 30,
        passMark: 70,
        limitedAttempts: true,
        maxAttempts: 3,
        shuffleQuestions: false,
        shuffleOptions: false,
        showResults: 'immediately'
    });

    const [questions, setQuestions] = useState([
        {
            id: generateId(),
            type: 'mcq',
            text: 'What is the primary purpose of React?',
            points: 10,
            difficulty: 'easy',
            options: [
                { id: generateId(), text: 'Server-side routing' },
                { id: generateId(), text: 'Building user interfaces' },
                { id: generateId(), text: 'Database management' },
                { id: generateId(), text: 'Operating system development' }
            ],
            correctOption: null, // Should match an option id
            explanation: '',
            sampleAnswer: ''
        }
    ]);

    useEffect(() => {
        if (questions.length > 0 && !activeQuestionId) {
            setActiveQuestionId(questions[0].id);
        }
    }, [questions, activeQuestionId]);

    useEffect(() => {
        let mounted = true;
        fetchInstructorCourses()
            .then((data) => {
                if (!mounted) return;
                setCourses(Array.isArray(data) ? data : []);
            })
            .catch(() => {
                if (mounted) setCourses([]);
            });

        return () => {
            mounted = false;
        };
    }, []);

    const activeQuestion = questions.find(q => q.id === activeQuestionId);

    const updateActiveQuestion = (updates) => {
        setQuestions(qs => qs.map(q => q.id === activeQuestionId ? { ...q, ...updates } : q));
    };

    const handleAddQuestion = () => {
        const newQ = {
            id: generateId(),
            type: 'mcq',
            text: '',
            points: 10,
            difficulty: 'medium',
            options: [
                { id: generateId(), text: '' },
                { id: generateId(), text: '' }
            ],
            correctOption: null,
            explanation: '',
            sampleAnswer: ''
        };
        setQuestions([...questions, newQ]);
        setActiveQuestionId(newQ.id);
    };

    const handleDeleteQuestion = (qId) => {
        const filtered = questions.filter(q => q.id !== qId);
        setQuestions(filtered);
        if (activeQuestionId === qId) {
            setActiveQuestionId(filtered[0]?.id || null);
        }
    };

    const handleTypeChange = (newType) => {
        if (!window.confirm("Switching question types will clear existing options. Continue?")) return;

        const defaults = {
            mcq: { options: [{ id: generateId(), text: '' }, { id: generateId(), text: '' }], correctOption: null },
            true_false: { options: [], correctOption: null },
            short_answer: { options: [], correctOption: null, sampleAnswer: '' },
            survey: { options: [], correctOption: null, sampleAnswer: '' },
        };

        updateActiveQuestion({ type: newType, ...defaults[newType] });
    };

    const normalizeQuestionForApi = (question) => {
        const typeMap = {
            mcq: 'multiple_choice',
            true_false: 'true_false',
            short_answer: 'descriptive',
            survey: 'survey',
        };

        const mappedType = typeMap[question.type] || 'multiple_choice';
        const options = question.type === 'mcq'
            ? (question.options || []).map((option) => String(option.text || '').trim()).filter(Boolean)
            : question.type === 'true_false'
                ? ['True', 'False']
                : [];

        let correctAnswer = '';
        if (question.type === 'mcq') {
            const selected = (question.options || []).find((option) => option.id === question.correctOption);
            correctAnswer = String(selected?.text || '').trim();
        } else if (question.type === 'true_false') {
            correctAnswer = question.correctOption === 'true' ? 'True' : question.correctOption === 'false' ? 'False' : '';
        } else if (question.type === 'short_answer') {
            correctAnswer = String(question.sampleAnswer || '').trim();
        }

        return {
            type: mappedType,
            question: String(question.text || '').trim(),
            options,
            correctAnswer,
            points: Number(question.points) > 0 ? Number(question.points) : 1,
            explanation: String(question.explanation || '').trim(),
        };
    };

    const handlePublishQuiz = async () => {
        if (!quizSettings.title?.trim()) {
            toast.error('Quiz title is required');
            return;
        }

        if (!quizSettings.course) {
            toast.error('Please select a course');
            return;
        }

        const normalizedQuestions = questions
            .map(normalizeQuestionForApi)
            .filter((question) => question.question && (question.type === 'survey' || question.correctAnswer));

        if (normalizedQuestions.length === 0) {
            toast.error('Add at least one valid question before publishing');
            return;
        }

        setSaving(true);
        try {
            await createQuiz({
                courseId: quizSettings.course,
                title: quizSettings.title,
                timeLimit: quizSettings.timed ? Number(quizSettings.timeLimit) || 30 : 30,
                passingScore: Number(quizSettings.passMark) || 70,
                questions: normalizedQuestions,
            });

            toast.success('Quiz published successfully');
            navigate('/instructor/quizzes');
        } catch (error) {
            toast.error(error?.message || 'Failed to publish quiz');
        } finally {
            setSaving(false);
        }
    };

    // Drag and Drop
    const handleDragStart = (e, index) => { e.dataTransfer.setData('dragIndex', index); };
    const handleDragOver = (e) => e.preventDefault();
    const handleDrop = (e, dropIndex) => {
        const dragIndex = Number(e.dataTransfer.getData('dragIndex'));
        if (dragIndex === dropIndex) return;
        const newQs = [...questions];
        const [moved] = newQs.splice(dragIndex, 1);
        newQs.splice(dropIndex, 0, moved);
        setQuestions(newQs);
    };

    return (
        <div className="h-screen flex flex-col bg-slate-50 font-sans overflow-hidden">
            {/* Header */}
            <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 flex-shrink-0 z-30 shadow-sm relative">
                <div className="flex items-center gap-6">
                    <button onClick={() => navigate('/instructor/quizzes')} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <HiChevronLeft className="w-6 h-6" />
                    </button>
                    <div className="flex bg-slate-100 p-1 rounded-lg">
                        <button onClick={() => setActiveTab('questions')} className={clsx("px-4 py-1.5 text-sm font-bold rounded-md transition-colors", activeTab === 'questions' ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700")}>Questions</button>
                        <button onClick={() => setActiveTab('settings')} className={clsx("px-4 py-1.5 text-sm font-bold rounded-md transition-colors", activeTab === 'settings' ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700")}>Settings</button>
                    </div>
                </div>

                <div className="flex gap-3">
                    <Button variant="ghost" onClick={() => setPreviewMode(!previewMode)} icon={<HiEye />} className={previewMode ? "bg-blue-50 text-blue-600" : ""}>
                        {previewMode ? "Exit Preview" : "Preview"}
                    </Button>
                    <Button onClick={handlePublishQuiz} className="bg-primary-600" disabled={saving}>{saving ? 'Publishing...' : 'Publish Quiz'}</Button>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar List */}
                <aside className={clsx("h-full bg-white border-r border-slate-200 flex flex-col transition-all duration-300", previewMode ? "w-0 overflow-hidden border-0" : "w-80 md:w-96")}>
                    {activeTab === 'questions' ? (
                        <>
                            <div className="p-4 border-b border-slate-100 font-bold text-slate-800 flex justify-between items-center">
                                <span>Questions ({questions.length})</span>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-2 relative">
                                {questions.map((q, i) => (
                                    <div
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, i)}
                                        onDragOver={handleDragOver}
                                        onDrop={(e) => handleDrop(e, i)}
                                        key={q.id}
                                        onClick={() => setActiveQuestionId(q.id)}
                                        className={clsx(
                                            "flex items-center gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer group animate-in slide-in-from-top-2",
                                            activeQuestionId === q.id ? "border-primary-500 bg-primary-50" : "border-slate-100 bg-white hover:border-primary-200"
                                        )}
                                    >
                                        <div className="text-slate-300 cursor-grab active:cursor-grabbing hover:text-slate-500"><HiMenu /></div>
                                        <div className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-500 flex-shrink-0">{i + 1}</div>
                                        <div className="flex-1 truncate text-sm font-semibold text-slate-700">{q.text || "Empty Question"}</div>
                                        <div className="text-[10px] font-black text-slate-400">{q.points}p</div>
                                    </div>
                                ))}
                                <Button fullWidth variant="ghost" onClick={handleAddQuestion} icon={<HiPlus />} className="mt-4 border border-dashed border-slate-300">Add Question</Button>
                            </div>
                        </>
                    ) : (
                        <div className="p-6">
                            <h3 className="font-bold text-slate-800 mb-2">Quiz Navigator</h3>
                            <p className="text-sm text-slate-500">Configure global quiz settings in the main panel.</p>
                        </div>
                    )}
                </aside>

                {/* Main Content Pane */}
                <main className="flex-1 overflow-y-auto bg-slate-50/50 p-6 md:p-12">
                    <div className="max-w-3xl mx-auto">
                        {previewMode ? (
                            activeQuestion ? (
                                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 animate-in zoom-in-95 duration-300">
                                    <div className="mb-6 flex gap-3 pb-6 border-b border-slate-100">
                                        <span className="text-xs font-bold uppercase tracking-widest text-primary-500 bg-primary-50 px-2 py-1 rounded">Preview Mode</span>
                                    </div>
                                    <QuestionCard question={activeQuestion} mode="attempt" />
                                </div>
                            ) : <div className="text-center text-slate-500 mt-20 font-medium">Select a question to preview</div>
                        ) : activeTab === 'settings' ? (
                            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 space-y-8 animate-in fade-in">
                                <h2 className="text-2xl font-black text-slate-800 border-b border-slate-100 pb-4">Quiz Settings</h2>

                                <div className="space-y-6">
                                    <Input
                                        label="Quiz Title"
                                        value={quizSettings.title}
                                        onChange={e => setQuizSettings({ ...quizSettings, title: e.target.value })}
                                    />
                                    <div>
                                        <label className="block text-sm font-medium text-slate-500 mb-1">Course</label>
                                        <select
                                            value={quizSettings.course}
                                            onChange={(e) => setQuizSettings({ ...quizSettings, course: e.target.value })}
                                            className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all bg-white"
                                        >
                                            <option value="">Select course</option>
                                            {courses.map((course) => (
                                                <option key={course._id || course.id} value={course._id || course.id}>{course.title}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-500 mb-1">Instructions for Learner</label>
                                        <textarea
                                            rows={4}
                                            className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                                            value={quizSettings.instructions}
                                            onChange={e => setQuizSettings({ ...quizSettings, instructions: e.target.value })}
                                            placeholder="e.g. Please ensure you have a stable connection..."
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-6 pt-6 border-t border-slate-100">
                                        <div className="space-y-4">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input type="checkbox" checked={quizSettings.timed} onChange={e => setQuizSettings({ ...quizSettings, timed: e.target.checked })} className="rounded text-primary-500 w-4 h-4" />
                                                <span className="font-bold text-slate-700 text-sm">Time Limit</span>
                                            </label>
                                            {quizSettings.timed && (
                                                <Input type="number" label="Minutes" value={quizSettings.timeLimit} onChange={e => setQuizSettings({ ...quizSettings, timeLimit: Number(e.target.value) })} />
                                            )}
                                        </div>
                                        <div className="space-y-4">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input type="checkbox" checked={quizSettings.limitedAttempts} onChange={e => setQuizSettings({ ...quizSettings, limitedAttempts: e.target.checked })} className="rounded text-primary-500 w-4 h-4" />
                                                <span className="font-bold text-slate-700 text-sm">Limit Attempts</span>
                                            </label>
                                            {quizSettings.limitedAttempts && (
                                                <Input type="number" label="Max Attempts" value={quizSettings.maxAttempts} onChange={e => setQuizSettings({ ...quizSettings, maxAttempts: Number(e.target.value) })} />
                                            )}
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t border-slate-100">
                                        <div className="flex justify-between items-center mb-2">
                                            <label className="font-bold text-slate-700 text-sm">Passing Score</label>
                                            <span className="font-black text-primary-600">{quizSettings.passMark}%</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0" max="100"
                                            value={quizSettings.passMark}
                                            onChange={e => setQuizSettings({ ...quizSettings, passMark: Number(e.target.value) })}
                                            className="w-full accent-primary-500 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                                        />
                                        <p className="text-xs text-slate-400 mt-2 font-medium">Students must score {quizSettings.passMark}% or higher to pass.</p>
                                    </div>
                                </div>
                            </div>
                        ) : activeQuestion ? (
                            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200 space-y-8 animate-in fade-in transition-all">
                                {/* Type Selector */}
                                <div className="flex p-1 bg-slate-100 rounded-xl w-fit">
                                    {['mcq', 'true_false', 'short_answer', 'survey'].map(t => (
                                        <button
                                            key={t}
                                            onClick={() => handleTypeChange(t)}
                                            className={clsx(
                                                "px-4 py-2 text-xs font-bold rounded-lg uppercase tracking-wider transition-all",
                                                activeQuestion.type === t ? "bg-white text-primary-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
                                            )}
                                        >
                                            {t.replace('_', ' ')}
                                        </button>
                                    ))}
                                </div>

                                <textarea
                                    value={activeQuestion.text}
                                    onChange={e => updateActiveQuestion({ text: e.target.value })}
                                    placeholder="Type your question here..."
                                    className="w-full text-xl font-bold text-slate-800 placeholder-slate-300 resize-none outline-none bg-transparent"
                                    rows={3}
                                />

                                {/* Editor by Type */}
                                <div className="space-y-4">
                                    {activeQuestion.type === 'mcq' && (
                                        <div className="space-y-3">
                                            {activeQuestion.options?.map((opt, i) => (
                                                <div key={opt.id} className={clsx("flex items-center gap-3 p-3 rounded-xl border-2 transition-all", activeQuestion.correctOption === opt.id ? "border-emerald-500 bg-emerald-50" : "border-slate-100 bg-white focus-within:border-primary-300")}>
                                                    <button
                                                        onClick={() => updateActiveQuestion({ correctOption: opt.id })}
                                                        className={clsx("w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors", activeQuestion.correctOption === opt.id ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-300")}
                                                    >
                                                        {activeQuestion.correctOption === opt.id && <HiCheck className="w-4 h-4" />}
                                                    </button>
                                                    <input
                                                        value={opt.text}
                                                        onChange={e => {
                                                            const newOpts = [...activeQuestion.options];
                                                            newOpts[i] = { ...opt, text: e.target.value };
                                                            updateActiveQuestion({ options: newOpts });
                                                        }}
                                                        placeholder={`Option ${String.fromCharCode(65 + i)}`}
                                                        className="flex-1 bg-transparent border-none outline-none font-medium text-slate-700 text-sm"
                                                    />
                                                    <button
                                                        onClick={() => updateActiveQuestion({ options: activeQuestion.options.filter(o => o.id !== opt.id) })}
                                                        className="text-slate-300 hover:text-rose-500 transition-colors"
                                                    ><HiTrash /></button>
                                                </div>
                                            ))}
                                            <Button variant="ghost" onClick={() => updateActiveQuestion({ options: [...activeQuestion.options, { id: generateId(), text: '' }] })} icon={<HiPlus />} className="text-primary-600 mt-2">Add Option</Button>
                                        </div>
                                    )}

                                    {activeQuestion.type === 'true_false' && (
                                        <div className="flex gap-4">
                                            {['true', 'false'].map(opt => (
                                                <button
                                                    key={opt}
                                                    onClick={() => updateActiveQuestion({ correctOption: opt })}
                                                    className={clsx(
                                                        "flex-1 p-4 rounded-xl border-2 font-bold capitalize text-lg transition-all",
                                                        activeQuestion.correctOption === opt ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                                                    )}
                                                >
                                                    {opt}
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {activeQuestion.type === 'short_answer' && (
                                        <div>
                                            <label className="block text-sm font-bold text-slate-500 mb-2">Sample Answer (For Instructors Only)</label>
                                            <textarea
                                                value={activeQuestion.sampleAnswer}
                                                onChange={e => updateActiveQuestion({ sampleAnswer: e.target.value })}
                                                className="w-full rounded-xl border border-slate-200 p-4 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all resize-y min-h-[100px]"
                                                placeholder="Provide a sample correct answer reference..."
                                            />
                                            <p className="text-xs text-amber-600 bg-amber-50 inline-block px-2 py-1 rounded mt-2 font-medium">Note: Short answers require manual grading.</p>
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-100">
                                    <Input type="number" label="Points" value={activeQuestion.points} onChange={e => updateActiveQuestion({ points: Number(e.target.value) })} />
                                    <Select
                                        label="Difficulty"
                                        value={activeQuestion.difficulty}
                                        onChange={v => updateActiveQuestion({ difficulty: v })}
                                        options={[{ label: 'Easy', value: 'easy' }, { label: 'Medium', value: 'medium' }, { label: 'Hard', value: 'hard' }]}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-500 mb-2">Explanation (Optional)</label>
                                    <textarea
                                        value={activeQuestion.explanation}
                                        onChange={e => updateActiveQuestion({ explanation: e.target.value })}
                                        className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none min-h-[80px]"
                                        placeholder="Displayed to students after they submit..."
                                    />
                                </div>

                                <div className="pt-6 flex justify-between">
                                    <Button variant="ghost" className="text-rose-500 hover:bg-rose-50" icon={<HiTrash />} onClick={() => handleDeleteQuestion(activeQuestion.id)}>Delete Question</Button>
                                    <Button variant="secondary" onClick={() => console.log('saved')}>Save Draft</Button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center text-slate-500 mt-20 font-medium">Add a question to get started.</div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
