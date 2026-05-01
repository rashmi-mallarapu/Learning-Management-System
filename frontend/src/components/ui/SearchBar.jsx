import { forwardRef } from 'react';
import { HiSearch, HiX } from 'react-icons/hi';
import clsx from 'clsx';

const SearchBar = forwardRef(function SearchBar({ value, onChange, placeholder = 'Search...', onClear, className = '', size = 'md' }, ref) {
    const sizeMap = { sm: 'h-8 text-xs', md: 'h-9 text-sm', lg: 'h-10 text-sm' };
    return (
        <div className={clsx('relative flex-1', className)}>
            <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
                ref={ref}
                type="text"
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                className={clsx(
                    'w-full pl-9 pr-9 rounded-lg border border-surface-border bg-white text-text-primary placeholder-text-placeholder',
                    'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors',
                    sizeMap[size]
                )}
            />
            {value && (
                <button onClick={onClear} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary">
                    <HiX className="w-4 h-4" />
                </button>
            )}
        </div>
    );
});

export default SearchBar;
