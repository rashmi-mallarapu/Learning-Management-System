import clsx from 'clsx';

const variantMap = {
    solid: {
        blue: 'bg-primary-600 text-white shadow-primary-glow border-transparent',
        emerald: 'bg-emerald-600 text-white shadow-emerald-glow border-transparent',
        rose: 'bg-rose-600 text-white shadow-rose-glow border-transparent',
        amber: 'bg-amber-500 text-white shadow-amber-glow border-transparent',
        violet: 'bg-violet-600 text-white shadow-violet-glow border-transparent',
        slate: 'bg-slate-700 text-white border-transparent',
    },
    soft: {
        blue: 'bg-primary-50 text-primary-700 border-primary-100',
        emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
        rose: 'bg-rose-50 text-rose-700 border-rose-100',
        amber: 'bg-amber-50 text-amber-700 border-amber-100',
        violet: 'bg-violet-50 text-violet-700 border-violet-100',
        slate: 'bg-slate-100 text-slate-600 border-slate-200',
    },
    glass: {
        blue: 'bg-white/10 text-white border-white/20 backdrop-blur-md',
        emerald: 'bg-white/10 text-emerald-400 border-white/20 backdrop-blur-md',
        rose: 'bg-white/10 text-rose-400 border-white/20 backdrop-blur-md',
        amber: 'bg-white/10 text-amber-400 border-white/20 backdrop-blur-md',
        violet: 'bg-white/10 text-violet-200 border-white/20 backdrop-blur-md',
        slate: 'bg-white/10 text-white border-white/20 backdrop-blur-md',
    }
};

export default function Badge({ children, color = 'blue', variant = 'soft', dot = false, className = '' }) {
    return (
        <span className={clsx(
            'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border transition-all',
            variantMap[variant][color] || variantMap[variant]['blue'],
            className
        )}>
            {dot && <span className={clsx('w-1.5 h-1.5 rounded-full animate-pulse', {
                'bg-primary-500': color === 'blue',
                'bg-emerald-500': color === 'emerald',
                'bg-rose-500': color === 'rose',
                'bg-amber-500': color === 'amber',
                'bg-violet-500': color === 'violet',
                'bg-slate-400': color === 'slate',
            })} />}
            {children}
        </span>
    );
}
