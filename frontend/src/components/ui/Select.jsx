import { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';
import { HiChevronDown, HiCheck } from 'react-icons/hi';

export default function Select({ label, options = [], value, onChange, placeholder = 'Select...', error, className = '' }) {
    const [open, setOpen] = useState(false);
    const ref = useRef();

    useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const selected = options.find(o => o.value === value);

    return (
        <div className="relative w-full" ref={ref}>
            {label && <label className="block text-sm font-medium text-text-secondary mb-1">{label}</label>}
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className={clsx(
                    'w-full h-9 flex items-center justify-between gap-2 px-4 py-1.5 rounded-lg border bg-transparent text-sm hover:bg-surface-muted transition-all duration-150',
                    'focus:outline-none focus:ring-2 focus:ring-offset-1',
                    error ? 'border-red-400 focus:ring-red-400 text-red-500' : 'border-surface-border focus:ring-primary-300 text-text-secondary',
                    !selected && 'text-text-placeholder',
                    className
                )}
            >
                <span>{selected ? selected.label : placeholder}</span>
                <HiChevronDown className={clsx('w-4 h-4 text-text-muted transition-transform', open && 'rotate-180')} />
            </button>
            {open && (
                <div className="absolute z-50 mt-1 w-full bg-white border border-surface-border rounded-xl shadow-dropdown py-1 max-h-56 overflow-y-auto">
                    {options.map(opt => (
                        <button
                            key={opt.value}
                            type="button"
                            onClick={() => { onChange(opt.value); setOpen(false); }}
                            className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-surface-muted text-text-primary transition-colors"
                        >
                            <span>{opt.label}</span>
                            {value === opt.value && <HiCheck className="w-4 h-4 text-primary-600" />}
                        </button>
                    ))}
                </div>
            )}
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
    );
}
