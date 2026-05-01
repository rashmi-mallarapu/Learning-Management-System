import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    HiAcademicCap, HiSparkles, HiShieldCheck, HiChartBar,
    HiUsers, HiLightBulb, HiBookOpen, HiBadgeCheck,
    HiArrowRight, HiPlay, HiCheckCircle
} from 'react-icons/hi';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { ROUTES } from '../../constants/routes';

const highlights = [
    { label: 'Learners', value: '12K+' },
    { label: 'Courses', value: '120+' },
    { label: 'Completion', value: '94%' },
    { label: 'Certificates', value: '8K+' },
];

const features = [
    {
        icon: HiAcademicCap,
        title: 'Structured learning paths',
        desc: 'Progress from beginner to advanced with guided modules, quizzes, and project-based lessons.',
    },
    {
        icon: HiShieldCheck,
        title: 'Role-based experience',
        desc: 'Learner, instructor, and admin journeys are designed to keep every workflow focused.',
    },
    {
        icon: HiChartBar,
        title: 'Progress tracking',
        desc: 'Stay motivated with analytics, streaks, achievements, and clear learning visibility.',
    },
    {
        icon: HiBadgeCheck,
        title: 'Certificates & proof',
        desc: 'Completion badges and certificates help learners showcase real learning outcomes.',
    },
];

const journey = [
    { step: '01', title: 'Explore', desc: 'Browse curated courses matched to your goals and skill level.' },
    { step: '02', title: 'Learn', desc: 'Follow interactive lessons, quizzes, and hands-on assignments.' },
    { step: '03', title: 'Prove', desc: 'Earn certificates, feedback, and progress reports you can share.' },
];

const testimonials = [
    {
        name: 'Alex Johnson',
        role: 'Learner',
        quote: 'The learning flow feels clean and focused. I know exactly where to start and what to do next.',
    },
    {
        name: 'Dr. Michael Torres',
        role: 'Instructor',
        quote: 'I can manage courses, quizzes, and grading without the interface feeling cluttered.',
    },
    {
        name: 'Admin Team',
        role: 'Platform',
        quote: 'The structure is strong enough to scale with real backend APIs and production workflows.',
    },
];

