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

    // Main Menu
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

async function handleTrackOrder(sessionId: string) {
    // Get user ID from session
    const { data: session } = await supabaseAdmin
        .from('support_sessions')
        .select('user_id')
        .eq('id', sessionId)
        .single();

    if (!session) return;

    // Fetch active orders - using guest_whatsapp since orders are guest-based
    // We'll need to get the user's phone/whatsapp from their profile or ask them
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
