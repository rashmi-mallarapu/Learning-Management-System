import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { HiLockClosed, HiShieldCheck, HiUserGroup } from 'react-icons/hi';

import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { Table, Tbody, Td, Th, Thead, Tr } from '../../components/ui/Table';
import { ROLES } from '../../constants/roles';
import { fetchAdminUsers } from '../../services/learnerApi';

const ROLE_DEFINITIONS = [
    {
        key: ROLES.ADMIN,
        title: 'Administrator',
        permissions: ['Full platform oversight', 'Role assignment', 'Course moderation', 'System access'],
        badge: 'emerald',
    },
    {
        key: ROLES.INSTRUCTOR,
        title: 'Instructor',
        permissions: ['Create courses', 'Grade submissions', 'Manage learners', 'Publish content'],
        badge: 'violet',
    },
    {
        key: ROLES.LEARNER,
        title: 'Learner',
        permissions: ['Enroll in courses', 'Attempt quizzes', 'View grades', 'Join discussions'],
        badge: 'slate',
    },
];

export default function RoleManagement() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let active = true;

        fetchAdminUsers()
            .then((data) => {
                if (!active) return;
                setUsers(Array.isArray(data) ? data : []);
                setError('');
            })
            .catch((err) => {
                if (!active) return;
                setError(err.message || 'Failed to load roles');
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => {
            active = false;
        };
    }, []);

    const roleRows = useMemo(() => {
        return ROLE_DEFINITIONS.map((role) => ({
            ...role,
            users: users.filter((user) => user.role === role.key).length,
        }));
    }, [users]);

    return (
        <div className="space-y-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                <div>
                    <h1 className="text-3xl font-black text-slate-900">Roles & Permissions</h1>
                    <p className="text-slate-500 mt-2">
                        Existing platform roles are now tied to live user counts so admins can manage instructor and learner access with confidence.
                    </p>
                </div>
                <Button
                    className="bg-violet-600 hover:bg-violet-700 text-white border-none"
                    icon={<HiShieldCheck />}
                    onClick={() => toast.success('Use User Management to reassign learners, instructors, and admins.')}
                >
                    Reassignment Guide
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {roleRows.map((role) => (
                    <div key={role.key} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                        <div className="flex items-center justify-between">
                            <div className="w-11 h-11 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center">
                                <HiUserGroup className="w-5 h-5" />
                            </div>
                            <Badge color={role.badge}>{role.key}</Badge>
                        </div>
                        <p className="text-2xl font-black text-slate-900 mt-4">{role.users}</p>
                        <p className="font-bold text-slate-800 mt-1">{role.title}</p>
                    </div>
                ))}
            </div>

            {error && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
                    {error}
                </div>
            )}

            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <Table>
                    <Thead>
                        <Th>Role</Th>
                        <Th>Assigned Users</Th>
                        <Th>Core Permissions</Th>
                        <Th align="right">Actions</Th>
                    </Thead>
                    <Tbody>
                        {loading ? (
                            <Tr>
                                <Td colSpan={4} className="py-10 text-slate-500">Loading role data...</Td>
                            </Tr>
                        ) : roleRows.map((role) => (
                            <Tr key={role.key}>
                                <Td>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center">
                                            <HiShieldCheck className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900">{role.title}</p>
                                            <p className="text-xs text-slate-500 uppercase tracking-[0.18em]">{role.key}</p>
                                        </div>
                                    </div>
                                </Td>
                                <Td>
                                    <span className="font-bold text-slate-900">{role.users}</span>
                                </Td>
                                <Td>
                                    <div className="flex flex-wrap gap-2">
                                        {role.permissions.map((permission) => (
                                            <span key={permission} className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold border border-slate-200">
                                                {permission}
                                            </span>
                                        ))}
                                    </div>
                                </Td>
                                <Td className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            icon={<HiLockClosed />}
                                            onClick={() => toast.success(`${role.title} permissions are active.`)}
                                        >
                                            View Access
                                        </Button>
                                        <Button
                                            size="sm"
                                            className="bg-slate-900 text-white hover:bg-slate-800 border-none"
                                            onClick={() => toast.success('Update role assignments from User Management.')}
                                        >
                                            Manage Members
                                        </Button>
                                    </div>
                                </Td>
                            </Tr>
                        ))}
                    </Tbody>
                </Table>
            </div>
        </div>
    );
}
