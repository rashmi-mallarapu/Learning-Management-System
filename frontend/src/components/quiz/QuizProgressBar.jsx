import clsx from 'clsx';

export default function QuizProgressBar({ total, answered, flagged }) {
    const percentage = total > 0 ? (answered / total) * 100 : 0;

    let colorClass = 'bg-blue-500';
    if (answered === total) {
        colorClass = 'bg-emerald-500';
    } else if (flagged > 0) {
        colorClass = 'bg-amber-500';
    }

    return (
        <div className="w-full h-[3px] bg-slate-100 overflow-hidden relative">
            <div
                className={clsx("h-full transition-all duration-500 ease-out", colorClass)}
                style={{ width: `${percentage}%` }}
            />
        </div>
    );
}
