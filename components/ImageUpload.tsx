'use client';

import { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Camera, Loader2, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';

interface ImageUploadProps {
    value?: string | null;
    onChange: (url: string) => void;
    label: string;
    bucket?: string;
    aspectRatio?: 'square' | 'video'; // 'square' for 1:1, 'video' for 16:9
    className?: string;
}

export function ImageUpload({
    value,
    onChange,
    label,
    bucket = 'merchants',
    aspectRatio = 'square',
    className = ''
}: ImageUploadProps) {
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            const file = event.target.files?.[0];
            if (!file) return;

            setIsUploading(true);

            // validate file type
            if (!file.type.startsWith('image/')) {
                toast.error('File harus berupa gambar');
                return;
            }

            // validate file size (max 2MB)
            if (file.size > 2 * 1024 * 1024) {
                toast.error('Ukuran gambar maksimal 2MB');
                return;
            }

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}/${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from(bucket)
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from(bucket)
                .getPublicUrl(fileName);

            onChange(publicUrl);
            toast.success('Gambar berhasil diupload');
        } catch (error) {
            console.error('Upload Error:', error);
            toast.error('Gagal mengupload gambar');
        } finally {
            setIsUploading(false);
            // reset input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    return (
        <div className={`relative group cursor-pointer overflow-hidden bg-slate-100 border-2 border-dashed border-slate-300 hover:border-primary-400 transition-colors flex items-center justify-center ${className} ${aspectRatio === 'square' ? 'aspect-square rounded-full' : 'aspect-video rounded-xl'}`}
            onClick={() => !isUploading && fileInputRef.current?.click()}
        >
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleUpload}
                accept="image/*"
                className="hidden"
                disabled={isUploading}
            />

            {value ? (
                <>
                    <img src={value} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-medium text-sm">
                        <Camera size={20} className="mr-2" /> Ganti
                    </div>
                </>
            ) : (
                <div className="text-center p-4 text-slate-400">
                    <ImageIcon size={24} className="mx-auto mb-2 opacity-50" />
                    <span className="text-xs font-bold">{label}</span>
                </div>
            )}

            {isUploading && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10 text-primary-600">
                    <Loader2 size={24} className="animate-spin" />
                </div>
            )}
        </div>
    );
}
