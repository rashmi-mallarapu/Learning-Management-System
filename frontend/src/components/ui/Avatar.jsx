import clsx from 'clsx';

export default function Avatar({ name, src, size = 'md', className = '' }) {
    const sizeMap = { xs: 'w-6 h-6 text-xs', sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base', xl: 'w-16 h-16 text-lg' };
    const initials = name ? name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : '?';
    const colors = ['bg-primary-100 text-primary-700', 'bg-violet-100 text-violet-700', 'bg-emerald-100 text-emerald-700', 'bg-amber-100 text-amber-700', 'bg-rose-100 text-rose-700'];
    const color = colors[(name?.charCodeAt(0) || 0) % colors.length];
    const resolvedSrc = src
        ? (/^https?:\/\//i.test(src) ? src : `${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://127.0.0.1:5000'}${src}`)
        : '';

    if (resolvedSrc) {
        return <img src={resolvedSrc} alt={name} className={clsx('rounded-full object-cover flex-shrink-0', sizeMap[size], className)} />;
    }
    return (
        <div className={clsx('rounded-full flex items-center justify-center flex-shrink-0 font-semibold', sizeMap[size], color, className)}>
            {initials}
        </div>
    );
}
