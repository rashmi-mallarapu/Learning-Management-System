import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { HiMail, HiRefresh, HiSearch, HiShieldCheck, HiUsers } from 'react-icons/hi';

import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Pagination from '../../components/ui/Pagination';
import SearchBar from '../../components/ui/SearchBar';
import Select from '../../components/ui/Select';
import { Table, Tbody, Td, Th, Thead, Tr } from '../../components/ui/Table';
import { ROLES } from '../../constants/roles';
import { ROUTES } from '../../constants/routes';
import { fetchAdminUsers, updateAdminUserRole } from '../../services/learnerApi';

const ITEMS_PER_PAGE = 8;

const roleOptions = [
    { label: 'All Roles', value: 'all' },
    { label: 'Learner', value: ROLES.LEARNER },
    { label: 'Instructor', value: ROLES.INSTRUCTOR },
    { label: 'Admin', value: ROLES.ADMIN },
];

const assignableRoleOptions = [
    { label: 'Learner', value: ROLES.LEARNER },
    { label: 'Instructor', value: ROLES.INSTRUCTOR },
    { label: 'Admin', value: ROLES.ADMIN },
];

const formatDate = (value) =>
    value
        ? new Date(value).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        })
        : 'N/A';

export default function UserManagement() {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [updatingUserId, setUpdatingUserId] = useState('');

    const loadUsers = async () => {
        try {
            setLoading(true);
            const data = await fetchAdminUsers({
                role: roleFilter === 'all' ? undefined : roleFilter,
                search: search || undefined,
            });
            setUsers(Array.isArray(data) ? data : []);
            setError('');
        } catch (err) {
            setError(err.message || 'Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            loadUsers();
        }, 200);

        return () => clearTimeout(timer);
    }, [roleFilter, search]);

    const filteredUsers = useMemo(() => users, [users]);
    const totalPages = Math.max(1, Math.ceil(filteredUsers.length / ITEMS_PER_PAGE));
    const paginatedUsers = filteredUsers.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

    useEffect(() => {
        setPage(1);
    }, [roleFilter, search]);

    const handleRoleChange = async (user, nextRole) => {
        if (user.role === nextRole) return;

        try {
            setUpdatingUserId(user._id);
            const updatedUser = await updateAdminUserRole(user._id, nextRole);
            setUsers((current) => current.map((entry) => (entry._id === user._id ? updatedUser : entry)));
            toast.success(`${user.name} is now ${nextRole}.`);
        } catch (err) {
            toast.error(err.message || 'Role update failed');
        } finally {
            setUpdatingUserId('');
        }
    };

    const userCounts = useMemo(() => ({
        total: users.length,
        learners: users.filter((user) => user.role === ROLES.LEARNER).length,
        instructors: users.filter((user) => user.role === ROLES.INSTRUCTOR).length,
        admins: users.filter((user) => user.role === ROLES.ADMIN).length,
    }), [users]);

    return (
        <div className="space-y-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                <div>
                    <h1 className="text-3xl font-black text-slate-900">User Management</h1>
                    <p className="text-slate-500 mt-2">
                        Review learners and instructors, promote accounts when needed, and jump into admin messaging from the existing workspace.
                    </p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <Button variant="outline" icon={<HiRefresh />} onClick={loadUsers}>
                        Refresh
                    </Button>
                    <Button
                        className="bg-violet-600 hover:bg-violet-700 text-white border-none"
                        icon={<HiMail />}
                        onClick={() => navigate(ROUTES.ADMIN_MESSAGES)}
                    >
                        Open Messages
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                <CountCard label="Visible Users" value={userCounts.total} />
                <CountCard label="Learners" value={userCounts.learners} />
                <CountCard label="Instructors" value={userCounts.instructors} />
                <CountCard label="Admins" value={userCounts.admins} />
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 md:p-5">
                <div className="flex flex-col xl:flex-row gap-4 xl:items-center">
                    <SearchBar
                        value={search}
                        onChange={setSearch}
                        onClear={() => setSearch('')}
                        placeholder="Search by name or email..."
                        className="w-full xl:max-w-md"
                    />
                    <div className="w-full xl:w-56">
                        <Select value={roleFilter} onChange={setRoleFilter} options={roleOptions} />
                    </div>
                    <div className="ml-auto text-sm text-slate-500 flex items-center gap-2">
                        <HiSearch className="w-4 h-4" />
                        Admin can manage learner and instructor roles here.
                    </div>
                </div>
            </div>

            {error && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
                    {error}
                </div>
            )}

            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <Table>
                    <Thead>
                        <Th>User</Th>
                        <Th>Current Role</Th>
                        <Th>Joined</Th>
                        <Th>Assign Role</Th>
                        <Th align="right">Actions</Th>
                    </Thead>
                    <Tbody>
                        {loading ? (
                            <Tr>
                                <Td className="py-10 text-slate-500" colSpan={5}>Loading users...</Td>
                            </Tr>
                        ) : paginatedUsers.length === 0 ? (
                            <Tr>
                                <Td className="py-10 text-slate-500" colSpan={5}>No users matched the current filters.</Td>
                            </Tr>
                        ) : (
                            paginatedUsers.map((user) => (
                                <Tr key={user._id}>
                                    <Td>
                                        <div className="flex items-center gap-3">
                                            <Avatar name={user.name} size="sm" />
                                            <div className="min-w-0">
                                                <p className="font-bold text-slate-900 truncate">{user.name}</p>
                                                <p className="text-xs text-slate-500 truncate">{user.email}</p>
                                            </div>
                                        </div>
                                    </Td>
                                    <Td>
                                        <Badge color={getRoleBadgeColor(user.role)}>{user.role}</Badge>
                                    </Td>
                                    <Td className="text-sm text-slate-500">{formatDate(user.createdAt)}</Td>
                                    <Td className="min-w-[180px]">
                                        <Select
                                            value={user.role}
                                            onChange={(nextRole) => handleRoleChange(user, nextRole)}
                                            options={assignableRoleOptions}
                                            className="bg-slate-50"
                                        />
                                    </Td>
                                    <Td className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                icon={<HiMail />}
                                                onClick={() =>
                                                    navigate(ROUTES.ADMIN_MESSAGES, {
                                                        state: {
                                                            selectedUser: {
                                                                id: user._id,
                                                                receiverId: user._id,
                                                                name: user.name,
                                                                role: user.role,
                                                                email: user.email,
                                                            },
                                                        },
                                                    })
                                                }
                                            >
                                                Message
                                            </Button>
                                            <Button
                                                size="sm"
                                                className="bg-slate-900 text-white hover:bg-slate-800 border-none"
                                                icon={<HiShieldCheck />}
                                                disabled={updatingUserId === user._id}
                                                onClick={() => toast.success(`Permissions for ${user.name} are controlled by role assignment.`)}
                                            >
                                                {updatingUserId === user._id ? 'Saving...' : 'Permissions'}
                                            </Button>
                                        </div>
                                    </Td>
                                </Tr>
                            ))
                        )}
                    </Tbody>
                </Table>
            </div>

            {!loading && filteredUsers.length > ITEMS_PER_PAGE && (
                <div className="flex justify-center">
                    <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
                </div>
            )}
        </div>
    );
}

function CountCard({ label, value }) {
    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-5 py-4">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{label}</p>
            <p className="text-3xl font-black text-slate-900 mt-2">{value}</p>
        </div>
    );
}

function getRoleBadgeColor(role) {
    if (role === ROLES.ADMIN) return 'emerald';
    if (role === ROLES.INSTRUCTOR) return 'violet';
    return 'slate';
}
