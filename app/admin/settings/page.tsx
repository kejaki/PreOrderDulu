'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { AlertTriangle, Save } from 'lucide-react';
import toast from 'react-hot-toast';

interface Settings {
    maintenance_mode: { enabled: boolean };
    global_announcement: { text: string; enabled: boolean };
}

export default function AdminSettingsPage() {
    const [settings, setSettings] = useState<Settings>({
        maintenance_mode: { enabled: false },
        global_announcement: { text: '', enabled: false }
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setIsLoading(true);

        const { data: maintenanceData } = await supabase
            .from('system_settings')
            .select('value')
            .eq('key', 'maintenance_mode')
            .single();

        const { data: announcementData } = await supabase
            .from('system_settings')
            .select('value')
            .eq('key', 'global_announcement')
            .single();

        if (maintenanceData && announcementData) {
            setSettings({
                maintenance_mode: maintenanceData.value,
                global_announcement: announcementData.value
            });
        }

        setIsLoading(false);
    };

    const handleSaveSettings = async () => {
        setIsSaving(true);

        const { error: maintenanceError } = await supabase
            .from('system_settings')
            .update({ value: settings.maintenance_mode })
            .eq('key', 'maintenance_mode');

        const { error: announcementError } = await supabase
            .from('system_settings')
            .update({ value: settings.global_announcement })
            .eq('key', 'global_announcement');

        if (maintenanceError || announcementError) {
            toast.error('Gagal menyimpan pengaturan');
        } else {
            toast.success('Pengaturan berhasil disimpan');
        }

        setIsSaving(false);
    };

    if (isLoading) {
        return (
            <div className="p-8 bg-slate-900 min-h-screen flex items-center justify-center">
                <p className="text-slate-400">Loading settings...</p>
            </div>
        );
    }

    return (
        <div className="p-8 bg-slate-900 min-h-screen">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white">App Settings</h1>
                <p className="text-slate-400 mt-1">Configure platform-wide settings</p>
            </div>

            <div className="max-w-3xl space-y-6">
                {/* Maintenance Mode */}
                <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <AlertTriangle className="text-yellow-500" size={24} />
                                Maintenance Mode
                            </h2>
                            <p className="text-sm text-slate-400 mt-1">
                                When enabled, the public app will show a maintenance screen
                            </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={settings.maintenance_mode.enabled}
                                onChange={(e) => setSettings({
                                    ...settings,
                                    maintenance_mode: { enabled: e.target.checked }
                                })}
                                className="sr-only peer"
                            />
                            <div className="w-14 h-7 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-rose-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-rose-600"></div>
                        </label>
                    </div>
                    {settings.maintenance_mode.enabled && (
                        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                            <p className="text-yellow-500 text-sm font-medium">
                                ⚠️ Warning: Users will not be able to access the app while maintenance mode is active!
                            </p>
                        </div>
                    )}
                </div>

                {/* Global Announcement */}
                <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <h2 className="text-xl font-bold text-white">Global Announcement</h2>
                            <p className="text-sm text-slate-400 mt-1">
                                Display a banner message on the homepage
                            </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={settings.global_announcement.enabled}
                                onChange={(e) => setSettings({
                                    ...settings,
                                    global_announcement: {
                                        ...settings.global_announcement,
                                        enabled: e.target.checked
                                    }
                                })}
                                className="sr-only peer"
                            />
                            <div className="w-14 h-7 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-rose-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-rose-600"></div>
                        </label>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Announcement Text
                        </label>
                        <textarea
                            value={settings.global_announcement.text}
                            onChange={(e) => setSettings({
                                ...settings,
                                global_announcement: {
                                    ...settings.global_announcement,
                                    text: e.target.value
                                }
                            })}
                            className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500"
                            rows={3}
                            placeholder="e.g., 🎉 Promo Spesial: Gratis Ongkir untuk Semua Pesanan!"
                        />
                    </div>
                    {settings.global_announcement.enabled && settings.global_announcement.text && (
                        <div className="mt-4 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                            <p className="text-blue-400 text-sm font-medium">
                                Preview: {settings.global_announcement.text}
                            </p>
                        </div>
                    )}
                </div>

                {/* Save Button */}
                <div className="flex justify-end">
                    <Button onClick={handleSaveSettings} disabled={isSaving} size="lg">
                        <Save size={18} className="mr-2" />
                        {isSaving ? 'Saving...' : 'Save Settings'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
