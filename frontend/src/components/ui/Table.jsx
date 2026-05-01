import clsx from 'clsx';

export function Table({ children, className = '' }) {
    return (
        <div className={clsx('w-full overflow-visible', className)}>
            <table className="w-full text-sm">{children}</table>
        </div>
    );
}

export function Thead({ children }) {
    return (
        <thead>
            <tr className="border-b border-surface-border bg-surface-muted">
                {children}
            </tr>
        </thead>
    );
}

export function Th({ children, className = '', onClick, sortDir, align = 'left' }) {
    return (
        <th
            className={clsx(
                'px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide',
                align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left',
                onClick && 'cursor-pointer hover:text-text-primary select-none',
                className
            )}
            onClick={onClick}
        >
            <span className={clsx("flex items-center gap-1", align === 'right' && "justify-end", align === 'center' && "justify-center")}>
                {children}
                {sortDir === 'asc' && '↑'}
                {sortDir === 'desc' && '↓'}
            </span>
        </th>
    );
}

export function Tbody({ children }) {
    return <tbody className="divide-y divide-surface-border">{children}</tbody>;
}

export function Tr({ children, onClick, className = '' }) {
    return (
        <tr
            className={clsx('hover:bg-surface-muted/50 transition-colors', onClick && 'cursor-pointer', className)}
            onClick={onClick}
        >
            {children}
        </tr>
    );
}

export function Td({ children, className = '', ...props }) {
    return <td className={clsx('px-4 py-3 text-text-primary', className)} {...props}>{children}</td>;
}
