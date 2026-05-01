import clsx from 'clsx';
import { HiCheck, HiX } from 'react-icons/hi';

export default function QuestionCard({ question, mode = 'attempt', selectedAnswer, onAnswer, showCorrect = false }) {
    if (!question) return null;

    const isReview = mode === 'review' || showCorrect;

    const renderMCQ = () => {
        return (
            <div className="space-y-3 mt-6">
                {question.options?.map((opt, index) => {
                    const isSelected = selectedAnswer === opt.id;
                    const isCorrectAns = question.correctOption === opt.id;

                    let stateClass = 'bg-white border-slate-200 hover:bg-blue-50';
                    if (isReview) {
                        if (isCorrectAns) {
                            stateClass = 'bg-emerald-50 border-emerald-500 text-emerald-900';
                        } else if (isSelected && !isCorrectAns) {
                            stateClass = 'bg-red-50 border-red-500 text-red-900';
                        } else {
                            stateClass = 'bg-white border-slate-200 opacity-50';
                        }
                    } else if (isSelected) {
                        stateClass = 'bg-blue-50 border-blue-500 border-[1.5px]';
                    }

                    const label = String.fromCharCode(65 + index);

                    return (
                        <button
                            key={opt.id}
                            disabled={isReview}
                            onClick={() => onAnswer && onAnswer(opt.id)}
                            className={clsx(
                                "w-full text-left p-4 rounded-xl border transition-all duration-200 flex items-center group",
                                stateClass
                            )}
                        >
                            <div className={clsx(
                                "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm mr-4 border transition-colors flex-shrink-0",
                                isReview && isCorrectAns ? "bg-emerald-500 border-emerald-500 text-white" :
                                    isReview && isSelected && !isCorrectAns ? "bg-red-500 border-red-500 text-white" :
                                        isSelected ? "bg-blue-500 border-blue-500 text-white" : "bg-slate-50 border-slate-200 text-slate-500 group-hover:bg-blue-100 group-hover:border-blue-200"
                            )}>
                                {label}
                            </div>
                            <span className={clsx(
                                "flex-1 font-medium text-sm",
                                isReview && isCorrectAns ? "text-emerald-900" :
                                    isReview && isSelected && !isCorrectAns ? "text-red-900" : "text-slate-700"
                            )}>{opt.text}</span>

                            {isReview && isCorrectAns && <HiCheck className="w-5 h-5 text-emerald-600 flex-shrink-0 ml-2" />}
                            {isReview && isSelected && !isCorrectAns && <HiX className="w-5 h-5 text-red-600 flex-shrink-0 ml-2" />}
                            {!isReview && isSelected && <HiCheck className="w-5 h-5 text-blue-600 flex-shrink-0 ml-2" />}
                        </button>
                    );
                })}
            </div>
        );
    };

    const renderTrueFalse = () => {
        return (
            <div className="grid grid-cols-2 gap-4 mt-6">
                {['true', 'false'].map(opt => {
                    const isSelected = selectedAnswer === opt;
                    const isCorrectAns = question.correctOption === opt;

                    let stateClass = 'bg-white border-slate-200 hover:bg-blue-50';
                    if (isReview) {
                        if (isCorrectAns) {
                            stateClass = 'bg-emerald-50 border-emerald-500 text-emerald-900';
                        } else if (isSelected && !isCorrectAns) {
                            stateClass = 'bg-red-50 border-red-500 text-red-900';
                        } else {
                            stateClass = 'bg-white border-slate-200 opacity-50';
                        }
                    } else if (isSelected) {
                        stateClass = 'bg-blue-50 border-blue-500 border-[1.5px]';
                    }

                    return (
                        <button
                            key={opt}
                            disabled={isReview}
                            onClick={() => onAnswer && onAnswer(opt)}
                            className={clsx(
                                "p-4 rounded-xl border transition-all duration-200 flex flex-col items-center justify-center font-bold capitalize gap-2 text-lg",
                                stateClass
                            )}
                        >
                            {opt}
                            {isReview && isCorrectAns && <HiCheck className="w-6 h-6 text-emerald-600" />}
                            {isReview && isSelected && !isCorrectAns && <HiX className="w-6 h-6 text-red-600" />}
                            {!isReview && isSelected && <HiCheck className="w-6 h-6 text-blue-600" />}
                        </button>
                    );
                })}
            </div>
        );
    };

    const renderShortAnswer = () => {
        const textRef = selectedAnswer || '';
        return (
            <div className="mt-6 space-y-4">
                <div className="relative">
                    <textarea
                        readOnly={isReview}
                        value={selectedAnswer || ''}
                        onChange={(e) => onAnswer && onAnswer(e.target.value)}
                        className={clsx(
                            "w-full p-4 rounded-xl border text-sm transition-all min-h-[120px] resize-y",
                            isReview ? "bg-slate-50 border-slate-200 text-slate-700" : "bg-white border-slate-200 hover:border-blue-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none"
                        )}
                        placeholder="Type your answer here..."
                    />
                    {!isReview && (
                        <div className="absolute bottom-3 right-3 text-xs font-medium text-slate-400">
                            {textRef.length} / 500
                        </div>
                    )}
                </div>

                {isReview && question.sampleAnswer && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                        <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-2">Sample Answer</h4>
                        <p className="text-sm text-amber-900">{question.sampleAnswer}</p>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="w-full">
            <div className="text-[16px] font-semibold text-slate-800 leading-[1.5] mb-6">
                {question.text}
            </div>

            {question.type === 'mcq' && renderMCQ()}
            {question.type === 'true_false' && renderTrueFalse()}
            {question.type === 'short_answer' && renderShortAnswer()}

            {isReview && question.explanation && (
                <div className="mt-8 border border-slate-200 rounded-xl overflow-hidden bg-white">
                    <details className="group">
                        <summary className="p-4 bg-slate-50 font-bold text-sm text-slate-700 cursor-pointer flex justify-between items-center group-open:border-b border-slate-200 list-none">
                            <span>View Explanation</span>
                            <span className="transition group-open:rotate-180">
                                <svg fill="none" height="24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                            </span>
                        </summary>
                        <div className="p-4 text-sm text-slate-600 leading-relaxed">
                            {question.explanation}
                        </div>
                    </details>
                </div>
            )}
        </div>
    );
}
