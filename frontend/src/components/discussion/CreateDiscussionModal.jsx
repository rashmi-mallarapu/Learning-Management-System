import { useState } from 'react';
import { HiX } from 'react-icons/hi';
import Button from '../ui/Button';
import toast from 'react-hot-toast';

export default function CreateDiscussionModal({
    isOpen = false,
    onClose = () => {},
    onSubmit = () => {},
    loading = false,
}) {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [tags, setTags] = useState([]);

    const availableTags = ['React', 'Node', 'Bug', 'Feature', 'Question', 'Documentation', 'Other'];

    const handleSubmit = async () => {
        if (!title.trim()) {
            toast.error('Please enter a title');
            return;
        }

        if (!content.trim()) {
            toast.error('Please enter content');
            return;
        }

        try {
            await onSubmit({
                title: title.trim(),
                content: content.trim(),
                tags,
            });

            // Reset form
            setTitle('');
            setContent('');
            setTags([]);
            onClose();
        } catch (err) {
            toast.error(err?.message || 'Failed to create discussion');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-surface-border p-6 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-text-primary">Start a Discussion</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <HiX className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <div className="p-6 space-y-4">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-text-primary mb-2">
                            Question Title
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="What's your question?"
                            maxLength={200}
                            className="w-full px-4 py-2 border border-surface-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
                        />
                        <p className="text-xs text-text-muted mt-1">{title.length}/200</p>
                    </div>

                    {/* Content */}
                    <div>
                        <label className="block text-sm font-medium text-text-primary mb-2">
                            Description
                        </label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Provide more details about your question..."
                            rows={6}
                            className="w-full px-4 py-2 border border-surface-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none resize-none"
                        />
                        <p className="text-xs text-text-muted mt-1">
                            Minimum 10 characters required
                        </p>
                    </div>

                    {/* Tags */}
                    <div>
                        <label className="block text-sm font-medium text-text-primary mb-2">
                            Tags (Optional)
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {availableTags.map(tag => (
                                <button
                                    key={tag}
                                    onClick={() =>
                                        setTags(prev =>
                                            prev.includes(tag)
                                                ? prev.filter(t => t !== tag)
                                                : [...prev, tag]
                                        )
                                    }
                                    className={`px-3 py-2 text-sm rounded transition-colors ${
                                        tags.includes(tag)
                                            ? 'bg-primary-600 text-white'
                                            : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                                    }`}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-white border-t border-surface-border p-6 flex justify-end gap-3">
                    <Button variant="outline" onClick={onClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button
                        className="bg-primary-600 text-white hover:bg-primary-700"
                        disabled={loading}
                        onClick={handleSubmit}
                    >
                        {loading ? 'Creating...' : 'Create Discussion'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
