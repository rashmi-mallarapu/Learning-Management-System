import { useState } from 'react';
import { HiThumbUp, HiReply, HiCheckCircle, HiX, HiPlus } from 'react-icons/hi';
import clsx from 'clsx';
import Button from '../ui/Button';

export default function DiscussionList({
    discussions = [],
    loading = false,
    error = null,
    sortBy = 'latest',
    onSortChange = () => {},
    onSelectDiscussion = () => {},
    onCreateNew = () => {},
}) {
    const [selectedTags, setSelectedTags] = useState([]);

    // Get unique tags from all discussions
    const allTags = [...new Set(discussions.flatMap(d => d.tags || []))];

    // Filter discussions by selected tags
    const filteredDiscussions = selectedTags.length > 0
        ? discussions.filter(d => selectedTags.some(tag => d.tags?.includes(tag)))
        : discussions;

    const toggleTag = (tag) => {
        setSelectedTags(prev =>
            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-rose-50 border border-rose-200 p-4 rounded-lg text-rose-700 text-sm">
                <p className="font-medium">Failed to load discussions</p>
                <p className="text-xs mt-1">{error}</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-text-primary">Discussion Forum</h3>
                <Button
                    size="sm"
                    className="bg-primary-600 text-white hover:bg-primary-700 flex items-center gap-2"
                    onClick={onCreateNew}
                >
                    <HiPlus className="w-4 h-4" /> New Question
                </Button>
            </div>

            {/* Filters & Sort */}
            <div className="space-y-3">
                {/* Sort */}
                <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold text-text-muted">Sort by:</label>
                    <select
                        value={sortBy}
                        onChange={(e) => onSortChange(e.target.value)}
                        className="text-xs border border-surface-border rounded px-2 py-1 focus:ring-2 focus:ring-primary-500"
                    >
                        <option value="latest">Latest</option>
                        <option value="upvoted">Most Upvoted</option>
                    </select>
                </div>

                {/* Tags */}
                {allTags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {allTags.map(tag => (
                            <button
                                key={tag}
                                onClick={() => toggleTag(tag)}
                                className={clsx(
                                    'text-xs px-2 py-1 rounded transition-all',
                                    selectedTags.includes(tag)
                                        ? 'bg-primary-600 text-white'
                                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                                )}
                            >
                                {tag}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Discussions List */}
            {filteredDiscussions.length === 0 ? (
                <div className="text-center py-8">
                    <p className="text-text-muted">
                        {discussions.length === 0
                            ? 'No discussions yet. Be the first to ask a question!'
                            : 'No discussions match the selected filters.'}
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredDiscussions.map(discussion => (
                        <div
                            key={discussion._id}
                            className="border border-surface-border rounded-lg p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                            onClick={() => onSelectDiscussion(discussion)}
                        >
                            <div className="flex items-start justify-between gap-3">
                                {/* Main content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-2">
                                        <h4 className="text-sm font-semibold text-text-primary truncate">
                                            {discussion.title}
                                        </h4>
                                        {discussion.isResolved && (
                                            <HiCheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                                        )}
                                    </div>

                                    <p className="text-xs text-text-muted line-clamp-2 mb-3">
                                        {discussion.content}
                                    </p>

                                    {/* Tags */}
                                    {discussion.tags && discussion.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mb-2">
                                            {discussion.tags.map(tag => (
                                                <span
                                                    key={tag}
                                                    className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded"
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {/* Meta info */}
                                    <p className="text-xs text-text-muted">
                                        by {discussion.userId?.name || 'Anonymous'} •{' '}
                                        {new Date(discussion.createdAt).toLocaleDateString()}
                                    </p>
                                </div>

                                {/* Stats */}
                                <div className="flex items-center gap-4 text-xs text-text-muted flex-shrink-0">
                                    <div className="flex items-center gap-1">
                                        <HiThumbUp className="w-4 h-4" />
                                        <span className="font-semibold">{discussion.upvotes || 0}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <HiReply className="w-4 h-4" />
                                        <span className="font-semibold">{discussion.replyCount || 0}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
