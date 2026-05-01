import { useState } from 'react';
import {
    HiGlobeAlt, HiShieldCheck, HiMail, HiBell,
    HiCog, HiDatabase, HiLightningBolt, HiCheck
} from 'react-icons/hi';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';

export default function PlatformSettings() {
    const [activeSection, setActiveSection] = useState('general');

    const sections = [
        { id: 'general', label: 'General', icon: HiGlobeAlt },
        { id: 'security', label: 'Security', icon: HiShieldCheck },
        { id: 'notifications', label: 'Email & Alerts', icon: HiBell },
        { id: 'integrations', label: 'Integrations', icon: HiLightningBolt },
        { id: 'data', label: 'Data Management', icon: HiDatabase },
    ];

    return (
        <div className="p-6 space-y-8 max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-text-primary text-slate-900">Platform Settings</h1>
                    <p className="text-text-secondary">Configure global EduVerse instance parameters and policies.</p>
                </div>
                <Button icon={<HiCheck />} className="bg-emerald-600 hover:bg-emerald-700 text-white border-none">Save Changes</Button>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Side Nav */}
                <aside className="lg:w-64 space-y-1">
                    {sections.map(s => (
                        <button
                            key={s.id}
                            onClick={() => setActiveSection(s.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${activeSection === s.id
                                ? 'bg-primary-600 text-white shadow-lg'
                                : 'text-text-secondary hover:bg-surface-muted hover:text-text-primary'
                                }`}
                        >
                            <s.icon className="w-5 h-5" />
                            {s.label}
                        </button>
                    ))}
                </aside>

                {/* Main Content Pane */}
                <main className="flex-1 bg-white rounded-3xl border border-surface-border shadow-card p-8 space-y-8">
                    {activeSection === 'general' && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-8">
                            <div className="space-y-4">
                                <h3 className="text-xl font-bold text-text-primary uppercase tracking-tight">Organization Identity</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Input label="Platform Name" defaultValue="EduVerse LMS" />
                                    <Input label="Admin Email" defaultValue="admin@eduverse.io" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-2">Display Logo</label>
                                    <div className="flex items-center gap-6">
                                        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center">
                                            <HiGlobeAlt className="w-8 h-8 text-slate-300" />
                                        </div>
                                        <Button variant="outline" size="sm">Replace Image</Button>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 pt-8 border-t border-surface-border">
                                <h3 className="text-xl font-bold text-text-primary uppercase tracking-tight">Regional Settings</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Select label="Default Language" options={[{ label: 'English', value: 'en' }]} />
                                    <Select label="System Timezone" options={[{ label: 'UTC (00:00)', value: 'utc' }]} />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Select label="Default Currency" options={[{ label: 'USD ($)', value: 'usd' }]} />
                                    <Input label="Date Format" defaultValue="MMM DD, YYYY" />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeSection === 'security' && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-8">
                            <div className="space-y-4">
                                <h3 className="text-xl font-bold text-text-primary uppercase tracking-tight">Access Control</h3>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 bg-surface-muted rounded-xl border border-surface-border">
                                        <div>
                                            <p className="font-bold text-text-primary">Two-Factor Authentication (2FA)</p>
                                            <p className="text-xs text-text-secondary">Enforce 2FA for all administrative accounts.</p>
                                        </div>
                                        <input type="checkbox" className="w-5 h-5 rounded border-slate-300 transition-all checked:bg-primary-600" defaultChecked />
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-surface-muted rounded-xl border border-surface-border">
                                        <div>
                                            <p className="font-bold text-text-primary">SSO Integration</p>
                                            <p className="text-xs text-text-secondary">Allow authentication via SAML or OpenID Connect.</p>
                                        </div>
                                        <input type="checkbox" className="w-5 h-5 rounded border-slate-300 transition-all checked:bg-primary-600" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 pt-8 border-t border-surface-border">
                                <h3 className="text-xl font-bold text-text-primary uppercase tracking-tight">Session Policies</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Select label="Session Timeout" options={[{ label: '1 Hour', value: '1h' }, { label: '8 Hours', value: '8h' }]} />
                                    <Select label="Password Expiry" options={[{ label: '90 Days', value: '90d' }, { label: 'Never', value: '0' }]} />
                                </div>
                            </div>
                        </div>
                    )}
                    {activeSection === 'notifications' && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-8">
                            <div className="space-y-4">
                                <h3 className="text-xl font-bold text-text-primary uppercase tracking-tight">System Notifications</h3>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 bg-surface-muted rounded-xl border border-surface-border">
                                        <div>
                                            <p className="font-bold text-text-primary">Global Email Alerts</p>
                                            <p className="text-xs text-text-secondary">Enable or disable all outgoing system emails.</p>
                                        </div>
                                        <input type="checkbox" className="w-5 h-5 rounded border-slate-300 transition-all checked:bg-primary-600" defaultChecked />
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-surface-muted rounded-xl border border-surface-border">
                                        <div>
                                            <p className="font-bold text-text-primary">Admin Security Alerts</p>
                                            <p className="text-xs text-text-secondary">Receive instant notifications for security-critical events.</p>
                                        </div>
                                        <input type="checkbox" className="w-5 h-5 rounded border-slate-300 transition-all checked:bg-primary-600" defaultChecked />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 pt-8 border-t border-surface-border">
                                <h3 className="text-xl font-bold text-text-primary uppercase tracking-tight">SMTP Configuration</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Input label="SMTP Host" defaultValue="smtp.eduverse.io" />
                                    <Input label="SMTP Port" defaultValue="587" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Input label="Sender Name" defaultValue="EduVerse LMS" />
                                    <Input label="Sender Email" defaultValue="no-reply@eduverse.io" />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeSection === 'integrations' && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-8">
                            <div className="space-y-4">
                                <h3 className="text-xl font-bold text-text-primary uppercase tracking-tight">Marketplace Integrations</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {[
                                        { name: 'Slack', desc: 'Sync announcements to channels.', connected: true },
                                        { name: 'Zoom', desc: 'Auto-generate meeting links.', connected: true },
                                        { name: 'Stripe', desc: 'Handle platform payments.', connected: false },
                                        { name: 'Google Calendar', desc: 'Sync course schedules.', connected: false },
                                    ].map(app => (
                                        <div key={app.name} className="p-4 bg-surface-muted rounded-xl border border-surface-border flex items-center justify-between">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-bold text-text-primary">{app.name}</p>
                                                    {app.connected && <Badge color="green" size="xs">Connected</Badge>}
                                                </div>
                                                <p className="text-xs text-text-secondary">{app.desc}</p>
                                            </div>
                                            <Button variant={app.connected ? "ghost" : "outline"} size="sm">
                                                {app.connected ? 'Configure' : 'Connect'}
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeSection === 'data' && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-8">
                            <div className="space-y-4">
                                <h3 className="text-xl font-bold text-text-primary uppercase tracking-tight">Data Management & Exports</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-4 bg-surface-muted rounded-xl border border-surface-border space-y-4">
                                        <div>
                                            <p className="font-bold text-text-primary">Platform Data Export</p>
                                            <p className="text-xs text-text-secondary">Generate a full export of users, courses, and logs.</p>
                                        </div>
                                        <Button variant="outline" size="sm" icon={<HiDatabase />} className="w-full">Export All Data</Button>
                                    </div>
                                    <div className="p-4 bg-surface-muted rounded-xl border border-surface-border space-y-4">
                                        <div>
                                            <p className="font-bold text-text-primary">System Backup</p>
                                            <p className="text-xs text-text-secondary">Trigger a manual backup of the entire instance.</p>
                                        </div>
                                        <Button variant="outline" size="sm" icon={<HiLightningBolt />} className="w-full">Trigger Backup</Button>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 pt-8 border-t border-surface-border">
                                <h3 className="text-xl font-bold text-text-primary uppercase tracking-tight">Retention Policies</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Select label="Audit Log Retention" options={[{ label: '90 Days', value: '90' }, { label: '1 Year', value: '365' }]} />
                                    <Select label="User Data Archive" options={[{ label: 'After 2 Years', value: '2y' }, { label: 'Never', value: 'never' }]} />
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
