import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import {
    HiUser, HiKey, HiBell, HiShieldCheck,
    HiPencilAlt, HiClock, HiCamera, HiCheckCircle, HiMail,
    HiSparkles, HiX, HiUpload, HiUserAdd, HiServer, HiWifi, HiDatabase
} from 'react-icons/hi';
import Avatar from '../../components/ui/Avatar';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import clsx from 'clsx';
import { updateUser } from '../../features/auth/authSlice';
import { useNotifications } from '../../hooks/useNotifications';
import { fetchAuditLogStats, fetchAdminCourses, fetchAdminUsers } from '../../services/adminApi';
import { fetchInstructorStats } from '../../services/instructorApi';
import { fetchDashboardStats, fetchMyProfile, updateMyAvatar, updateMyPassword, updateMyProfile } from '../../services/learnerApi';

const sora = { fontFamily: "'Sora', sans-serif" };
const mono = { fontFamily: "'DM Mono', monospace" };
const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://127.0.0.1:5000';

const buildAssetUrl = (value) => {
    if (!value) return '';
    if (/^https?:\/\//i.test(value)) return value;
    return `${API_BASE}${value}`;
};

export default function ProfilePage() {
    const { user } = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    const fileInputRef = useRef(null);
    const activeRole = String(user?.role || 'learner').toLowerCase();
    const { notifications, handleMarkRead, handleMarkAllRead } = useNotifications();
    const [activeTab, setActiveTab] = useState('profile');
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
    const [isLoadingInsights, setIsLoadingInsights] = useState(true);
    const [backupData, setBackupData] = useState(null);
    const [summaryCards, setSummaryCards] = useState([]);
    const [profileData, setProfileData] = useState({
        name: '',
        email: '',
        focus: '',
        timezone: '',
        bio: '',
        avatar: '',
    });
    const [passwords, setPasswords] = useState({ current: '', new: '', verify: '' });

    const tabs = [
        { key: 'profile', label: 'Personal Info', icon: <HiUser /> },
        { key: 'security', label: 'Security', icon: <HiKey /> },
        { key: 'notifications', label: 'Notifications', icon: <HiBell /> },
    ];

    useEffect(() => {
        const hydrateProfile = async () => {
            try {
                const data = await fetchMyProfile();
                const nextProfile = {
                    name: data?.name || user?.name || '',
                    email: data?.email || user?.email || '',
                    focus: data?.focus || '',
                    timezone: data?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Calcutta',
                    bio: data?.bio || '',
                    avatar: data?.avatar || user?.avatar || '',
                };

                setProfileData(nextProfile);
                dispatch(updateUser(nextProfile));
            } catch {
                setProfileData({
                    name: user?.name || '',
                    email: user?.email || '',
                    focus: user?.focus || '',
                    timezone: user?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Calcutta',
                    bio: user?.bio || '',
                    avatar: user?.avatar || '',
                });
            }
        };

        hydrateProfile();
    }, [dispatch]);

    useEffect(() => {
        let active = true;

        const loadInsights = async () => {
            setIsLoadingInsights(true);
            try {
                if (activeRole === 'admin') {
                    const [auditStats, users, courses] = await Promise.all([
                        fetchAuditLogStats(),
                        fetchAdminUsers(),
                        fetchAdminCourses(),
                    ]);

                    if (!active) return;
                    setSummaryCards([
                        {
                            id: 'admin-users',
                            title: 'Platform Users',
                            value: Array.isArray(users) ? users.length : 0,
                            icon: <HiUserAdd className="w-5 h-5" />,
                            note: 'Live accounts across the platform',
                        },
                        {
                            id: 'admin-courses',
                            title: 'Moderated Courses',
                            value: Array.isArray(courses) ? courses.length : 0,
                            icon: <HiUpload className="w-5 h-5" />,
                            note: 'Courses currently in the catalog',
                        },
                        {
                            id: 'admin-security',
                            title: 'Security Events',
                            value: auditStats?.security || 0,
                            icon: <HiShieldCheck className="w-5 h-5" />,
                            note: 'Tracked by the audit log service',
                        },
                        {
                            id: 'admin-system',
                            title: 'System Events',
                            value: auditStats?.system || 0,
                            icon: <HiServer className="w-5 h-5" />,
                            note: 'Infrastructure activity recorded live',
                        },
                    ]);
                    return;
                }

                if (activeRole === 'instructor') {
                    const stats = await fetchInstructorStats();
                    if (!active) return;
                    setSummaryCards([
                        {
                            id: 'instructor-enrollments',
                            title: 'Total Enrollments',
                            value: stats?.totalEnrollments || 0,
                            icon: <HiUser className="w-5 h-5" />,
                            note: 'Students across your courses',
                        },
                        {
                            id: 'instructor-pending',
                            title: 'Pending Grading',
                            value: stats?.pendingGrading || 0,
                            icon: <HiCheckCircle className="w-5 h-5" />,
                            note: 'Submissions waiting for review',
                        },
                        {
                            id: 'instructor-rating',
                            title: 'Average Rating',
                            value: stats?.avgRating || 0,
                            icon: <HiSparkles className="w-5 h-5" />,
                            note: 'Live rating from course feedback',
                        },
                        {
                            id: 'instructor-courses',
                            title: 'Total Courses',
                            value: stats?.totalCourses || 0,
                            icon: <HiUpload className="w-5 h-5" />,
                            note: 'Courses published or managed by you',
                        },
                    ]);
                    return;
                }

                const stats = await fetchDashboardStats();
                if (!active) return;
                setSummaryCards([
                    {
                        id: 'learner-enrolled',
                        title: 'Enrolled Courses',
                        value: stats?.enrolledCourses || 0,
                        icon: <HiUpload className="w-5 h-5" />,
                        note: 'Courses currently linked to your account',
                    },
                    {
                        id: 'learner-completed',
                        title: 'Completed Courses',
                        value: stats?.completedCourses || 0,
                        icon: <HiCheckCircle className="w-5 h-5" />,
                        note: 'Finished learning paths',
                    },
                    {
                        id: 'learner-certificates',
                        title: 'Certificates',
                        value: stats?.certificates || 0,
                        icon: <HiSparkles className="w-5 h-5" />,
                        note: 'Certificates earned so far',
                    },
                    {
                        id: 'learner-score',
                        title: 'Average Score',
                        value: stats?.avgScore || 0,
                        icon: <HiClock className="w-5 h-5" />,
                        note: 'Average across your quiz attempts',
                    },
                ]);
            } catch {
                if (active) {
                    setSummaryCards([]);
                }
            } finally {
                if (active) {
                    setIsLoadingInsights(false);
                }
            }
        };

        loadInsights();

        return () => {
            active = false;
        };
    }, [activeRole]);

    const unreadNotifications = notifications.filter((notification) => notification.unread);

    const handleEdit = () => {
        setBackupData({ ...profileData });
        setIsEditing(true);
    };

    const handleDiscard = () => {
        if (backupData) {
            setProfileData(backupData);
        }
        setIsEditing(false);
        toast('Changes discarded', { icon: '↩' });
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const updated = await updateMyProfile({
                name: profileData.name.trim(),
                email: profileData.email.trim(),
                focus: profileData.focus.trim(),
                timezone: profileData.timezone.trim(),
                bio: profileData.bio.trim(),
            });

            const nextProfile = {
                name: updated?.name || profileData.name.trim(),
                email: updated?.email || profileData.email.trim(),
                focus: updated?.focus || profileData.focus.trim(),
                timezone: updated?.timezone || profileData.timezone.trim(),
                bio: updated?.bio || profileData.bio.trim(),
                avatar: updated?.avatar || profileData.avatar,
            };

            setProfileData(nextProfile);
            dispatch(updateUser(nextProfile));
            setIsEditing(false);
            toast.success('Profile updated successfully!');
        } catch (error) {
            toast.error(error.message || 'Failed to update profile');
        } finally {
            setIsSaving(false);
        }
    };

    const handleAvatarUpload = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('avatar', file);

        setIsUploadingAvatar(true);
        try {
            const updated = await updateMyAvatar(formData);
            const avatar = updated?.avatar || '';
            setProfileData((current) => ({ ...current, avatar }));
            dispatch(updateUser({ avatar }));
            toast.success('Profile photo updated successfully!');
        } catch (error) {
            toast.error(error.message || 'Failed to upload profile photo');
        } finally {
            setIsUploadingAvatar(false);
            event.target.value = '';
        }
    };

    const handleUpdatePassword = async () => {
        const { current, new: newPassword, verify } = passwords;

        if (!current || !newPassword || !verify) {
            toast.error('All password fields are required');
            return;
        }
        if (newPassword !== verify) {
            toast.error('New passwords do not match');
            return;
        }
        if (newPassword.length < 8) {
            toast.error('Password must be at least 8 characters');
            return;
        }

        setIsUpdatingPassword(true);
        try {
            await updateMyPassword({
                currentPassword: current,
                newPassword,
            });
            setPasswords({ current: '', new: '', verify: '' });
            toast.success('Password updated successfully!');
        } catch (error) {
            toast.error(error.message || 'Failed to update password');
        } finally {
            setIsUpdatingPassword(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-4 sm:p-6 md:p-8" style={sora}>
            <div className="max-w-5xl mx-auto space-y-6">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Account Settings</h1>
                    <p className="text-sm text-slate-400 font-medium">Manage your profile, security, and learning preferences.</p>
                    <p className="text-xs text-slate-400 font-medium" style={mono}>
                        Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)] gap-6 lg:gap-8 items-start">
                    <aside className="w-full lg:w-72 flex-shrink-0">
                        <div className="bg-white rounded-[24px] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
                            <div className="p-6 border-b border-slate-50 text-center space-y-4">
                                <div className="relative inline-block">
                                    <Avatar
                                        name={profileData.name}
                                        src={buildAssetUrl(profileData.avatar)}
                                        size="xl"
                                        className="ring-4 ring-slate-50 shadow-sm"
                                    />
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isUploadingAvatar}
                                        className="absolute bottom-0 right-0 p-1.5 bg-indigo-600 text-white rounded-lg border-2 border-white hover:scale-110 transition-transform shadow-lg disabled:opacity-60"
                                    >
                                        <HiCamera className="w-4 h-4" />
                                    </button>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                                        className="hidden"
                                        onChange={handleAvatarUpload}
                                    />
                                </div>
                                <div>
                                    <h3 className="text-base font-black text-slate-900 tracking-tight transition-all">{profileData.name}</h3>
                                    <Badge color="blue" variant="soft" className="mt-1 font-black uppercase text-[8px] tracking-widest px-2 py-0.5">
                                        {user?.role || 'LEARNER'} ACCESS
                                    </Badge>
                                </div>
                            </div>
                            <div className="p-2 space-y-1">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab.key}
                                        onClick={() => { setActiveTab(tab.key); setIsEditing(false); }}
                                        className={clsx(
                                            'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all',
                                            activeTab === tab.key
                                                ? 'bg-indigo-50 text-indigo-600'
                                                : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                                        )}
                                    >
                                        <span className="w-5 h-5">{tab.icon}</span>
                                        <span className="tracking-tight">{tab.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </aside>

                    <main className="min-w-0 w-full">
                        <div className="bg-white rounded-[24px] border border-slate-100 shadow-2xl shadow-indigo-100/20 p-6 md:p-8">
                            {activeTab === 'profile' && (
                                <div className="space-y-6">
                                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b border-slate-50 pb-4">
                                        <div>
                                            <h2 className="text-xl font-black text-slate-900 tracking-tight">Public Profile</h2>
                                            <p className="text-sm text-slate-500">Keep your learner details organized and easy to review.</p>
                                        </div>
                                        {!isEditing ? (
                                            <Button onClick={handleEdit} variant="outline" size="sm" className="rounded-lg" icon={<HiPencilAlt />}>
                                                Edit
                                            </Button>
                                        ) : (
                                            <button onClick={handleDiscard} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">
                                                <HiX className="w-5 h-5" />
                                            </button>
                                        )}
                                    </div>

                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-4 items-stretch">
                                            {summaryCards.map((card) => (
                                                <LiveStatCard
                                                    key={card.id}
                                                    icon={card.icon}
                                                    title={card.title}
                                                    value={card.value}
                                                    note={card.note}
                                                />
                                            ))}
                                            {!summaryCards.length && isLoadingInsights && (
                                                <div className="sm:col-span-2 2xl:col-span-4 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-5 text-sm font-medium text-slate-500">
                                                    Loading live profile insights...
                                                </div>
                                            )}
                                        </div>
                                        <section className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5 md:p-6 space-y-4">
                                            <div>
                                                <h3 className="text-sm font-black text-slate-900 tracking-tight">Basic Details</h3>
                                                <p className="mt-1 text-xs font-medium text-slate-500">These details appear across your account and course spaces.</p>
                                            </div>
                                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                                <EditableGroup
                                                    label="Full Name"
                                                    value={profileData.name}
                                                    isEditing={isEditing}
                                                    onChange={(value) => setProfileData((current) => ({ ...current, name: value }))}
                                                />
                                                <EditableGroup
                                                    label="Email Address"
                                                    value={profileData.email}
                                                    isEditing={isEditing}
                                                    onChange={(value) => setProfileData((current) => ({ ...current, email: value }))}
                                                />
                                            </div>
                                        </section>
                                        <section className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5 md:p-6 space-y-4">
                                            <div>
                                                <h3 className="text-sm font-black text-slate-900 tracking-tight">Preferences</h3>
                                                <p className="mt-1 text-xs font-medium text-slate-500">Keep your focus and timezone aligned with your study routine.</p>
                                            </div>
                                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                                <EditableGroup
                                                    label={activeRole === 'instructor' ? 'Teaching Focus' : 'Learning Focus'}
                                                    value={profileData.focus}
                                                    isEditing={isEditing}
                                                    onChange={(value) => setProfileData((current) => ({ ...current, focus: value }))}
                                                />
                                                <EditableGroup
                                                    label="Timezone"
                                                    value={profileData.timezone}
                                                    isEditing={isEditing}
                                                    onChange={(value) => setProfileData((current) => ({ ...current, timezone: value }))}
                                                />
                                            </div>
                                        </section>
                                        <section className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5 md:p-6 space-y-4">
                                            <div>
                                                <h3 className="text-sm font-black text-slate-900 tracking-tight">Bio</h3>
                                                <p className="mt-1 text-xs font-medium text-slate-500">A short introduction helps personalize your profile.</p>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">About You</label>
                                                {isEditing ? (
                                                    <textarea
                                                        className="w-full bg-white border border-indigo-100 rounded-xl p-4 text-sm font-medium focus:ring-4 focus:ring-indigo-500/10 focus:outline-none transition-all min-h-[120px]"
                                                        value={profileData.bio}
                                                        onChange={(event) => setProfileData((current) => ({ ...current, bio: event.target.value }))}
                                                    />
                                                ) : (
                                                    <div className="bg-white border border-slate-100 rounded-xl p-4 text-sm font-medium text-slate-500 min-h-[120px]">
                                                        {profileData.bio || 'No bio added yet.'}
                                                    </div>
                                                )}
                                            </div>
                                        </section>
                                    </div>

                                    {isEditing && (
                                        <div className="pt-4 flex justify-end gap-3 border-t border-slate-50 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                            <button
                                                onClick={handleDiscard}
                                                disabled={isSaving}
                                                className="px-4 py-2 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
                                            >
                                                Discard
                                            </button>
                                            <Button onClick={handleSave} loading={isSaving} size="sm" className="rounded-xl px-6 py-3 font-black uppercase text-[10px] tracking-widest shadow-lg shadow-indigo-100">
                                                Save Settings
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'security' && (
                                <div className="space-y-8">
                                    <div className="border-b border-slate-50 pb-4">
                                        <h2 className="text-xl font-black text-slate-900 tracking-tight">Security</h2>
                                        <p className="mt-1 text-sm text-slate-500">Manage password access and keep your account protected.</p>
                                    </div>
                                    <div className="space-y-3 max-w-3xl">
                                        <SecurityAction
                                            icon={<HiKey />}
                                            title="Direct Password Change"
                                            desc="Update your account password by providing your current credentials."
                                            active={true}
                                        />
                                    </div>
                                    <div className="space-y-4 pt-2 max-w-3xl">
                                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            Update Password
                                        </h3>
                                        <div className="space-y-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-5 md:p-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                                                <Input
                                                    label="Current Password"
                                                    type="password"
                                                    className="rounded-xl"
                                                    value={passwords.current}
                                                    onChange={(event) => setPasswords((currentState) => ({ ...currentState, current: event.target.value }))}
                                                />
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <Input
                                                    label="New Password"
                                                    type="password"
                                                    className="rounded-xl"
                                                    value={passwords.new}
                                                    onChange={(event) => setPasswords((currentState) => ({ ...currentState, new: event.target.value }))}
                                                />
                                                <Input
                                                    label="Verify Password"
                                                    type="password"
                                                    className="rounded-xl"
                                                    value={passwords.verify}
                                                    onChange={(event) => setPasswords((currentState) => ({ ...currentState, verify: event.target.value }))}
                                                />
                                            </div>
                                            <Button
                                                onClick={handleUpdatePassword}
                                                loading={isUpdatingPassword}
                                                size="sm"
                                                className="rounded-xl w-full py-3 font-black uppercase tracking-widest text-[10px]"
                                            >
                                                Update Password
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'notifications' && (
                                <div className="space-y-8">
                                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b border-slate-50 pb-4">
                                        <div>
                                            <h2 className="text-xl font-black text-slate-900 tracking-tight">Notifications</h2>
                                            <p className="text-sm text-slate-500">
                                                {unreadNotifications.length} unread of {notifications.length} total
                                            </p>
                                        </div>
                                        <Button
                                            onClick={handleMarkAllRead}
                                            disabled={!unreadNotifications.length}
                                            variant="outline"
                                            size="sm"
                                            className="rounded-xl"
                                        >
                                            Mark All Read
                                        </Button>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-4 items-stretch">
                                        <LiveStatCard
                                            icon={<HiBell className="w-5 h-5" />}
                                            title="Total Notifications"
                                            value={notifications.length}
                                            note="Synced from the live notification service"
                                        />
                                        <LiveStatCard
                                            icon={<HiMail className="w-5 h-5" />}
                                            title="Unread"
                                            value={unreadNotifications.length}
                                            note="Items that still need your attention"
                                        />
                                        <LiveStatCard
                                            icon={<HiCheckCircle className="w-5 h-5" />}
                                            title="Read"
                                            value={Math.max(0, notifications.length - unreadNotifications.length)}
                                            note="Notifications you've already opened"
                                        />
                                        <LiveStatCard
                                            icon={<HiClock className="w-5 h-5" />}
                                            title="Latest Activity"
                                            value={notifications[0]?.time || 'No activity'}
                                            note="Most recent notification timestamp"
                                        />
                                    </div>

                                    <div className="space-y-4">
                                        {!notifications.length && (
                                            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-5 py-8 text-center text-sm font-medium text-slate-500">
                                                No live notifications yet.
                                            </div>
                                        )}
                                        {notifications.map((notification) => (
                                            <NotificationTimelineRow
                                                key={notification.id}
                                                notification={notification}
                                                onMarkRead={handleMarkRead}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}

function EditableGroup({ label, value, isEditing, onChange }) {
    return (
        <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
            {isEditing ? (
                <input
                    className="w-full bg-indigo-50/10 border border-indigo-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:bg-white focus:outline-none transition-all"
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                />
            ) : (
                <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700">
                    {value || 'Not set'}
                </div>
            )}
        </div>
    );
}

function SecurityAction({ icon, title, desc, active, btnText }) {
    return (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100 group hover:bg-white hover:shadow-sm transition-all">
            <div className="flex gap-4 min-w-0">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-500 shadow-sm transition-all group-hover:bg-indigo-600 group-hover:text-white">
                    {icon}
                </div>
                <div className="min-w-0">
                    <h4 className="text-sm font-black text-slate-900 tracking-tight">{title}</h4>
                    <p className="text-[11px] text-slate-400 font-medium">{desc}</p>
                </div>
            </div>
            {active ? (
                <Badge color="green" variant="glass" className="self-start sm:self-auto font-black text-[7px] uppercase tracking-widest">ACTIVE</Badge>
            ) : (
                btnText && <div className="self-start sm:self-auto text-[9px] font-black text-indigo-600 uppercase transition-all">{btnText}</div>
            )}
        </div>
    );
}

function LiveStatCard({ icon, title, value, note }) {
    return (
        <div className="h-full rounded-2xl border border-slate-100 bg-slate-50/80 p-4 flex flex-col">
            <div className="flex items-center justify-between gap-3">
                <div className="w-11 h-11 rounded-2xl bg-white text-indigo-600 shadow-sm flex items-center justify-center">
                    {icon}
                </div>
                <div className="text-right">
                    <p className="text-2xl font-black text-slate-900">{value}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{title}</p>
                </div>
            </div>
            <p className="mt-3 text-xs font-medium text-slate-500">{note}</p>
        </div>
    );
}

function NotificationTimelineRow({ notification, onMarkRead }) {
    const typeTone = {
        general: 'bg-slate-100 text-slate-700',
        message: 'bg-blue-100 text-blue-700',
        course: 'bg-emerald-100 text-emerald-700',
        security: 'bg-rose-100 text-rose-700',
        enrollment: 'bg-amber-100 text-amber-700',
    };

    return (
        <div className={clsx(
            'rounded-2xl border px-5 py-4 transition-all',
            notification.unread ? 'border-indigo-200 bg-indigo-50/60' : 'border-slate-100 bg-white'
        )}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-2">
                    <div className="flex items-center gap-3 flex-wrap">
                        <h4 className="text-sm font-black text-slate-900 tracking-tight">{notification.title}</h4>
                        <span className={clsx('rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest', typeTone[notification.type] || typeTone.general)}>
                            {notification.type || 'general'}
                        </span>
                        {notification.unread && (
                            <Badge color="blue" variant="soft" className="font-black text-[8px] uppercase tracking-widest">
                                Unread
                            </Badge>
                        )}
                    </div>
                    <p className="text-sm font-medium text-slate-600">{notification.message}</p>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                        {notification.time || 'Just now'}
                    </p>
                </div>
                {!notification.read && (
                    <Button size="sm" variant="outline" className="rounded-xl self-start" onClick={() => onMarkRead(notification.id)}>
                        Mark Read
                    </Button>
                )}
            </div>
        </div>
    );
}
