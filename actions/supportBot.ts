'use server';

import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';

// Server-side Supabase client (for service role operations)
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface BotResponse {
    sender_type: 'bot';
    message_type: 'text' | 'options' | 'order_card';
    content: string;
}

export async function createSupportSession(userId: string) {
    const { data, error } = await supabaseAdmin
        .from('support_sessions')
        .insert({
            user_id: userId,
            status: 'bot_active'
        })
        .select()
        .single();

    if (error) throw error;

    // Send welcome message
    await sendBotMessage(data.id, {
        sender_type: 'bot',
        message_type: 'text',
        content: 'Halo! Ada yang bisa dibantu? 👋'
    });

    // Send main menu
    await sendBotMessage(data.id, {
        sender_type: 'bot',
        message_type: 'options',
        content: JSON.stringify(['Lacak Order', 'Lapor Toko/Menu', 'Info Developer', 'Chat Admin'])
    });

    return data;
}

export async function createGuestSession(guestId: string) {
    const { data, error } = await supabaseAdmin
        .from('support_sessions')
        .insert({
            guest_id: guestId,
            user_id: null,  // Explicitly null for guest
            status: 'bot_active'
        })
        .select()
        .single();

    if (error) throw error;

    // Send guest welcome message
    await sendBotMessage(data.id, {
        sender_type: 'bot',
        message_type: 'text',
        content: 'Halo Kak! Ada yang bisa dibantu? 👋\n\n(Anda chat sebagai Tamu)'
    });

    // Send guest menu (no "Lacak Order")
    await sendBotMessage(data.id, {
        sender_type: 'bot',
        message_type: 'options',
        content: JSON.stringify(['Tanya Produk', 'Cara Pesan', 'Chat Admin', 'Login Sekarang'])
    });

    return data;
}

export async function sendBotMessage(sessionId: string, message: BotResponse) {
    const { error } = await supabaseAdmin
        .from('support_messages')
        .insert({
            session_id: sessionId,
            sender_type: message.sender_type,
            message_type: message.message_type,
            content: message.content
        });

    if (error) throw error;
}

export async function handleBotResponse(sessionId: string, userMessage: string) {
    const normalizedMessage = userMessage.toLowerCase().trim();

    // Get session to check if guest or authenticated
    const { data: session } = await supabaseAdmin
        .from('support_sessions')
        .select('user_id, guest_id')
        .eq('id', sessionId)
        .single();

    const isGuest = !session?.user_id && session?.guest_id;

    // === GUEST-SPECIFIC RESPONSES ===
    if (isGuest) {
        if (normalizedMessage.includes('tanya produk') || normalizedMessage.includes('produk')) {
            await sendBotMessage(sessionId, {
                sender_type: 'bot',
                message_type: 'text',
                content: '🍽️ Kami menyediakan Pre-Order makanan dari berbagai merchant.\n\nSilakan login untuk melihat menu lengkap atau langsung pesan!'
            });
            await sendGuestMenu(sessionId);
            return;
        }

        if (normalizedMessage.includes('cara pesan') || normalizedMessage.includes('order')) {
            await sendBotMessage(sessionId, {
                sender_type: 'bot',
                message_type: 'text',
                content: '📱 Cara Pesan:\n1. Buka halaman utama\n2. Pilih merchant\n3. Pilih menu & tambah ke keranjang\n4. Checkout (tanpa login!)\n5. Tunggu konfirmasi dari penjual'
            });
            await sendGuestMenu(sessionId);
            return;
        }

        if (normalizedMessage.includes('login sekarang') || normalizedMessage.includes('login')) {
            await sendBotMessage(sessionId, {
                sender_type: 'bot',
                message_type: 'text',
                content: '🔐 Silakan login di halaman utama untuk akses fitur lengkap:\n\n- Lacak pesanan\n- Riwayat order\n- Simpan alamat\n\nDan masih banyak lagi!'
            });
            await sendGuestMenu(sessionId);
            return;
        }

        if (normalizedMessage.includes('chat admin')) {
            // Ask for contact info first
            await sendBotMessage(sessionId, {
                sender_type: 'bot',
                message_type: 'text',
                content: '👨‍💼 Sebelum terhubung dengan Admin, boleh minta No WhatsApp atau Email Kakak?\n\n(Agar Admin bisa menghubungi jika chat terputus)'
            });
            // Don't escalate yet, wait for contact info
            return;
        }

        // If message looks like contact info (contains @ or numbers)
        if (normalizedMessage.includes('@') || /\d{10,}/.test(normalizedMessage)) {
            // Save contact info
            await supabaseAdmin
                .from('support_sessions')
                .update({ contact_info: userMessage })
                .eq('id', sessionId);

            // Now escalate
            return await escalateToAdmin(sessionId);
        }

        // Default guest response
        await sendBotMessage(sessionId, {
            sender_type: 'bot',
            message_type: 'text',
            content: 'Maaf, saya tidak mengerti. Silakan pilih dari menu berikut:'
        });
        await sendGuestMenu(sessionId);
        return;
    }

    // === AUTHENTICATED USER RESPONSES ===
    if (normalizedMessage.includes('lacak order') || normalizedMessage.includes('cek pesanan')) {
        return await handleTrackOrder(sessionId);
    }

    if (normalizedMessage.includes('lapor toko') || normalizedMessage.includes('lapor menu')) {
        return await handleReportMerchant(sessionId);
    }

    if (normalizedMessage.includes('info developer') || normalizedMessage.includes('tentang app')) {
        await sendBotMessage(sessionId, {
            sender_type: 'bot',
            message_type: 'text',
            content: '📱 Aplikasi PreOrderDulu\n\nDikembangkan oleh Tim PreOrderDulu untuk memudahkan pre-order makanan di kampus dan sekitarnya.\n\nVersi: 1.0.0'
        });
        await sendMainMenu(sessionId);
        return;
    }

    if (normalizedMessage.includes('chat admin') || normalizedMessage.includes('bicara admin')) {
        return await escalateToAdmin(sessionId);
    }

    // Default response
    await sendBotMessage(sessionId, {
        sender_type: 'bot',
        message_type: 'text',
        content: 'Maaf, saya tidak mengerti. Silakan pilih dari menu berikut:'
    });
    await sendMainMenu(sessionId);
}

