import clsx from 'clsx';

const sizeMap = {
    sm: 'px-3 py-1.5 text-xs h-7',
    md: 'px-4 py-2 text-sm h-9',
    lg: 'px-5 py-2.5 text-sm h-10',
    xl: 'px-6 py-3 text-base h-12',
};

const variantMap = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 border-transparent',
    secondary: 'bg-surface-muted text-slate-700 hover:bg-slate-200 focus:ring-slate-300 border-transparent',
    outline: 'bg-transparent text-slate-700 hover:bg-surface-muted focus:ring-primary-300 border border-slate-300',
    inverse: 'bg-white text-slate-900 hover:bg-slate-50 focus:ring-white/40 border border-slate-200',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-400 border-transparent',
    ghost: 'bg-transparent text-slate-700 hover:bg-surface-muted focus:ring-slate-300 border-transparent',
    success: 'bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-400 border-transparent',
    warning: 'bg-amber-500 text-white hover:bg-amber-600 focus:ring-amber-400 border-transparent',
};

export default function Button({
    children, variant = 'primary', size = 'md', className = '',
    loading = false, icon, iconRight, fullWidth = false, ...props
}) {
    return (
        <button
            className={clsx(
                'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-150',
                'disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-1',
                sizeMap[size], variantMap[variant],
                fullWidth && 'w-full',
                className
            )}
            disabled={loading || props.disabled}
            {...props}
        >
            {loading ? (
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
            ) : icon ? <span className="flex-shrink-0">{icon}</span> : null}
            {children}
            {iconRight && !loading && <span className="flex-shrink-0">{iconRight}</span>}
        </button>
    );
}
