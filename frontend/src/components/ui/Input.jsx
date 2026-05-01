import { forwardRef } from 'react';
import clsx from 'clsx';

const Input = forwardRef(function Input({
    label, error, hint, icon, iconRight, className = '',
    wrapperClass = '', required, ...props
}, ref) {
    return (
        <div className={clsx('flex flex-col gap-1', wrapperClass)}>
            {label && (
                <label className="text-sm font-medium text-text-secondary">
                    {label}{required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
            <div className="relative">
                {icon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
                        {icon}
                    </div>
                )}
                <input
                    ref={ref}
                    className={clsx(
                        'w-full rounded-lg border bg-white px-3 py-2 text-sm text-text-primary',
                        'placeholder-text-placeholder focus:outline-none focus:ring-2 transition-colors duration-150',
                        icon && 'pl-9', iconRight && 'pr-9',
                        error
                            ? 'border-red-400 focus:ring-red-400 focus:border-red-400'
                            : 'border-surface-border focus:ring-primary-500 focus:border-primary-500',
                        className
                    )}
                    {...props}
                />
                {iconRight && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted">
                        {iconRight}
                    </div>
                )}
            </div>
            {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
            {hint && !error && <p className="text-xs text-text-muted mt-0.5">{hint}</p>}
        </div>
    );
});

export default Input;
