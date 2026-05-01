import { useState, useMemo, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
    HiTerminal, HiSearch, HiFilter, HiTrash,
    HiDatabase, HiShieldCheck, HiCog, HiExclamationCircle,
    HiChevronRight, HiDownload, HiCalendar, HiKey,
    HiUser, HiOutlineShieldCheck, HiDotsVertical,
    HiEye, HiRefresh, HiBookOpen
} from 'react-icons/hi';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { Table, Thead, Tbody, Th, Tr, Td } from '../../components/ui/Table';
import Select from '../../components/ui/Select';
import { fetchAuditLogs, fetchAuditLogStats, clearAuditLogs } from '../../services/adminApi';

const SOURCE_CONFIG = {
    auth: { color: 'bg-violet-100 text-violet-700', icon: HiKey },
    system: { color: 'bg-slate-100 text-slate-700', icon: HiCog },
    mod: { color: 'bg-blue-100 text-blue-700', icon: HiUser },
    security: { color: 'bg-rose-100 text-rose-700', icon: HiOutlineShieldCheck },
    content: { color: 'bg-emerald-100 text-emerald-700', icon: HiBookOpen },
};

const PRIORITY_CONFIG = {
    low: { color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
    medium: { color: 'text-amber-700 bg-amber-50 border-amber-200' },
    high: { color: 'text-rose-700 bg-rose-50 border-rose-200' },
};

// Format a MongoDB ISO timestamp to a relative "time ago" string
function timeAgo(dateStr) {
    if (!dateStr) return '—';
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function SystemLogs() {
    const [logs, setLogs] = useState([]);
    const [stats, setStats] = useState({ total: 0, security: 0, failedLogins: 0, system: 0 });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterSeverity, setFilterSeverity] = useState('All');
    const [filterSource, setFilterSource] = useState('All');
    const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1, limit: 50 });

    // ── Fetch live data from the backend ──
    const loadLogs = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const params = { page, limit: 50 };
            if (filterSeverity !== 'All') params.severity = filterSeverity;
            if (filterSource !== 'All') params.type = filterSource;
            if (search.trim()) params.search = search.trim();

            const [logsRes, statsRes] = await Promise.all([
                fetchAuditLogs(params),
                fetchAuditLogStats(),
            ]);

            setLogs(logsRes.data || []);
            setPagination(logsRes.pagination || { total: 0, page: 1, totalPages: 1, limit: 50 });
            setStats(statsRes || { total: 0, security: 0, failedLogins: 0, system: 0 });
        } catch (err) {
            toast.error('Failed to load audit logs');
        } finally {
            setLoading(false);
        }
    }, [filterSeverity, filterSource, search]);

    // Re-fetch whenever filters change
    useEffect(() => {
        const timer = setTimeout(() => loadLogs(1), 400);
        return () => clearTimeout(timer);
    }, [loadLogs]);

    const handleClearLogs = async () => {
        try {
            await clearAuditLogs();
            toast.success('All audit logs cleared successfully.');
            setLogs([]);
            setStats({ total: 0, security: 0, failedLogins: 0, system: 0 });
            setPagination({ total: 0, page: 1, totalPages: 1, limit: 50 });
        } catch {
            toast.error('Failed to clear logs');
        }
    };

    const handleExportCSV = () => {
        if (logs.length === 0) { toast.error('No logs to export'); return; }
        const header = ['Time', 'Severity', 'Source', 'Event', 'User', 'IP'];
        const rows = logs.map(l => [
            new Date(l.createdAt).toISOString(),
            l.severity,
            l.type,
            `"${l.event}"`,
            l.user,
            l.ip,
        ]);
        const csv = [header, ...rows].map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-logs-${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('CSV export downloaded!');
    };

    const statCards = [
        { label: 'Total Logs', value: stats.total, icon: HiTerminal, color: 'bg-slate-100 text-slate-600' },
        { label: 'Security Alerts', value: stats.security, icon: HiOutlineShieldCheck, color: 'bg-rose-50 text-rose-600' },
        { label: 'Failed Logins', value: stats.failedLogins, icon: HiKey, color: 'bg-amber-50 text-amber-600' },
        { label: 'System Events', value: stats.system, icon: HiDatabase, color: 'bg-blue-50 text-blue-600' },
    ];

    return (
        <div className="p-6 space-y-8 max-w-7xl mx-auto">
            {/* Header + Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 font-serif italic">System Audit logs</h1>
                    <p className="text-slate-500">Immutable record of platform activity and security events.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" icon={<HiRefresh />} onClick={() => loadLogs(pagination.page)} disabled={loading}>
                        {loading ? 'Loading…' : 'Refresh'}
                    </Button>
                    <Button variant="outline" icon={<HiDownload />} onClick={handleExportCSV}>Export CSV</Button>
                    <Button className="bg-rose-600 hover:bg-rose-700 text-white border-none" icon={<HiTrash />} onClick={handleClearLogs}>Clear Logs</Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map(stat => {
                    const Icon = stat.icon;
                    return (
                        <div key={stat.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
                            <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${stat.color}`}>
                                <Icon className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-2xl font-black text-slate-900">{stat.value}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center">
                <div className="relative flex-1 max-w-md">
                    <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search events, users, or IP addresses..."
                        className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all"
                    />
                </div>
                <div className="flex flex-wrap md:flex-nowrap gap-2 items-center">
                    <div className="w-32">
                        <Select
                            value={filterSeverity}
                            onChange={setFilterSeverity}
                            options={[
                                { label: 'Priority', value: 'All' },
                                { label: 'Low', value: 'low' },
                                { label: 'Medium', value: 'medium' },
                                { label: 'High', value: 'high' },
                            ]}
                        />
                    </div>
                    <div className="w-36">
                        <Select
                            value={filterSource}
                            onChange={setFilterSource}
                            options={[
                                { label: 'Source', value: 'All' },
                                { label: 'AUTH', value: 'auth' },
                                { label: 'SYSTEM', value: 'system' },
                                { label: 'MOD', value: 'mod' },
                                { label: 'SECURITY', value: 'security' },
                                { label: 'CONTENT', value: 'content' },
                            ]}
                        />
                    </div>
                    <Button
                        variant="outline"
                        className="text-xs bg-slate-50 border-slate-200 h-9"
                        icon={<HiCalendar />}
                        onClick={() => toast('Date range filtering will be available shortly!', { icon: '📅' })}
                    >
                        Date Range
                    </Button>
                </div>
            </div>

            {/* Audit Logs Table */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <Table>
                    <Thead>
                        <Th>Time</Th>
                        <Th>Priority</Th>
                        <Th>Source</Th>
                        <Th>Event Description</Th>
                        <Th>User</Th>
                        <Th>IP Address</Th>
                        <th className="px-6 py-4 text-right">Action</th>
                    </Thead>
                    <Tbody>
                        {loading ? (
                            <Tr>
                                <Td colSpan={7} className="text-center py-12">
                                    <div className="flex items-center justify-center gap-2 text-slate-400">
                                        <HiRefresh className="w-5 h-5 animate-spin" />
                                        <span className="text-sm font-medium">Loading audit logs…</span>
                                    </div>
                                </Td>
                            </Tr>
                        ) : logs.length === 0 ? (
                            <Tr>
                                <Td colSpan={7} className="text-center py-12">
                                    <div className="flex flex-col items-center gap-2 text-slate-400">
                                        <HiTerminal className="w-8 h-8" />
                                        <p className="text-sm font-medium">No logs match your filters.</p>
                                        <p className="text-xs">Events will appear here as users interact with the platform.</p>
                                    </div>
                                </Td>
                            </Tr>
                        ) : logs.map(log => {
                            const srcCfg = SOURCE_CONFIG[log.type];
                            const sevCfg = PRIORITY_CONFIG[log.severity];
                            const SrcIcon = srcCfg?.icon || HiTerminal;

                            return (
                                <Tr key={log._id} className="hover:bg-slate-50/80 transition-colors group">
                                    <Td><span className="text-xs font-semibold text-slate-500 whitespace-nowrap">{timeAgo(log.createdAt)}</span></Td>
                                    <Td>
                                        <Badge className={`text-[10px] font-black tracking-wider uppercase border px-2 py-0.5 rounded-md ${sevCfg?.color}`}>
                                            {log.severity}
                                        </Badge>
                                    </Td>
                                    <Td>
                                        <div className={`inline-flex items-center justify-center w-8 h-8 rounded-lg ${srcCfg?.color}`}>
                                            <SrcIcon className="w-4 h-4" />
                                        </div>
                                    </Td>
                                    <Td>
                                        <span className="font-semibold text-slate-800 group-hover:text-violet-700 transition-colors">{log.event}</span>
                                    </Td>
                                    <Td><code className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-bold">{log.user}</code></Td>
                                    <Td><span className="text-xs text-slate-500 font-mono tracking-tight">{log.ip}</span></Td>
                                    <Td className="text-right">
                                        <button
                                            className="p-2 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                                            onClick={() => toast.success(`Log ID: ${log._id}\nEvent: ${log.event}\nTime: ${new Date(log.createdAt).toLocaleString()}`)}
                                        >
                                            <HiEye className="w-5 h-5" />
                                        </button>
                                    </Td>
                                </Tr>
                            );
                        })}
                    </Tbody>
                </Table>

                {/* Pagination */}
                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">
                        Showing {logs.length} of {pagination.total} entries
                    </span>
                    <div className="flex gap-1">
                        <button
                            onClick={() => loadLogs(pagination.page - 1)}
                            disabled={pagination.page <= 1 || loading}
                            className="px-3 py-1 text-xs font-bold text-slate-400 bg-white border border-slate-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
                        >
                            Previous
                        </button>
                        {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => i + 1).map(p => (
                            <button
                                key={p}
                                onClick={() => loadLogs(p)}
                                disabled={loading}
                                className={`px-3 py-1 text-xs font-bold rounded-lg ${p === pagination.page ? 'text-white bg-violet-600' : 'text-slate-600 bg-white border border-slate-200 hover:bg-slate-50'}`}
                            >
                                {p}
                            </button>
                        ))}
                        <button
                            onClick={() => loadLogs(pagination.page + 1)}
                            disabled={pagination.page >= pagination.totalPages || loading}
                            className="px-3 py-1 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
