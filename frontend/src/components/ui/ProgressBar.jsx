import clsx from 'clsx';

export default function ProgressBar({ value = 0, max = 100, size = 'md', color = 'primary', showLabel = false, label, className = '' }) {
    const pct = Math.min(100, Math.max(0, (value / max) * 100));
    const heightMap = { xs: 'h-1', sm: 'h-1.5', md: 'h-2', lg: 'h-3' };
    const colorMap = {
        primary: 'bg-primary-500',
        green: 'bg-emerald-500',
        orange: 'bg-amber-500',
        red: 'bg-red-500',
        purple: 'bg-violet-500',
    };
    return (
        <div className={clsx('w-full', className)}>
            {(showLabel || label) && (
                <div className="flex justify-between items-center mb-1">
                    {label && <span className="text-xs text-text-secondary">{label}</span>}
                    {showLabel && <span className="text-xs font-medium text-text-secondary">{Math.round(pct)}%</span>}
                </div>
            )}
            <div className={clsx('w-full bg-slate-200 rounded-full overflow-hidden', heightMap[size])}>
                <div
                    className={clsx('h-full rounded-full transition-all duration-500', colorMap[color])}
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    );
}
