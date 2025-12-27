'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ImageUpload } from '@/components/ImageUpload';
import { ArrowLeft, MapPin, Loader2, Store, Clock, Phone } from 'lucide-react';
import toast from 'react-hot-toast';

export default function MerchantSettingsPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        id: '',
        merchant_name: '',
        profile_photo_url: '',
        banner_url: '',
        // Checked schema: merchants -> profile_photo_url exists. banner_url does NOT exist in schema I read.
        // I will assume for now I should only update profile_photo_url OR I need to add column.
        // User request: "Profile Image & Banner Upload".
        // I'll add banner_url to schema or just use profile_photo_url for logo. 
        // Let's check 001_initial_schema.sql again. only profile_photo_url.
        // I will proceed with just Profile Photo for now to avoid schema drift unless I migrate.
        // Wait, user explicitly asked for "Banner Upload". I should probably add the column?
        // "Update the database column image_url (logo) and banner_url".
        // Use `business_description` for description.
        business_description: '',
        phone: '',
        address_text: '',
        opening_hours: '',
    });

    // NOTE: I realize now I need to add columns `banner_url` and `opening_hours` to `merchants` table.
    // I will do that in a separate migration step or just add it to 009 I am creating. 
    // I already WROTE 009. I will utilize existing fields for now to avoid breaking flow, 
    // BUT I will modify the migration file in next turn if needed.
    // Actually, I can just ALTER table in 009. I'll do that by editing 009 first.

    // Wait, I can't edit 009 in this turn easily as I already submitted the tool call.
    // I will write the page assuming these columns exist, and then I will update the migration file in the next step.

    useEffect(() => {
        loadMerchant();
    }, []);

    const loadMerchant = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push('/merchant/login'); return; }

        const { data, error } = await supabase
            .from('merchants')
            .select('*')
            .eq('id', user.id)
            .single();

        if (data) {
            setFormData({
                id: data.id,
                merchant_name: data.merchant_name || '',
                profile_photo_url: data.profile_photo_url || '',
                banner_url: data.banner_url || '', // Potential error if column missing
                business_description: data.business_description || '',
                phone: data.phone || '',
                address_text: data.address_text || '',
                opening_hours: data.opening_hours || '',
            });
        }
        setIsLoading(false);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('merchants')
                .update({
                    merchant_name: formData.merchant_name,
                    profile_photo_url: formData.profile_photo_url,
                    business_description: formData.business_description,
                    phone: formData.phone,
                    address_text: formData.address_text,
                    banner_url: formData.banner_url,
                    opening_hours: formData.opening_hours
                })
                .eq('id', formData.id);

            if (error) throw error;
            toast.success('Pengaturan berhasil disimpan!');
        } catch (error) {
            console.error(error);
            toast.error('Gagal menyimpan pengaturan');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
            <div className="max-w-3xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button variant="secondary" onClick={() => router.back()} className="px-3">
                        <ArrowLeft size={20} />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Pengaturan Toko</h1>
                        <p className="text-slate-500 text-sm">Update informasi profil dan branding tokomu.</p>
                    </div>
                </div>

                <div className="grid gap-6">
                    {/* Visual Branding Section */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                        <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                            <Store size={20} className="text-primary-600" /> Visual Branding
                        </h2>

                        <div className="flex flex-col md:flex-row gap-8 items-start">
                            {/* Logo */}
                            <div className="flex flex-col items-center gap-3">
                                <span className="text-sm font-medium text-slate-700">Logo Toko</span>
                                <ImageUpload
                                    label="Upload Logo"
                                    bucket="merchants"
                                    value={formData.profile_photo_url}
                                    onChange={(url) => setFormData(prev => ({ ...prev, profile_photo_url: url }))}
                                    className="w-32 h-32 text-slate-400"
                                />
                            </div>

                            {/* Banner - Placeholder since column might not exist yet */}
                            <div className="flex-1 w-full">
                                <span className="text-sm font-medium text-slate-700 mb-3 block">Banner Toko (16:9)</span>
                                <ImageUpload
                                    label="Upload Banner"
                                    bucket="merchants"
                                    aspectRatio="video"
                                    value={formData.banner_url}
                                    onChange={(url) => setFormData(prev => ({ ...prev, banner_url: url }))}
                                    className="w-full text-slate-400"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Store Information */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                        <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                            <Store size={20} className="text-blue-600" /> Informasi Dasar
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Nama Toko</label>
                                <Input
                                    name="merchant_name"
                                    value={formData.merchant_name}
                                    onChange={handleChange}
                                    placeholder="Contoh: Ayam Geprek Mas Jaki"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Deskripsi Singkat</label>
                                <textarea
                                    name="business_description"
                                    rows={3}
                                    className="w-full rounded-xl border-slate-200 focus:border-primary-500 focus:ring-primary-500 text-sm"
                                    value={formData.business_description}
                                    onChange={handleChange}
                                    placeholder="Ceritakan sedikit tentang tokomu..."
                                />
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">No. WhatsApp</label>
                                    <div className="relative">
                                        <Phone size={16} className="absolute left-3 top-3 text-slate-400" />
                                        <Input
                                            name="phone"
                                            className="pl-9"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            placeholder="08123456789"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Jam Operasional</label>
                                    <div className="relative">
                                        <Clock size={16} className="absolute left-3 top-3 text-slate-400" />
                                        <Input
                                            name="opening_hours"
                                            className="pl-9"
                                        <Input
                                            name="opening_hours"
                                            className="pl-9"
                                            value={formData.opening_hours}
                                            onChange={handleChange}
                                            placeholder="08:00 - 21:00"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Location */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                        <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                            <MapPin size={20} className="text-red-600" /> Lokasi
                        </h2>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Alamat Lengkap</label>
                            <textarea
                                name="address_text"
                                rows={2}
                                className="w-full rounded-xl border-slate-200 focus:border-primary-500 focus:ring-primary-500 text-sm"
                                value={formData.address_text}
                                onChange={handleChange}
                                placeholder="Jl. Veteran No. 10..."
                            />
                            <p className="text-xs text-slate-500 mt-2">
                                * Lat/Long terdeteksi otomatis saat registrasi. Hubungi admin jika ingin mengubah titik peta.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-4 pb-12">
                    <Button
                        onClick={handleSave}
                        className="bg-primary-600 hover:bg-primary-700 text-white min-w-[150px]"
                        disabled={isSaving}
                    >
                        {isSaving ? <Loader2 className="animate-spin mr-2" /> : null}
                        Simpan Perubahan
                    </Button>
                </div>

            </div>
        </div>
    );
}
