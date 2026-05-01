import clsx from 'clsx';

export default function Tabs({ tabs = [], activeTab, onChange, className = '' }) {
    return (
        <div className={clsx('flex gap-1 border-b border-surface-border', className)}>
            {tabs.map(tab => (
                <button
                    key={tab.key}
                    onClick={() => onChange(tab.key)}
                    className={clsx(
                        'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-all duration-150',
                        activeTab === tab.key
                            ? 'border-primary-600 text-primary-700'
                            : 'border-transparent text-text-secondary hover:text-text-primary hover:border-slate-300'
                    )}
                >
                    <span className="flex items-center gap-2">
                        {tab.icon && tab.icon}
                        {tab.label}
                        {tab.count !== undefined && (
                            <span className={clsx(
                                'px-1.5 py-0.5 rounded-full text-xs font-semibold',
                                activeTab === tab.key ? 'bg-primary-100 text-primary-700' : 'bg-slate-100 text-slate-500'
                            )}>{tab.count}</span>
                        )}
                    </span>
                </button>
            ))}
        </div>
    );
}
