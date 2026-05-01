import { useState } from 'react';
import {
    HiChevronRight, HiChevronLeft, HiUpload, HiPlus,
    HiTrash, HiCheck, HiAcademicCap, HiDocumentText,
    HiVideoCamera, HiCog, HiDotsVertical, HiX
} from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import Select from '../../components/ui/Select';
import clsx from 'clsx';
import { createCourse, createLesson } from '../../services/instructorApi';
import toast from 'react-hot-toast';

export default function CreateCourse() {
    const [step, setStep] = useState(1);
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        category: '',
        difficulty: '',
        description: '',
        thumbnail: null,
    });

    const [curriculum, setCurriculum] = useState([]);

    const handleAddModule = () => {
        setCurriculum([...curriculum, {
            id: Date.now(),
            title: `Module ${curriculum.length + 1}`,
            lessons: []
        }]);
    };

    const handleAddLesson = (moduleId) => {
        setCurriculum(curriculum.map(mod => {
            if (mod.id === moduleId) {
                return {
                    ...mod,
                    lessons: [...mod.lessons, {
                        id: Date.now(),
                        title: '',
                        description: '',
                        file: null,
                        type: 'video'
                    }]
                };
            }
            return mod;
        }));
    };

    const handleRemoveModule = (moduleId) => {
        setCurriculum(curriculum.filter(mod => mod.id !== moduleId));
    };

    const handleRemoveLesson = (moduleId, lessonId) => {
        setCurriculum(curriculum.map(mod => {
            if (mod.id === moduleId) {
                return { ...mod, lessons: mod.lessons.filter(l => l.id !== lessonId) };
            }
            return mod;
        }));
    };

    const handleLessonChange = (moduleId, lessonId, field, value) => {
        setCurriculum(curriculum.map(mod => {
            if (mod.id === moduleId) {
                return {
                    ...mod,
                    lessons: mod.lessons.map(l => l.id === lessonId ? { ...l, [field]: value } : l)
                };
            }
            return mod;
        }));
    };

    const steps = [
        { n: 1, label: 'Basic Info', icon: HiDocumentText },
        { n: 2, label: 'Curriculum', icon: HiAcademicCap },
        { n: 3, label: 'Publish Settings', icon: HiCheck },
    ];

    const handleSubmit = async () => {
        if (!formData.title || !formData.category) {
            toast.error('Please fill in the basic course info first.');
            setStep(1);
            return;
        }

        setIsSubmitting(true);
        const toastId = toast.loading('Creating course and uploading curriculum...');
        try {
            // 1. Create the Course
            const payload = new FormData();
            payload.append('title', formData.title);
            payload.append('category', formData.category);
            if (formData.difficulty) {
                const normalizedDifficulty = formData.difficulty.charAt(0).toUpperCase() + formData.difficulty.slice(1);
                payload.append('difficulty', normalizedDifficulty);
            }
            payload.append('description', formData.description);
            if (formData.thumbnail) payload.append('thumbnail', formData.thumbnail);

            const course = await createCourse(payload);
            const courseId = course._id || course.id;

            // 2. Upload Lessons
            let lessonCount = 0;
            let totalLessons = curriculum.reduce((acc, mod) => acc + mod.lessons.length, 0);

            for (const [modIndex, module] of curriculum.entries()) {
                for (const [lessonIndex, lesson] of module.lessons.entries()) {
                    if (!lesson.title || !lesson.file) continue;

                    const lessonPayload = new FormData();
                    lessonPayload.append('courseId', courseId);
                    lessonPayload.append('title', lesson.title);
                    lessonPayload.append('description', lesson.description || '');
                    lessonPayload.append('order', lessonCount + 1);
                    lessonPayload.append('content', lesson.file);

                    await createLesson(lessonPayload);
                    lessonCount++;
                    toast.loading(`Uploaded ${lessonCount}/${totalLessons} lessons...`, { id: toastId });
                }
            }

            toast.success('Course and curriculum created successfully!', { id: toastId });
            navigate(ROUTES.INSTRUCTOR_COURSES);
        } catch (err) {
            toast.error(err.message || 'Failed to submit course', { id: toastId });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleNext = () => setStep(s => Math.min(3, s + 1));
    const handleBack = () => setStep(s => Math.max(1, s - 1));

    return (
        <div className="p-6 space-y-8 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold text-text-primary">Create New Course</h1>
                    <p className="text-text-secondary">Fill in the details to launch your enterprise course.</p>
                </div>
                <Button variant="ghost" onClick={() => navigate(ROUTES.INSTRUCTOR_COURSES)}>Cancel</Button>
            </div>

            {/* Steps Indicator */}
            <div className="flex items-center justify-between relative px-2">
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 -z-10 -translate-y-1/2" />
                {steps.map(s => (
                    <div key={s.n} className="flex flex-col items-center gap-2">
                        <div className={clsx(
                            "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
                            step === s.n ? "bg-violet-600 border-violet-600 text-white shadow-lg scale-110" :
                                step > s.n ? "bg-emerald-500 border-emerald-500 text-white" : "bg-white border-slate-300 text-slate-400"
                        )}>
                            {step > s.n ? <HiCheck className="w-6 h-6" /> : <s.icon className="w-5 h-5" />}
                        </div>
                        <span className={clsx("text-xs font-bold uppercase tracking-wider", step >= s.n ? "text-text-primary" : "text-text-muted")}>
                            {s.label}
                        </span>
                    </div>
                ))}
            </div>

            {/* Form Content */}
            <div className="bg-white rounded-2xl border border-surface-border shadow-card p-8">
                {step === 1 && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input
                                label="Course Title"
                                placeholder="e.g. Master React in 30 Days"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                required
                            />
                            <Select
                                label="Category"
                                placeholder="Select category"
                                value={formData.category}
                                onChange={(val) => setFormData({ ...formData, category: val })}
                                options={[
                                    { label: 'Web Development', value: 'Web Development' },
                                    { label: 'Data Science', value: 'Data Science' },
                                    { label: 'Design', value: 'Design' },
                                    { label: 'Cloud Computing', value: 'Cloud Computing' },
                                    { label: 'Business', value: 'Business' },
                                    { label: 'Security', value: 'Security' }
                                ]}
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Select
                                label="Difficulty"
                                value={formData.difficulty}
                                onChange={(val) => setFormData({ ...formData, difficulty: val })}
                                options={[
                                    { label: 'Beginner', value: 'beginner' },
                                    { label: 'Intermediate', value: 'intermediate' },
                                    { label: 'Advanced', value: 'advanced' }
                                ]}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">Description</label>
                            <textarea
                                className="w-full rounded-lg border border-surface-border p-3 text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none min-h-[120px]"
                                placeholder="Describe what students will learn..."
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-2">Course Thumbnail</label>
                            <input
                                type="file"
                                id="thumbnail-upload"
                                className="hidden"
                                onChange={(e) => setFormData({ ...formData, thumbnail: e.target.files[0] })}
                            />
                            <label 
                                htmlFor="thumbnail-upload"
                                className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-violet-400 transition-colors cursor-pointer group block"
                            >
                                <HiUpload className="w-12 h-12 text-slate-300 mx-auto mb-2 group-hover:text-violet-500 transition-colors" />
                                <p className="text-sm text-text-secondary">
                                    {formData.thumbnail ? formData.thumbnail.name : 'Click to upload or drag and drop'}
                                </p>
                                <p className="text-xs text-text-muted mt-1">SVG, PNG, JPG or GIF (max. 800x400px)</p>
                            </label>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="space-y-1">
                                <h3 className="font-bold text-text-primary">Curriculum Builder</h3>
                                <p className="text-xs text-text-muted">Organize your course into modules and lessons.</p>
                            </div>
                            <Button size="sm" variant="outline" icon={<HiPlus />} onClick={handleAddModule}>Add Module</Button>
                        </div>

                        {curriculum.length === 0 ? (
                            <div className="bg-indigo-50 p-10 rounded-3xl border border-indigo-100 text-center">
                                <HiAcademicCap className="w-12 h-12 text-indigo-400 mx-auto mb-3" />
                                <p className="text-sm text-indigo-900 font-bold">Your curriculum is empty</p>
                                <p className="text-xs text-indigo-600 mt-1 max-w-[240px] mx-auto">Click "Add Module" to start building your course structure.</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {curriculum.map((module, mIdx) => (
                                    <div key={module.id} className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden">
                                        <div className="bg-white px-5 py-4 border-b border-slate-200 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <Badge color="blue" className="font-mono">M{mIdx + 1}</Badge>
                                                <input 
                                                    className="font-bold text-sm text-slate-800 bg-transparent border-none focus:ring-0 p-0 w-64"
                                                    value={module.title}
                                                    onChange={(e) => setCurriculum(curriculum.map(m => m.id === module.id ? { ...m, title: e.target.value } : m))}
                                                />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button size="xs" variant="ghost" className="text-red-500 hover:bg-red-50" onClick={() => handleRemoveModule(module.id)}>
                                                    <HiTrash className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                        
                                        <div className="p-5 space-y-4">
                                            {module.lessons.map((lesson, lIdx) => (
                                                <div key={lesson.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm space-y-4">
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="flex-1 space-y-4">
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-xs font-bold text-slate-400">{lIdx + 1}.</span>
                                                                <input 
                                                                    placeholder="Lesson Title (e.g. Setting up the environment)"
                                                                    className="w-full text-sm font-bold text-slate-700 border-none focus:ring-0 p-0"
                                                                    value={lesson.title}
                                                                    onChange={(e) => handleLessonChange(module.id, lesson.id, 'title', e.target.value)}
                                                                />
                                                            </div>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                <div className="space-y-2">
                                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Resource File</label>
                                                                    <div className="relative">
                                                                        <input 
                                                                            type="file"
                                                                            className="hidden"
                                                                            id={`file-${lesson.id}`}
                                                                            onChange={(e) => handleLessonChange(module.id, lesson.id, 'file', e.target.files[0])}
                                                                        />
                                                                        <label 
                                                                            htmlFor={`file-${lesson.id}`}
                                                                            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-600 cursor-pointer hover:bg-slate-100 transition-colors"
                                                                        >
                                                                            {lesson.file ? <HiCheck className="text-emerald-500" /> : <HiUpload />}
                                                                            <span className="truncate">{lesson.file ? lesson.file.name : 'Upload Video or PDF'}</span>
                                                                        </label>
                                                                    </div>
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</label>
                                                                    <div className="flex gap-2">
                                                                        {['video', 'pdf'].map(t => (
                                                                            <button 
                                                                                key={t}
                                                                                onClick={() => handleLessonChange(module.id, lesson.id, 'type', t)}
                                                                                className={clsx(
                                                                                    "flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all",
                                                                                    lesson.type === t ? "bg-violet-600 border-violet-600 text-white shadow-sm" : "bg-white border-slate-200 text-slate-400 hover:border-slate-300"
                                                                                )}
                                                                            >
                                                                                {t}
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <button className="p-1 text-slate-300 hover:text-red-500 transition-colors" onClick={() => handleRemoveLesson(module.id, lesson.id)}>
                                                            <HiX className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                            
                                            <button 
                                                onClick={() => handleAddLesson(module.id)}
                                                className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-xs font-bold text-slate-400 hover:border-violet-300 hover:text-violet-500 transition-all flex items-center justify-center gap-2"
                                            >
                                                <HiPlus className="w-4 h-4" /> Add Lesson to {module.title}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-8 py-4">
                        <div className="flex flex-col items-center text-center space-y-4">
                            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                                <HiCheck className="w-10 h-10" />
                            </div>
                            <h3 className="text-xl font-bold text-text-primary">Ready to Launch!</h3>
                            <p className="text-text-secondary max-w-sm">Review your details and submit your course for admin approval before it reaches learners.</p>
                        </div>

                        <div className="space-y-4 bg-surface-muted/30 p-6 rounded-2xl border border-surface-border">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-text-secondary">Visibility</span>
                                <Badge color="orange">Pending Admin Approval</Badge>
                            </div>
                            <div className="flex justify-between items-center text-sm pt-2 border-t border-surface-border">
                                <span className="text-text-secondary italic">Estimated students reached</span>
                                <span className="text-violet-600 font-bold font-mono">1.2k+</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Footer Navigation */}
                <div className="flex items-center justify-between mt-8 pt-6 border-t border-surface-border">
                    <Button
                        variant="outline"
                        onClick={handleBack}
                        className={clsx(step === 1 && "invisible")}
                        icon={<HiChevronLeft />}
                        disabled={isSubmitting}
                    >
                        Back
                    </Button>
                    <div className="flex gap-3">
                        {step < 3 ? (
                            <Button onClick={handleNext} className="bg-violet-600 hover:bg-violet-700 text-white" iconRight={<HiChevronRight />}>Next Step</Button>
                        ) : (
                            <Button 
                                onClick={handleSubmit} 
                                className="bg-violet-600 hover:bg-violet-700 text-white px-8" 
                                icon={<HiCheck />}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Submitting...' : 'Submit For Review'}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
