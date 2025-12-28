'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Plus, Edit2, Trash2, X, ImageIcon, Video } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { ImageUpload } from '@/components/ImageUpload';

interface MenuItem {
    id: string;
    name: string;
    description: string;
    price: number;
    image_url?: string;
    images?: string[];
    video_url?: string;
    category: string;
    is_available: boolean;
    customization_options?: any;
}

export default function MenuManagementPage() {
    const router = useRouter();
    const [merchantId, setMerchantId] = useState<string | null>(null);
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        category: '',
        image_url: '',
        images: [] as string[],
        video_url: '',
        is_available: true,
        // Simplified customization
        has_ice_option: false,
        has_spice_option: false,
        extras: '' // Comma separated
    });

    useEffect(() => {
        loadMerchantAndMenu();
    }, []);

    const loadMerchantAndMenu = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            router.push('/merchant/login');
            return;
        }

        setMerchantId(user.id);
        await fetchMenuItems(user.id);
    };

    const fetchMenuItems = async (merchantId: string) => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('menu_items')
            .select('*')
            .eq('merchant_id', merchantId)
            .order('created_at', { ascending: false });

        if (data) setMenuItems(data);
        setIsLoading(false);
    };

    const handleOpenModal = (item?: MenuItem) => {
        if (item) {
            setEditingItem(item);

            // Parse existing customization options
            const opts = item.customization_options || [];
            const hasIce = opts.some((o: any) => o.id === 'ice_level');
            const hasSpice = opts.some((o: any) => o.id === 'spice_level');
            const extrasOpt = opts.find((o: any) => o.id === 'extras');

            setFormData({
                name: item.name,
                description: item.description,
                price: item.price.toString(),
                category: item.category,
                image_url: item.image_url || '',
                images: item.images || [],
                video_url: item.video_url || '',
                is_available: item.is_available,
                has_ice_option: hasIce,
                has_spice_option: hasSpice,
                extras: extrasOpt ? extrasOpt.options.join(', ') : ''
            });
        } else {
            setEditingItem(null);
            setFormData({
                name: '',
                description: '',
                price: '',
                category: '',
                image_url: '',
                images: [],
                video_url: '',
                is_available: true,
                has_ice_option: false,
                has_spice_option: false,
                extras: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingItem(null);
    };

    const handleAddImage = (url: string) => {
        setFormData({
            ...formData,
            images: [...formData.images, url],
            image_url: formData.image_url || url
        });
    };

    const handleRemoveImage = (index: number) => {
        const newImages = formData.images.filter((_, i) => i !== index);
        setFormData({
            ...formData,
            images: newImages,
            image_url: newImages[0] || ''
        });
    };

    const buildCustomizationOptions = () => {
        const options = [];

        if (formData.has_ice_option) {
            options.push({
                id: 'ice_level',
                label: 'Tingkat Es',
                type: 'select',
                required: false,
                options: ['Tanpa Es', 'Es Sedikit', 'Es Normal', 'Es Banyak']
            });
        }

        if (formData.has_spice_option) {
            options.push({
                id: 'spice_level',
                label: 'Tingkat Pedas',
                type: 'select',
                required: false,
                options: ['Tidak Pedas', 'Sedang', 'Pedas', 'Extra Pedas']
            });
        }

        if (formData.extras.trim()) {
            const extrasArray = formData.extras.split(',').map(e => e.trim()).filter(e => e);
            if (extrasArray.length > 0) {
                options.push({
                    id: 'extras',
                    label: 'Tambahan (Opsional)',
                    type: 'checkbox',
                    required: false,
                    options: extrasArray
                });
            }
        }

        return options;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!merchantId) return;

        const price = parseFloat(formData.price);
        if (isNaN(price) || price <= 0) {
            toast.error('Harga harus valid');
            return;
        }

        const customizationOptions = buildCustomizationOptions();

        const payload = {
            merchant_id: merchantId,
            name: formData.name,
            description: formData.description,
            price: price,
            category: formData.category,
            image_url: formData.image_url || formData.images[0] || null,
            images: formData.images.length > 0 ? formData.images : null,
            video_url: formData.video_url || null,
            is_available: formData.is_available,
            customization_options: customizationOptions.length > 0 ? customizationOptions : null
        };

        if (editingItem) {
            const { error } = await supabase
                .from('menu_items')
                .update(payload)
                .eq('id', editingItem.id);

            if (error) {
                toast.error('Gagal mengupdate menu');
            } else {
                toast.success('Menu berhasil diupdate');
                fetchMenuItems(merchantId);
                handleCloseModal();
            }
        } else {
            const { error } = await supabase
                .from('menu_items')
                .insert(payload);

            if (error) {
                toast.error('Gagal menambah menu');
            } else {
                toast.success('Menu berhasil ditambahkan');
                fetchMenuItems(merchantId);
                handleCloseModal();
            }
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Yakin ingin menghapus menu ini?')) return;

        const { error } = await supabase
            .from('menu_items')
            .delete()
            .eq('id', id);

        if (error) {
            toast.error('Gagal menghapus menu');
        } else {
            toast.success('Menu berhasil dihapus');
            if (merchantId) fetchMenuItems(merchantId);
        }
    };

    const toggleAvailability = async (item: MenuItem) => {
        const { error } = await supabase
            .from('menu_items')
            .update({ is_available: !item.is_available })
            .eq('id', item.id);

        if (error) {
            toast.error('Gagal mengupdate status');
        } else {
            toast.success(`Menu ${!item.is_available ? 'tersedia' : 'tidak tersedia'}`);
            if (merchantId) fetchMenuItems(merchantId);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            {/* Header */}
            <nav className="bg-white border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div>
                            <h1 className="text-xl font-bold text-slate-900">Kelola Menu</h1>
                            <p className="text-sm text-slate-500">Tambah, edit, atau hapus menu Anda</p>
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={() => router.back()} variant="secondary" size="sm">
                                Kembali
                            </Button>
                            <Button onClick={() => handleOpenModal()} size="sm">
                                <Plus size={16} className="mr-2" />
                                Tambah Menu
                            </Button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {isLoading ? (
                    <div className="text-center py-12">Loading...</div>
                ) : menuItems.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl border border-dashed">
                        <p className="text-slate-500">Belum ada menu. Tambahkan menu pertama Anda!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {menuItems.map((item) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow"
                            >
                                {/* Image */}
                                <div className="relative h-48 bg-slate-100">
                                    {item.image_url ? (
                                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="flex items-center justify-center h-full">
                                            <ImageIcon size={48} className="text-slate-300" />
                                        </div>
                                    )}
                                    {/* Media badges */}
                                    <div className="absolute top-2 left-2 flex gap-1">
                                        {item.images && item.images.length > 1 && (
                                            <span className="bg-black/70 text-white px-2 py-1 rounded text-xs font-bold">
                                                {item.images.length} Foto
                                            </span>
                                        )}
                                        {item.video_url && (
                                            <span className="bg-red-500 text-white px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
                                                <Video size={12} /> Video
                                            </span>
                                        )}
                                    </div>
                                    {!item.is_available && (
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                            <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                                                Tidak Tersedia
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h3 className="font-bold text-slate-900">{item.name}</h3>
                                            <p className="text-xs text-slate-500">{item.category}</p>
                                        </div>
                                        <span className="text-lg font-bold text-primary-600">
                                            Rp{item.price.toLocaleString('id-ID')}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-600 mb-4 line-clamp-2">{item.description}</p>

                                    {/* Actions */}
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={() => toggleAvailability(item)}
                                            variant={item.is_available ? 'secondary' : 'primary'}
                                            size="sm"
                                            className="flex-1"
                                        >
                                            {item.is_available ? 'Nonaktifkan' : 'Aktifkan'}
                                        </Button>
                                        <Button onClick={() => handleOpenModal(item)} variant="outline" size="sm">
                                            <Edit2 size={14} />
                                        </Button>
                                        <Button onClick={() => handleDelete(item.id)} variant="danger" size="sm">
                                            <Trash2 size={14} />
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </main>

            {/* Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full my-8 max-h-[90vh] overflow-y-auto"
                        >
                            {/* Modal Header */}
                            <div className="flex justify-between items-center p-6 border-b border-slate-200 sticky top-0 bg-white rounded-t-2xl z-10">
                                <h2 className="text-xl font-bold text-slate-900">
                                    {editingItem ? 'Edit Menu' : 'Tambah Menu Baru'}
                                </h2>
                                <button onClick={handleCloseModal} className="p-2 hover:bg-slate-100 rounded-full">
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                {/* Name & Description */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Nama Menu *</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Deskripsi *</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
                                        rows={3}
                                        required
                                    />
                                </div>

                                {/* Price & Category */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Harga (Rp) *</label>
                                        <input
                                            type="number"
                                            value={formData.price}
                                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
                                            required
                                            min="0"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Kategori *</label>
                                        <input
                                            type="text"
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
                                            required
                                            placeholder="e.g., Makanan, Minuman"
                                        />
                                    </div>
                                </div>

                                {/* Multiple Images */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Foto Menu (Maks 5)</label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {formData.images.map((img, idx) => (
                                            <div key={idx} className="relative group">
                                                <img src={img} alt={`Image ${idx + 1}`} className="w-full h-32 object-cover rounded-lg" />
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveImage(idx)}
                                                    className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ))}
                                        {formData.images.length < 5 && (
                                            <ImageUpload
                                                bucket="merchants"
                                                onUploadSuccess={handleAddImage}
                                                currentImage=""
                                            />
                                        )}
                                    </div>
                                </div>

                                {/* Video */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Video URL (Opsional)</label>
                                    <input
                                        type="url"
                                        value={formData.video_url}
                                        onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
                                        placeholder="https://..."
                                    />
                                </div>

                                {/* Simple Customization Options */}
                                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                    <h3 className="font-bold text-sm mb-3">Opsi Customization (Opsional)</h3>

                                    <div className="space-y-3">
                                        {/* Ice Level */}
                                        <label className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={formData.has_ice_option}
                                                onChange={(e) => setFormData({ ...formData, has_ice_option: e.target.checked })}
                                                className="w-4 h-4"
                                            />
                                            <span className="text-sm font-medium">Tingkat Es (Tanpa Es, Sedikit, Normal, Banyak)</span>
                                        </label>

                                        {/* Spice Level */}
                                        <label className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={formData.has_spice_option}
                                                onChange={(e) => setFormData({ ...formData, has_spice_option: e.target.checked })}
                                                className="w-4 h-4"
                                            />
                                            <span className="text-sm font-medium">Tingkat Pedas (Tidak, Sedang, Pedas, Extra)</span>
                                        </label>

                                        {/* Extras */}
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                                Tambahan Opsional (pisahkan dengan koma)
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.extras}
                                                onChange={(e) => setFormData({ ...formData, extras: e.target.value })}
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                                                placeholder="Extra Keju, Extra Sambal, Extra Sayur"
                                            />
                                            <p className="text-xs text-slate-500 mt-1">Contoh: Extra Keju, Extra Sambal, Extra Sayur</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Availability */}
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        id="is_available"
                                        checked={formData.is_available}
                                        onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
                                        className="w-4 h-4 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
                                    />
                                    <label htmlFor="is_available" className="text-sm font-medium text-slate-700">
                                        Tersedia untuk dijual
                                    </label>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-3 pt-4">
                                    <Button type="button" onClick={handleCloseModal} variant="secondary" className="flex-1">
                                        Batal
                                    </Button>
                                    <Button type="submit" className="flex-1">
                                        {editingItem ? 'Update Menu' : 'Tambah Menu'}
                                    </Button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