async function sendMainMenu(sessionId: string) {
    await sendBotMessage(sessionId, {
        sender_type: 'bot',
        message_type: 'options',
        content: JSON.stringify(['Lacak Order', 'Lapor Toko/Menu', 'Info Developer', 'Chat Admin'])
    });
}

async function sendGuestMenu(sessionId: string) {
    await sendBotMessage(sessionId, {
        sender_type: 'bot',
        message_type: 'options',
        content: JSON.stringify(['Tanya Produk', 'Cara Pesan', 'Chat Admin', 'Login Sekarang'])
    });
}

async function handleTrackOrder(sessionId: string) {
    await sendBotMessage(sessionId, {
        sender_type: 'bot',
        message_type: 'text',
        content: '📦 Fitur lacak order sedang dalam pengembangan. Untuk saat ini, silakan gunakan halaman "Lacak Pesanan" di menu utama dengan nomor WhatsApp Anda.'
    });

    await sendMainMenu(sessionId);
}

async function handleReportMerchant(sessionId: string) {
    await sendBotMessage(sessionId, {
        sender_type: 'bot',
        message_type: 'text',
        content: '🏪 Untuk melaporkan masalah toko atau menu, silakan gunakan fitur "Help Center" atau langsung chat dengan admin.'
    });

    await sendBotMessage(sessionId, {
        sender_type: 'bot',
        message_type: 'options',
        content: JSON.stringify(['Chat Admin', 'Kembali ke Menu'])
    });
}

export async function escalateToAdmin(sessionId: string) {
    // Update session status
    await supabaseAdmin
        .from('support_sessions')
        .update({ status: 'queued_for_admin' })
        .eq('id', sessionId);

    await sendBotMessage(sessionId, {
        sender_type: 'bot',
        message_type: 'text',
        content: '👨‍💼 Mohon tunggu sebentar, Admin akan segera bergabung dalam chat ini. Anda bisa menjelaskan masalah Anda terlebih dahulu.'
    });
}

export async function sendUserMessage(sessionId: string, content: string, attachmentUrl?: string) {
    const { error } = await supabaseAdmin
        .from('support_messages')
        .insert({
            session_id: sessionId,
            sender_type: 'user',
            message_type: attachmentUrl ? 'image' : 'text',
            content: content,
            attachment_url: attachmentUrl
        });

    if (error) throw error;
}

export async function sendAdminMessage(sessionId: string, content: string) {
    // Update session status to live_agent if not already
    await supabaseAdmin
        .from('support_sessions')
        .update({ status: 'live_agent' })
        .eq('id', sessionId);

    const { error } = await supabaseAdmin
        .from('support_messages')
        .insert({
            session_id: sessionId,
            sender_type: 'admin',
            message_type: 'text',
            content: content
        });

    if (error) throw error;
}

export async function resolveSession(sessionId: string) {
    await supabaseAdmin
        .from('support_sessions')
        .update({ status: 'resolved' })
        .eq('id', sessionId);

    await sendBotMessage(sessionId, {
        sender_type: 'bot',
        message_type: 'text',
        content: '✅ Chat ini telah ditutup oleh Admin. Terima kasih telah menghubungi kami!'
    });
}
