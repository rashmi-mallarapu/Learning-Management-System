import {
    HiBell, HiCheckCircle, HiExclamation, HiChatAlt,
    HiUserGroup, HiAcademicCap, HiX
} from 'react-icons/hi';
import Badge from './Badge';
import Button from './Button';
import clsx from 'clsx';

const ICON_MAP = {
    assignment: HiCheckCircle,
    classroom: HiAcademicCap,
    enrollment: HiUserGroup,
    general: HiBell,
    grade: HiCheckCircle,
    message: HiChatAlt,
    platform: HiExclamation,
    quiz: HiAcademicCap,
};

export default function NotificationCenter({ isOpen, onClose, notifications, onMarkRead, onMarkAllRead }) {
    const unreadCount = notifications.filter(n => n.unread).length;

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[60]" onClick={onClose} />

            {/* Panel */}
            <div className="fixed top-0 right-0 h-full w-full max-w-sm bg-white shadow-2xl z-[70] flex flex-col border-l border-surface-border animate-in slide-in-from-right duration-300">
                <div className="p-6 border-b border-surface-border flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold text-text-primary">Notifications</h2>
                        {unreadCount > 0 && (
                            <Badge color="blue" variant="soft">{unreadCount} New</Badge>
                        )}
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-surface-muted rounded-full transition-colors text-text-muted">
                        <HiX className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {notifications.length > 0 ? (
                        notifications.map((n) => {
                            const Icon = ICON_MAP[n.type] || HiBell;

                            return (
                                <div
                                    key={n.id}
                                    onClick={() => onMarkRead?.(n.id)}
                                    className={clsx(
                                        "p-5 border-b border-surface-border cursor-pointer transition-colors hover:bg-slate-50 relative",
                                        n.unread ? "bg-primary-50/30" : "bg-white"
                                    )}
                                >
                                    {n.unread && (
                                        <div className="absolute top-6 left-2 w-1.5 h-1.5 rounded-full bg-primary-500" />
                                    )}
                                    <div className="flex gap-4">
                                        <div className={clsx(
                                            "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-white shadow-sm border border-surface-border text-primary-600",
                                            n.color === 'green' && "text-emerald-500",
                                            n.color === 'amber' && "text-amber-500",
                                            n.color === 'purple' && "text-purple-500"
                                        )}>
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <div className="min-w-0 flex-1 space-y-1">
                                            <p className="text-sm font-bold text-text-primary leading-tight">{n.title}</p>
                                            <p className="text-xs text-text-secondary leading-relaxed line-clamp-2">{n.message}</p>
                                            <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest pt-1">{n.time}</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="p-12 text-center text-text-muted">
                            <HiBell className="w-12 h-12 mx-auto mb-4 opacity-10" />
                            <p className="font-bold uppercase tracking-widest text-[10px]">No notifications yet</p>
                        </div>
                    )}
                </div>

                <div className="p-5 border-t border-surface-border bg-surface-muted/50">
                    <Button
                        fullWidth
                        variant="outline"
                        onClick={onMarkAllRead}
                        disabled={unreadCount === 0}
                    >
                        Mark all as read
                    </Button>
                </div>
            </div>
        </>
    );
}
