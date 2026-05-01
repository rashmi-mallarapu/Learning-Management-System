import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import { HiX } from 'react-icons/hi';
import Button from './Button';

const sizeMap = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full mx-4',
};

export default function Modal({ open, onClose, title, children, footer, size = 'md', closable = true }) {
    useEffect(() => {
        if (open) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [open]);

    if (!open) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closable ? onClose : undefined} />
            <div className={clsx('relative bg-white rounded-2xl shadow-card-lg w-full flex flex-col max-h-[90vh]', sizeMap[size])}>
                {/* Header */}
                {(title || closable) && (
                    <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border flex-shrink-0">
                        {title && <h2 className="text-base font-semibold text-text-primary">{title}</h2>}
                        {closable && (
                            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-muted text-text-muted hover:text-text-secondary transition-colors">
                                <HiX className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                )}
                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>
                {/* Footer */}
                {footer && (
                    <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-surface-border flex-shrink-0">
                        {footer}
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
}
