'use client';

import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface WhatsAppButtonProps {
    phoneNumber: string;
    merchantName: string;
    prefillMessage?: string;
    className?: string;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    label?: string;
}

export function WhatsAppButton({
    phoneNumber,
    merchantName,
    prefillMessage,
    className = '',
    variant = 'primary',
    size = 'md',
    label = 'Chat Penjual'
}: WhatsAppButtonProps) {

    const handleWhatsAppClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!phoneNumber) return;

        // 1. Sanitize: Remove non-numeric characters
        let cleanNumber = phoneNumber.replace(/\D/g, '');

        // 2. Format: Ensure starts with 62 (Indonesia)
        if (cleanNumber.startsWith('0')) {
            cleanNumber = '62' + cleanNumber.substring(1);
        } else if (!cleanNumber.startsWith('62')) {
            // Assume if no 0 and no 62, it might need 62 prefix if it seems like a mobile number?
            // Safer to just prepend 62 if length is typical (10-13 digits)
            cleanNumber = '62' + cleanNumber;
        }

        // 3. Construct Message
        const text = prefillMessage
            ? prefillMessage.replace('[Nama Toko]', merchantName)
            : `Halo ${merchantName}, saya mau tanya tentang menu di PreOrderDulu...`;

        const url = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(text)}`;

        window.open(url, '_blank');
    };

    return (
        <Button
            onClick={handleWhatsAppClick}
            className={`bg-[#25D366] hover:bg-[#128C7E] text-white border-none shadow-sm ${className}`}
            size={size}
        // Overriding variant styles for WhatsApp Brand Color
        >
            <MessageCircle size={18} className="mr-2" />
            {label}
        </Button>
    );
}