export default function LandingPage() {
    useEffect(() => {
        document.title = 'EduVerse | Learn. Build. Certify.';
    }, []);

    return (
        <div className="min-h-screen bg-surface-bg text-text-primary overflow-hidden relative">
            <div className="absolute inset-x-0 top-0 h-[38rem] bg-gradient-to-br from-primary-900 via-violet-900 to-primary-800" />
            <div className="absolute inset-x-0 top-0 h-[38rem] opacity-70 bg-[radial-gradient(circle_at_top_right,rgba(129,140,248,0.35),transparent_35%),radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.14),transparent_20%)]" />

            <div className="relative z-10">
                <header className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
                    <Link to={ROUTES.LOGIN} className="flex items-center gap-3 text-white">
                        <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center shadow-xl">
                            <HiAcademicCap className="w-7 h-7" />
                        </div>
                        <div>
                            <div className="text-xl font-black tracking-tighter leading-none">EduVerse</div>
                            <div className="text-[10px] uppercase tracking-[0.3em] text-white/60 font-bold mt-1">Learning platform</div>
                        </div>
                    </Link>

                    <div className="hidden md:flex items-center gap-3">
                        <a href="#features" className="text-white/70 hover:text-white text-sm font-semibold">Features</a>
                        <a href="#journey" className="text-white/70 hover:text-white text-sm font-semibold">How it works</a>
                        <a href="#testimonials" className="text-white/70 hover:text-white text-sm font-semibold">Stories</a>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link to={ROUTES.LOGIN}>
                            <span className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/20">
                                Sign in
                            </span>
                        </Link>
                        <Link to={ROUTES.SIGNUP}>
                            <span className="inline-flex items-center justify-center rounded-xl border border-violet-300 bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-xl transition-colors hover:bg-violet-700">
                                Get started
                            </span>
                        </Link>
                    </div>
                </header>

                <section className="max-w-7xl mx-auto px-6 pt-8 pb-20 grid lg:grid-cols-2 gap-12 items-center">
                    <div className="space-y-8 text-white">
                        <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-md px-4 py-2 text-xs font-bold uppercase tracking-[0.25em] text-white/80">
                            <HiSparkles className="w-4 h-4 text-amber-300" />
                            Smarter learning for every role
                        </div>

                        <div className="space-y-5 max-w-3xl">
                            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tighter leading-[0.95]">
                                Learn faster.
                                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-white via-primary-100 to-violet-200">
                                    Build better.
                                </span>
                                Certify skills.
                            </h1>
                            <p className="text-lg sm:text-xl text-white/75 leading-relaxed max-w-2xl">
                                Join a modern LMS designed for learners, instructors, and administrators.
                                Discover courses, complete quizzes, track progress, and prove outcomes in one place.
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <Link to={ROUTES.SIGNUP}>
                                <span className="inline-flex items-center justify-center gap-2 rounded-2xl border border-violet-300 bg-violet-600 px-8 py-3.5 text-base font-semibold text-white shadow-2xl shadow-black/10 transition-colors hover:bg-violet-700">
                                    Get started free <HiArrowRight className="w-5 h-5" />
                                </span>
                            </Link>
                            <Link to={ROUTES.LOGIN}>
                                <span className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/30 bg-white/10 px-8 py-3.5 text-base font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/20">
                                    <HiPlay className="w-5 h-5" /> See the platform
                                </span>
                            </Link>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
                            {highlights.map(item => (
                                <div key={item.label} className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md p-4">
                                    <div className="text-2xl font-black tracking-tight">{item.value}</div>
                                    <div className="text-[10px] uppercase tracking-[0.25em] text-white/60 font-bold mt-1">{item.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="relative">
                        <div className="absolute -inset-8 bg-violet-500/20 blur-3xl rounded-full" />
                        <div className="relative bg-white/95 backdrop-blur-xl border border-white/70 rounded-[2rem] shadow-2xl p-5 sm:p-6 space-y-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Today’s focus</div>
                                    <h2 className="text-2xl font-black text-slate-900 mt-1">Your learning dashboard</h2>
                                </div>
                                <Badge color="violet" variant="soft">Live</Badge>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="rounded-2xl bg-surface-muted p-4 border border-surface-border">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-11 h-11 rounded-xl bg-primary-50 text-primary-700 flex items-center justify-center"><HiUsers className="w-5 h-5" /></div>
                                        <div>
                                            <div className="text-sm font-bold">Learner path</div>
                                            <div className="text-xs text-text-muted">Courses, lessons, certificates</div>
                                        </div>
                                    </div>
                                    <div className="h-2 rounded-full bg-white overflow-hidden"><div className="h-full w-3/4 bg-primary-600 rounded-full" /></div>
                                </div>
                                <div className="rounded-2xl bg-surface-muted p-4 border border-surface-border">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-11 h-11 rounded-xl bg-violet-50 text-violet-700 flex items-center justify-center"><HiBookOpen className="w-5 h-5" /></div>
                                        <div>
                                            <div className="text-sm font-bold">Instructor tools</div>
                                            <div className="text-xs text-text-muted">Manage classes, quizzes, grading</div>
                                        </div>
                                    </div>
                                    <div className="h-2 rounded-full bg-white overflow-hidden"><div className="h-full w-2/3 bg-violet-600 rounded-full" /></div>
                                </div>
                            </div>

                            <div className="rounded-2xl bg-gradient-to-br from-primary-600 to-violet-700 text-white p-5 shadow-primary-glow">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="text-sm font-bold">Complete your next milestone</div>
                                    <HiCheckCircle className="w-5 h-5 text-emerald-300" />
                                </div>
                                <div className="flex items-center gap-3 text-sm text-white/80">
                                    <HiLightBulb className="w-5 h-5" />
                                    Finish 2 lessons and unlock the quiz for Module 3.
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section id="features" className="max-w-7xl mx-auto px-6 py-8">
                    <div className="flex items-end justify-between gap-6 mb-10">
                        <div>
                            <Badge color="blue" variant="soft">Why join</Badge>
                            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tighter mt-3">Everything built for focused learning</h2>
                        </div>
                        <p className="max-w-xl text-text-secondary hidden lg:block">
                            Same theme, cleaner structure, and a direct path into the real application experience.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">
                        {features.map((item) => {
                            const Icon = item.icon;
                            return (
                                <div key={item.title} className="card-hover p-6 rounded-[1.5rem] bg-white border border-surface-border">
                                    <div className="w-12 h-12 rounded-2xl bg-primary-50 text-primary-700 flex items-center justify-center mb-4">
                                        <Icon className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-lg font-black text-slate-900">{item.title}</h3>
                                    <p className="mt-3 text-sm leading-relaxed text-text-secondary">{item.desc}</p>
                                </div>
                            );
                        })}
                    </div>
                </section>

                <section id="journey" className="max-w-7xl mx-auto px-6 py-8">
                    <div className="bg-white rounded-[2rem] border border-surface-border shadow-card p-6 sm:p-8">
                        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-8">
                            <div>
                                <Badge color="violet" variant="soft">How it works</Badge>
                                <h2 className="text-3xl font-black text-slate-900 tracking-tighter mt-3">A simple path from signup to success</h2>
                            </div>
                            <p className="text-text-secondary max-w-2xl">
                                The homepage explains the value first, then guides users to sign in or create an account when they are ready.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-6">
                            {journey.map((item) => (
                                <div key={item.step} className="rounded-2xl bg-surface-bg border border-surface-border p-6">
                                    <div className="text-[11px] font-black tracking-[0.3em] text-primary-600">{item.step}</div>
                                    <h3 className="mt-3 text-xl font-black text-slate-900">{item.title}</h3>
                                    <p className="mt-3 text-sm leading-relaxed text-text-secondary">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section id="testimonials" className="max-w-7xl mx-auto px-6 py-8 pb-16">
                    <div className="mb-8">
                        <Badge color="emerald" variant="soft">User feedback</Badge>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tighter mt-3">Built to feel useful on day one</h2>
                    </div>
                    <div className="grid lg:grid-cols-3 gap-6">
                        {testimonials.map((item) => (
                            <div key={item.name} className="card-hover p-6 rounded-[1.5rem] bg-white border border-surface-border">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-11 h-11 rounded-2xl bg-surface-muted flex items-center justify-center text-primary-600 font-black">
                                        {item.name[0]}
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-900">{item.name}</div>
                                        <div className="text-xs text-text-muted uppercase tracking-[0.2em] font-bold">{item.role}</div>
                                    </div>
                                </div>
                                <p className="text-sm leading-relaxed text-text-secondary">“{item.quote}”</p>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="max-w-7xl mx-auto px-6 pb-20">
                    <div className="rounded-[2rem] bg-gradient-to-r from-primary-700 via-violet-700 to-primary-800 text-white p-8 sm:p-12 border border-white/10 shadow-2xl">
                        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
                            <div className="max-w-2xl">
                                <Badge color="violet" variant="glass">Ready to begin</Badge>
                                <h2 className="text-3xl sm:text-4xl font-black tracking-tighter mt-4">Start with a clear path and a polished learning experience.</h2>
                                <p className="text-white/75 mt-4 text-base leading-relaxed">
                                    Create an account to explore courses, track learning, and unlock the full LMS workflow.
                                </p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                                <Link to={ROUTES.SIGNUP}>
                                    <Button size="xl" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-violet-300 bg-violet-600 px-8 py-3.5 text-base font-semibold text-white shadow-2xl shadow-black/10 transition-colors hover:bg-violet-700">
                                        Create account <HiArrowRight className="w-5 h-5" />
                                    </Button>
                                </Link>
                                <Link to={ROUTES.LOGIN}>
                                    <Button size="xl" variant="outline" className="!bg-white/10 !text-white !border-white/20 hover:!bg-white/15 font-bold px-8 w-full sm:w-auto">
                                        Sign in
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
