import clsx from 'clsx';
import { HiChevronLeft, HiChevronRight } from 'react-icons/hi';

export default function Pagination({ currentPage, totalPages, onPageChange, className = '' }) {
    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
    const getVisible = () => {
        if (totalPages <= 7) return pages;
        if (currentPage <= 4) return [...pages.slice(0, 5), '...', totalPages];
        if (currentPage >= totalPages - 3) return [1, '...', ...pages.slice(totalPages - 5)];
        return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
    };

    return (
        <div className={clsx('flex items-center gap-1', className)}>
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-surface-border text-text-secondary hover:bg-surface-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
                <HiChevronLeft className="w-4 h-4" />
            </button>
            {getVisible().map((p, i) =>
                p === '...'
                    ? <span key={`e-${i}`} className="px-2 text-text-muted text-sm">…</span>
                    : (
                        <button
                            key={p}
                            onClick={() => onPageChange(p)}
                            className={clsx(
                                'w-9 h-9 rounded-lg text-sm font-medium transition-colors border',
                                currentPage === p
                                    ? 'bg-primary-600 text-white border-primary-600'
                                    : 'border-surface-border text-text-secondary hover:bg-surface-muted'
                            )}
                        >{p}</button>
                    )
            )}
            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-surface-border text-text-secondary hover:bg-surface-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
                <HiChevronRight className="w-4 h-4" />
            </button>
        </div>
    );
}
