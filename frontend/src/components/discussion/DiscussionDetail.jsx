import { useState } from 'react';
import { HiThumbUp, HiX, HiCheckCircle, HiTrash } from 'react-icons/hi';
import clsx from 'clsx';
import Button from '../ui/Button';
import toast from 'react-hot-toast';

export default function DiscussionDetail({
    discussion,
    replies = [],
    currentUserId,
    currentUserRole,
    loading = false,
    repliesLoading = false,
    onBack = () => {},
    onAddReply = () => {},
    onUpvoteReply = () => {},
    onMarkBestAnswer = () => {},
    onDeleteReply = () => {},
    onUpvoteDiscussion = () => {},
    onResolveDiscussion = () => {},
    onDeleteDiscussion = () => {},
}) {
    const [replyContent, setReplyContent] = useState('');
    const [replySaving, setReplySaving] = useState(false);

    const isDiscussionOwner = String(discussion?.userId?._id) === String(currentUserId);
    const isInstructor = currentUserRole === 'instructor' || currentUserRole === 'admin';
    const canMarkBestAnswer = isDiscussionOwner || isInstructor;

    const handleAddReply = async () => {
        if (!replyContent.trim()) {
            toast.error('Please write a reply');
            return;
        }

        setReplySaving(true);
        try {
            await onAddReply(discussion._id, replyContent);
            setReplyContent('');
            toast.success('Reply posted successfully');
        } catch (err) {
            toast.error(err?.message || 'Failed to post reply');
        } finally {
            setReplySaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!discussion) {
        return (
            <div className="text-center py-8">
                <p className="text-text-muted">Discussion not found</p>
                <Button size="sm" className="mt-4" onClick={onBack}>
                    Back to Discussions
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Back Button */}
            <button
                onClick={onBack}
                className="flex items-center gap-2 text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
                <HiX className="w-4 h-4 rotate-45" /> Back to Discussions
            </button>

            {/* Discussion Header */}
            <div className="border border-surface-border rounded-lg p-6 bg-white space-y-4">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <h2 className="text-2xl font-bold text-text-primary">{discussion.title}</h2>
                            {discussion.isResolved && (
                                <HiCheckCircle className="w-5 h-5 text-green-600" />
                            )}
                        </div>

                        <div className="flex items-center gap-2 text-sm text-text-muted">
                            <span>by {discussion.userId?.name || 'Anonymous'}</span>
                            <span>•</span>
                            <span>{new Date(discussion.createdAt).toLocaleDateString()}</span>
                        </div>
                    </div>

                    {isDiscussionOwner && (
                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                className={clsx(
                                    discussion.isResolved
                                        ? 'border-green-200 text-green-700'
                                        : 'border-slate-200 text-slate-700'
                                )}
                                onClick={() => onResolveDiscussion(discussion._id)}
                            >
                                {discussion.isResolved ? 'Unresolve' : 'Mark Resolved'}
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                className="border-rose-200 text-rose-700 hover:bg-rose-50"
                                onClick={() => {
                                    if (confirm('Delete this discussion?')) {
                                        onDeleteDiscussion(discussion._id);
                                    }
                                }}
                            >
                                <HiTrash className="w-4 h-4" />
                            </Button>
                        </div>
                    )}
                </div>

                {/* Content */}
                <p className="text-text-secondary whitespace-pre-wrap">{discussion.content}</p>

                {/* Tags */}
                {discussion.tags && discussion.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {discussion.tags.map(tag => (
                            <span
                                key={tag}
                                className="text-xs bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-4 pt-4 border-t border-surface-border">
                    <button
                        onClick={() => onUpvoteDiscussion(discussion._id)}
                        className="flex items-center gap-2 text-sm text-text-muted hover:text-primary-600 transition-colors"
                    >
                        <HiThumbUp className="w-4 h-4" />
                        <span>{discussion.upvotes || 0}</span>
                    </button>
                </div>
            </div>

            {/* Replies Section */}
            <div className="space-y-4">
                <h3 className="text-lg font-bold text-text-primary">
                    {replies.length} {replies.length === 1 ? 'Reply' : 'Replies'}
                </h3>

                {/* Add Reply */}
                <div className="border border-surface-border rounded-lg p-4 bg-slate-50 space-y-3">
                    <h4 className="text-sm font-semibold text-text-primary">Your Reply</h4>
                    <textarea
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder="Share your thoughts or provide an answer..."
                        className="w-full min-h-[100px] rounded-lg border border-surface-border p-3 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                    />
                    <div className="flex justify-end">
                        <Button
                            size="sm"
                            className="bg-primary-600 text-white hover:bg-primary-700"
                            disabled={replySaving}
                            onClick={handleAddReply}
                        >
                            {replySaving ? 'Posting...' : 'Post Reply'}
                        </Button>
                    </div>
                </div>

                {/* Replies List */}
                {repliesLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : replies.length === 0 ? (
                    <div className="text-center py-8 text-text-muted">
                        <p>No replies yet. Be the first to answer!</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {replies.map(reply => {
                            const isReplyOwner = String(reply.userId?._id) === String(currentUserId);
                            const isInstructorReply = reply.userId?.role === 'instructor' || reply.userId?.role === 'admin';

                            return (
                                <div
                                    key={reply._id}
                                    className={clsx(
                                        'border rounded-lg p-4 space-y-3',
                                        reply.isBestAnswer
                                            ? 'border-green-300 bg-green-50'
                                            : 'border-surface-border bg-white'
                                    )}
                                >
                                    {/* Header */}
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-semibold text-text-primary">
                                                    {reply.userId?.name || 'Anonymous'}
                                                </p>
                                                {isInstructorReply && (
                                                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">
                                                        Instructor
                                                    </span>
                                                )}
                                                {reply.isBestAnswer && (
                                                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded flex items-center gap-1">
                                                        <HiCheckCircle className="w-3 h-3" /> Best Answer
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-text-muted mt-1">
                                                {new Date(reply.createdAt).toLocaleDateString()} •{' '}
                                                {new Date(reply.createdAt).toLocaleTimeString()}
                                            </p>
                                        </div>

                                        {isReplyOwner && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="border-rose-200 text-rose-700 hover:bg-rose-50"
                                                onClick={() => {
                                                    if (confirm('Delete this reply?')) {
                                                        onDeleteReply(reply._id);
                                                    }
                                                }}
                                            >
                                                <HiTrash className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <p className="text-text-secondary whitespace-pre-wrap text-sm">{reply.content}</p>

                                    {/* Actions */}
                                    <div className="flex items-center gap-4 pt-3 border-t border-surface-border">
                                        <button
                                            onClick={() => onUpvoteReply(reply._id)}
                                            className="flex items-center gap-1 text-sm text-text-muted hover:text-primary-600 transition-colors"
                                        >
                                            <HiThumbUp className="w-4 h-4" />
                                            <span>{reply.upvotes || 0}</span>
                                        </button>

                                        {canMarkBestAnswer && !discussion.isResolved && (
                                            <button
                                                onClick={() => onMarkBestAnswer(reply._id, discussion._id)}
                                                className={clsx(
                                                    'text-sm font-medium transition-colors',
                                                    reply.isBestAnswer
                                                        ? 'text-green-600 hover:text-green-700'
                                                        : 'text-text-muted hover:text-green-600'
                                                )}
                                            >
                                                {reply.isBestAnswer ? '✓ Best Answer' : 'Mark as Best'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
