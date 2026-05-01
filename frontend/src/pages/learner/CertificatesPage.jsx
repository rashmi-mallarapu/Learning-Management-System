import { useEffect, useMemo, useRef, useState } from 'react';
import {
    HiAcademicCap,
    HiArrowRight,
    HiCheckCircle,
    HiClipboardCheck,
    HiDownload,
    HiLink,
    HiSparkles,
} from 'react-icons/hi';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import clsx from 'clsx';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import toast from 'react-hot-toast';
import { ROUTES } from '../../constants/routes';
import { fetchMyCertificates, fetchMyProgress, issueCertificate } from '../../services/learnerApi';

const sora = { fontFamily: "'Sora', sans-serif" };
const mono = { fontFamily: "'DM Mono', monospace" };

const CERT_GRADIENTS = [
    'from-sky-600 via-cyan-500 to-emerald-500',
    'from-amber-500 via-orange-500 to-rose-500',
    'from-slate-800 via-slate-700 to-sky-700',
];

const academyName = 'Learning Management System';

const formatDate = (value) =>
    value
        ? new Date(value).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
        : 'Recently issued';

export default function CertificatesPage() {
    const user = useSelector((state) => state.auth.user);
    const [certificates, setCertificates] = useState([]);
    const [eligibleCourses, setEligibleCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [issuingCourseId, setIssuingCourseId] = useState('');

    useEffect(() => {
        const loadCertificates = async () => {
            setLoading(true);
            try {
                const [progressData, certificatesData] = await Promise.all([
                    fetchMyProgress(),
                    fetchMyCertificates(),
                ]);

                const currentCertificates = Array.isArray(certificatesData) ? certificatesData : [];
                const existingCourseIds = new Set(
                    currentCertificates
                        .map((certificate) => String(certificate.courseId?._id || certificate.courseId))
                        .filter(Boolean)
                );

                const completedWithoutCertificate = (Array.isArray(progressData) ? progressData : [])
                    .filter((progress) => (progress.completionPercentage || 0) >= 100)
                    .filter((progress) => !existingCourseIds.has(String(progress.courseId?._id || progress.courseId)));

                if (completedWithoutCertificate.length > 0) {
                    const issued = await Promise.allSettled(
                        completedWithoutCertificate.map((progress) =>
                            issueCertificate(progress.courseId?._id || progress.courseId)
                        )
                    );

                    const successfulIssues = issued.filter((result) => result.status === 'fulfilled').length;
                    if (successfulIssues > 0) {
                        toast.success(`${successfulIssues} certificate${successfulIssues > 1 ? 's' : ''} unlocked.`);
                    }
                }

                const refreshedCertificates = await fetchMyCertificates();
                const refreshedCourseIds = new Set(
                    (Array.isArray(refreshedCertificates) ? refreshedCertificates : [])
                        .map((certificate) => String(certificate.courseId?._id || certificate.courseId))
                        .filter(Boolean)
                );

                setCertificates(Array.isArray(refreshedCertificates) ? refreshedCertificates : []);
                setEligibleCourses(
                    (Array.isArray(progressData) ? progressData : []).filter(
                        (progress) =>
                            (progress.completionPercentage || 0) >= 100 &&
                            !refreshedCourseIds.has(String(progress.courseId?._id || progress.courseId))
                    )
                );
            } catch (error) {
                setCertificates([]);
                setEligibleCourses([]);
                toast.error(error?.message || 'Failed to load certificates');
            } finally {
                setLoading(false);
            }
        };

        loadCertificates();
    }, []);

    const mappedCertificates = useMemo(() => {
        return certificates.map((certificate, index) => ({
            ...certificate,
            gradient: CERT_GRADIENTS[index % CERT_GRADIENTS.length],
            studentName: user?.name || certificate.userId?.name || 'Learner',
            courseTitle: certificate.courseId?.title || 'Course Completion',
            courseCategory: certificate.courseId?.category || 'Course',
            instructorName: certificate.courseId?.instructorId?.name || 'Instructor',
            verificationUrl: `${window.location.origin}${ROUTES.CERTIFICATE_VERIFY.replace(':certNumber', certificate.certificateNumber)}`,
        }));
    }, [certificates, user]);

    const handleIssueCertificate = async (courseId) => {
        setIssuingCourseId(String(courseId));
        try {
            await issueCertificate(courseId);
            const refreshedCertificates = await fetchMyCertificates();
            setCertificates(Array.isArray(refreshedCertificates) ? refreshedCertificates : []);
            setEligibleCourses((current) => current.filter((course) => String(course.courseId?._id || course.courseId) !== String(courseId)));
            toast.success('Certificate is ready to download.');
        } catch (error) {
            toast.error(error?.message || 'Failed to issue certificate');
        } finally {
            setIssuingCourseId('');
        }
    };

    return (
        <div className="p-6 md:p-8 space-y-10 max-w-6xl mx-auto" style={sora}>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Your Certificates</h1>
                    <p className="text-sm text-sky-700 font-bold">
                        Certificates unlock only when a course reaches 100% progress.
                    </p>
                </div>
                <div className="rounded-3xl border border-sky-100 bg-sky-50 px-5 py-4 text-sm text-sky-900">
                    <div className="font-black">{mappedCertificates.length} issued</div>
                    <div className="text-sky-700">{eligibleCourses.length} waiting to be claimed</div>
                </div>
            </div>

            {eligibleCourses.length > 0 && (
                <div className="rounded-[2rem] border border-emerald-100 bg-gradient-to-r from-emerald-50 via-white to-sky-50 p-6 md:p-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.35em] text-emerald-600">Eligible Now</p>
                            <h2 className="mt-2 text-2xl font-black text-slate-900">Your completed courses are ready for certification</h2>
                            <p className="mt-2 text-sm text-slate-600">
                                Lessons, quizzes, and assignments are already counted through your course progress.
                            </p>
                        </div>
                        <HiSparkles className="hidden md:block h-12 w-12 text-emerald-500" />
                    </div>
                    <div className="mt-6 grid gap-4 md:grid-cols-2">
                        {eligibleCourses.map((progress) => {
                            const courseId = progress.courseId?._id || progress.courseId;
                            return (
                                <div key={String(courseId)} className="rounded-3xl border border-white bg-white/90 p-5 shadow-sm">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <h3 className="text-lg font-black text-slate-900">{progress.courseId?.title || 'Completed Course'}</h3>
                                            <p className="mt-1 text-sm text-slate-600">Progress: {progress.completionPercentage || 0}%</p>
                                        </div>
                                        <div className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black uppercase tracking-widest text-emerald-700">
                                            Ready
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleIssueCertificate(courseId)}
                                        disabled={issuingCourseId === String(courseId)}
                                        className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-xs font-black uppercase tracking-widest text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
                                    >
                                        {issuingCourseId === String(courseId) ? 'Preparing...' : 'Generate Certificate'}
                                        <HiArrowRight className="h-4 w-4" />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {loading ? (
                <div className="rounded-[2rem] border border-slate-200 bg-white p-8 text-sm text-slate-500">Loading certificates...</div>
            ) : mappedCertificates.length === 0 ? (
                <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-12 text-center">
                    <HiAcademicCap className="mx-auto h-14 w-14 text-slate-300" />
                    <h2 className="mt-4 text-2xl font-black text-slate-900">No certificates yet</h2>
                    <p className="mt-2 text-sm text-slate-500">
                        Finish every required lesson, quiz, and assignment in a course to unlock its certificate.
                    </p>
                    <Link
                        to="/learner/my-learning"
                        className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-6 py-3 text-xs font-black uppercase tracking-widest text-white transition hover:bg-slate-800"
                    >
                        Go To My Learning
                        <HiArrowRight className="h-4 w-4" />
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {mappedCertificates.map((cert) => (
                        <CertificateCard key={cert._id} cert={cert} />
                    ))}
                </div>
            )}
        </div>
    );
}

function CertificateCard({ cert }) {
    const [downloading, setDownloading] = useState(false);
    const [copied, setCopied] = useState(false);
    const certificateRef = useRef(null);

    const handleDownload = async () => {
        setDownloading(true);

        try {
            if (!certificateRef.current) {
                throw new Error('Certificate preview not available');
            }

            const canvas = await html2canvas(certificateRef.current, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff',
            });
            const imageData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('landscape', 'mm', 'a4');
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const margin = 10;
            const availableWidth = pageWidth - margin * 2;
            const availableHeight = pageHeight - margin * 2;
            const imageRatio = canvas.width / canvas.height;
            let renderWidth = availableWidth;
            let renderHeight = renderWidth / imageRatio;

            if (renderHeight > availableHeight) {
                renderHeight = availableHeight;
                renderWidth = renderHeight * imageRatio;
            }

            const x = (pageWidth - renderWidth) / 2;
            const y = (pageHeight - renderHeight) / 2;

            pdf.addImage(imageData, 'PNG', x, y, renderWidth, renderHeight);
            const fileName = `${cert.courseTitle.replace(/\s+/g, '_')}_Certificate.pdf`;
            pdf.save(fileName);
        } catch {
            toast.error('Failed to download certificate');
        } finally {
            setDownloading(false);
        }
    };

    const handleCopyCode = () => {
        navigator.clipboard.writeText(cert.verificationUrl).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }).catch(() => {
            const textArea = document.createElement('textarea');
            textArea.value = cert.verificationUrl;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <>
            <div ref={certificateRef} className="fixed left-[-9999px] top-0 w-[1120px] bg-white text-slate-900" aria-hidden="true">
                <div className="relative overflow-hidden border-[14px] border-slate-900 p-16">
                    <div className={`absolute inset-x-0 top-0 h-5 bg-gradient-to-r ${cert.gradient}`} />
                    <div className={`absolute inset-x-0 bottom-0 h-5 bg-gradient-to-r ${cert.gradient}`} />
                    <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-sky-100/70 blur-3xl" />
                    <div className="absolute -left-20 bottom-0 h-64 w-64 rounded-full bg-emerald-100/70 blur-3xl" />

                    <div className="relative z-10 text-center space-y-8" style={sora}>
                        <p className="text-sm font-black uppercase tracking-[0.45em] text-slate-400">Certificate of Completion</p>
                        <div className="space-y-3">
                            <p className="text-lg font-semibold text-slate-500">This certifies that</p>
                            <h1 className="text-5xl font-black tracking-tight text-slate-900">{cert.studentName}</h1>
                            <p className="text-lg font-semibold text-slate-500">has successfully completed</p>
                            <h2 className="text-4xl font-black tracking-tight text-slate-900">{cert.courseTitle}</h2>
                        </div>

                        <div className="mx-auto max-w-3xl space-y-6 pt-4">
                            <p className="text-base text-slate-500">
                                All required lessons, quizzes, and assignments for this course were completed in full.
                            </p>
                            <div className="grid grid-cols-3 gap-6 pt-6">
                                <div className="rounded-3xl border border-slate-200 bg-slate-50 px-6 py-5">
                                    <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-400">Issued</p>
                                    <p className="mt-2 text-lg font-black text-slate-900">{formatDate(cert.issuedAt)}</p>
                                </div>
                                <div className="rounded-3xl border border-slate-200 bg-slate-50 px-6 py-5">
                                    <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-400">Credential ID</p>
                                    <p className="mt-2 text-lg font-black text-slate-900" style={mono}>{cert.certificateNumber}</p>
                                </div>
                                <div className="rounded-3xl border border-slate-200 bg-slate-50 px-6 py-5">
                                    <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-400">Verification</p>
                                    <p className="mt-2 text-sm font-black text-emerald-600">Available Online</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-end justify-between pt-10 text-left">
                            <div>
                                <div className="h-px w-56 bg-slate-300" />
                                <p className="mt-3 text-sm font-black uppercase tracking-[0.2em] text-slate-500">
                                    Authorized by {academyName}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Verification Link</p>
                                <p className="mt-2 text-base font-semibold text-slate-600">{cert.verificationUrl}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-sky-100/50 hover:-translate-y-2 transition-all duration-500 overflow-hidden flex flex-col group">
                <div className={`h-48 bg-gradient-to-br ${cert.gradient} relative p-8 flex flex-col justify-between overflow-hidden`}>
                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
                    <div className="absolute -left-6 bottom-6 w-28 h-28 bg-black/5 rounded-full blur-2xl" />

                    <div className="flex justify-between items-start relative z-10">
                        <div className="bg-white/90 text-[9px] font-black text-slate-900 px-4 py-1.5 rounded-full flex items-center gap-2 shadow-lg">
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                            VERIFIED
                        </div>
                        <HiAcademicCap className="w-10 h-10 text-white/30 group-hover:text-white/50 transition-colors" />
                    </div>

                    <div className="relative z-10 space-y-2">
                        <h3 className="text-xl font-black text-white leading-tight tracking-tight">{cert.courseTitle}</h3>
                        <p className="text-[10px] text-white/70 font-black uppercase tracking-[0.2em]" style={mono}>
                            Issued on {formatDate(cert.issuedAt)}
                        </p>
                    </div>
                </div>

                <div className="p-8 space-y-8 flex-1 bg-white">
                    <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                        <div className="space-y-1">
                            <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Student</p>
                            <p className="text-[11px] font-black text-slate-800">{cert.studentName}</p>
                        </div>
                        <div className="space-y-1 text-right">
                            <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Course</p>
                            <p className="text-[11px] font-black text-emerald-600">{cert.courseCategory}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Credential ID</p>
                            <p className="text-[10px] font-black text-slate-500 break-all" style={mono}>{cert.certificateNumber}</p>
                        </div>
                        <div className="space-y-1 text-right">
                            <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Instructor</p>
                            <p className="text-[11px] font-black text-slate-800">{cert.instructorName}</p>
                        </div>
                        <div className="space-y-1 col-span-2">
                            <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Validation</p>
                            <div className="flex items-center gap-1.5 text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                                <HiCheckCircle className="w-4 h-4" /> Verified by certificate number
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-slate-50 w-full" />

                    <div className="flex gap-3">
                        <button
                            onClick={handleDownload}
                            disabled={downloading}
                            className={clsx(
                                'flex-1 text-[10px] font-black uppercase tracking-widest py-3 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.95] shadow-sm',
                                downloading
                                    ? 'bg-sky-50 text-sky-500 border border-sky-100'
                                    : 'bg-slate-50 hover:bg-sky-600 hover:text-white hover:shadow-lg hover:shadow-sky-100 text-slate-600 border border-slate-100'
                            )}
                        >
                            {downloading ? (
                                <><div className="w-3 h-3 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" /> Preparing...</>
                            ) : (
                                <><HiDownload className="w-4 h-4" /> Download PDF</>
                            )}
                        </button>
                        <a
                            href={cert.verificationUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="flex-1 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-center text-[10px] font-black uppercase tracking-widest text-slate-600 transition hover:border-sky-100 hover:bg-sky-50 hover:text-sky-700"
                        >
                            Verify Online
                        </a>
                        <button
                            onClick={handleCopyCode}
                            className={clsx(
                                'p-3 rounded-2xl border transition-all active:scale-[0.95] flex items-center justify-center',
                                copied
                                    ? 'bg-emerald-50 border-emerald-100 text-emerald-500'
                                    : 'bg-slate-50 border-slate-100 text-slate-400 hover:text-sky-600 hover:bg-sky-50 hover:border-sky-100'
                            )}
                        >
                            {copied ? <HiClipboardCheck className="w-5 h-5" /> : <HiLink className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
