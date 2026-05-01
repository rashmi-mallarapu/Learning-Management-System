import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { HiBadgeCheck, HiExclamationCircle } from 'react-icons/hi';
import { verifyCertificate } from '../../services/learnerApi';

const formatDate = (value) =>
    value
        ? new Date(value).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
        : 'Unknown';

export default function CertificateVerifyPage() {
    const { certNumber } = useParams();
    const [certificate, setCertificate] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadCertificate = async () => {
            setLoading(true);
            setError('');
            try {
                const data = await verifyCertificate(certNumber);
                setCertificate(data);
            } catch (err) {
                setCertificate(null);
                setError(err?.message || 'Certificate could not be verified');
            } finally {
                setLoading(false);
            }
        };

        loadCertificate();
    }, [certNumber]);

    return (
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.18),_transparent_32%),linear-gradient(180deg,#f8fafc_0%,#e2e8f0_100%)] px-6 py-12">
            <div className="mx-auto max-w-4xl">
                <div className="rounded-[2rem] border border-white/80 bg-white/90 p-8 shadow-2xl shadow-slate-200/70 backdrop-blur">
                    <p className="text-xs font-black uppercase tracking-[0.35em] text-sky-600">Certificate Verification</p>

                    {loading ? (
                        <div className="mt-6 text-sm text-slate-500">Checking certificate...</div>
                    ) : error ? (
                        <div className="mt-6 rounded-3xl border border-rose-100 bg-rose-50 p-6">
                            <div className="flex items-center gap-3 text-rose-700">
                                <HiExclamationCircle className="h-8 w-8" />
                                <div>
                                    <h1 className="text-2xl font-black">Certificate not verified</h1>
                                    <p className="mt-1 text-sm">{error}</p>
                                </div>
                            </div>
                            <p className="mt-4 text-sm text-rose-700">
                                If this link was shared with you, please confirm the certificate number with the learner or issuer.
                            </p>
                        </div>
                    ) : (
                        <div className="mt-6 space-y-6">
                            <div className="flex items-center gap-3 text-emerald-700">
                                <HiBadgeCheck className="h-10 w-10" />
                                <div>
                                    <h1 className="text-3xl font-black text-slate-900">This certificate is valid</h1>
                                    <p className="text-sm text-slate-600">The credential number matches a real certificate issued by the platform.</p>
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                                    <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-400">Student Name</p>
                                    <p className="mt-2 text-xl font-black text-slate-900">{certificate?.userId?.name || 'Learner'}</p>
                                </div>
                                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                                    <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-400">Course Completed</p>
                                    <p className="mt-2 text-xl font-black text-slate-900">{certificate?.courseId?.title || 'Course'}</p>
                                </div>
                                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                                    <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-400">Certificate Number</p>
                                    <p className="mt-2 text-lg font-black text-slate-900 break-all">{certificate?.certificateNumber}</p>
                                </div>
                                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                                    <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-400">Issued On</p>
                                    <p className="mt-2 text-lg font-black text-slate-900">{formatDate(certificate?.issuedAt)}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <Link
                        to="/"
                        className="mt-8 inline-flex rounded-2xl bg-slate-900 px-5 py-3 text-xs font-black uppercase tracking-widest text-white transition hover:bg-slate-800"
                    >
                        Return To Platform
                    </Link>
                </div>
            </div>
        </div>
    );
}
