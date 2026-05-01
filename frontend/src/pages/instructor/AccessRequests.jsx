import { useEffect, useState } from 'react';
import { HiCheck, HiX, HiMail, HiChatAlt2, HiClock } from 'react-icons/hi';
import toast from 'react-hot-toast';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { approveMessageAccessRequest, fetchIncomingMessageAccessRequests, rejectMessageAccessRequest } from '../../services/instructorApi';

export default function AccessRequests() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);

    useEffect(() => {
        fetchIncomingMessageAccessRequests()
            .then((data) => setRequests(Array.isArray(data) ? data : []))
            .catch((err) => toast.error(err.message || 'Failed to load access requests'))
            .finally(() => setLoading(false));
    }, []);

    const handleApprove = async (requestId) => {
        setProcessingId(requestId);
        try {
            await approveMessageAccessRequest(requestId);
            toast.success('Access approved');
            setLoading(true);
            const data = await fetchIncomingMessageAccessRequests();
            setRequests(Array.isArray(data) ? data : []);
        } catch (err) {
            toast.error(err.message || 'Failed to approve request');
        } finally {
            setLoading(false);
            setProcessingId(null);
        }
    };

    const handleReject = async (requestId) => {
        setProcessingId(requestId);
        try {
            await rejectMessageAccessRequest(requestId);
            toast.success('Access rejected');
            setLoading(true);
            const data = await fetchIncomingMessageAccessRequests();
            setRequests(Array.isArray(data) ? data : []);
        } catch (err) {
            toast.error(err.message || 'Failed to reject request');
        } finally {
            setLoading(false);
            setProcessingId(null);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-text-primary">Message Access Requests</h1>
                    <p className="text-text-secondary">Approve learners before they can message or call you.</p>
                </div>
                <Badge color="violet">{requests.length} requests</Badge>
            </div>

            {loading ? (
                <div className="flex items-center justify-center min-h-[40vh]">
                    <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : requests.length === 0 ? (
                <div className="bg-white border border-surface-border rounded-2xl p-10 text-center">
                    <HiChatAlt2 className="w-14 h-14 mx-auto text-slate-300 mb-4" />
                    <h3 className="text-lg font-semibold text-text-primary">No pending requests</h3>
                    <p className="text-sm text-text-secondary mt-1">Learners will appear here when they ask for communication access.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                    {requests.map((request) => (
                        <div key={request._id} className="bg-white border border-surface-border rounded-2xl p-6 shadow-card space-y-5">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-center gap-4 min-w-0">
                                    <Avatar name={request.learnerId?.name || 'Learner'} size="lg" />
                                    <div className="min-w-0">
                                        <h3 className="font-bold text-text-primary truncate">{request.learnerId?.name || 'Learner'}</h3>
                                        <p className="text-sm text-text-secondary truncate flex items-center gap-2">
                                            <HiMail className="shrink-0" /> {request.learnerId?.email || 'unknown@email.com'}
                                        </p>
                                    </div>
                                </div>
                                <Badge color={request.status === 'approved' ? 'green' : request.status === 'rejected' ? 'red' : 'orange'}>
                                    {request.status}
                                </Badge>
                            </div>

                            <div className="bg-surface-muted/40 rounded-xl p-4 space-y-2">
                                <div className="flex items-center gap-2 text-xs font-semibold text-text-muted uppercase tracking-widest">
                                    <HiClock /> Requested on
                                </div>
                                <p className="text-sm text-text-primary">
                                    {request.createdAt ? new Date(request.createdAt).toLocaleString() : 'Recently'}
                                </p>
                                {request.note && <p className="text-sm text-text-secondary">{request.note}</p>}
                            </div>

                            <div className="flex items-center gap-3">
                                <Button
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                    icon={<HiCheck />}
                                    onClick={() => handleApprove(request._id)}
                                    disabled={processingId === request._id || request.status === 'approved'}
                                >
                                    {request.status === 'approved' ? 'Approved' : 'Approve'}
                                </Button>
                                <Button
                                    variant="outline"
                                    className="border-rose-200 text-rose-600 hover:bg-rose-50"
                                    icon={<HiX />}
                                    onClick={() => handleReject(request._id)}
                                    disabled={processingId === request._id || request.status === 'rejected'}
                                >
                                    {request.status === 'rejected' ? 'Rejected' : 'Reject'}
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
