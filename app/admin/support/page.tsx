'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Loader2, Send, CheckCircle, Clock, AlertCircle, MessageCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { sendAdminMessage, resolveSession } from '@/actions/supportBot';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';

interface Session {
    id: string;
    user_id: string;
    status: string;
    created_at: string;
    updated_at: string;
}

interface Message {
    id: string;
    sender_type: 'user' | 'admin' | 'bot';
    message_type: string;
    content: string;
    attachment_url?: string;
    created_at: string;
}

export default function AdminSupportPage() {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [selectedSession, setSelectedSession] = useState<Session | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [replyText, setReplyText] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchSessions();

        // Subscribe to new sessions
        const sessionChannel = supabase
            .channel('admin-sessions')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'support_sessions'
                },
                () => {
                    fetchSessions();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(sessionChannel);
        };
    }, []);

    useEffect(() => {
        if (selectedSession) {
            fetchMessages(selectedSession.id);

            // Subscribe to new messages
            const messageChannel = supabase
                .channel(`admin-messages-${selectedSession.id}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'support_messages',
                        filter: `session_id=eq.${selectedSession.id}`
                    },
                    (payload) => {
                        setMessages((prev) => [...prev, payload.new as Message]);
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(messageChannel);
            };
        }
    }, [selectedSession]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const fetchSessions = async () => {
        setIsLoading(true);
        const { data } = await supabase
            .from('support_sessions')
            .select('*')
            .neq('status', 'resolved')
            .order('created_at', { ascending: false });

        if (data) setSessions(data);
        setIsLoading(false);
    };

    const fetchMessages = async (sessionId: string) => {
        const { data } = await supabase
            .from('support_messages')
            .select('*')
            .eq('session_id', sessionId)
            .order('created_at', { ascending: true });

        if (data) setMessages(data);
    };

    const handleSendReply = async () => {
        if (!replyText.trim() || !selectedSession || isSending) return;

        const messageContent = replyText.trim();
        setReplyText('');
        setIsSending(true);

        try {
            await sendAdminMessage(selectedSession.id, messageContent);
            toast.success('Pesan terkirim');
        } catch (error) {
            console.error('Failed to send reply:', error);
            toast.error('Gagal mengirim pesan');
        } finally {
            setIsSending(false);
        }
    };

    const handleResolve = async () => {
        if (!selectedSession) return;

        try {
            await resolveSession(selectedSession.id);
            toast.success('Sesi ditutup');
            setSelectedSession(null);
            fetchSessions();
        } catch (error) {
            console.error('Failed to resolve session:', error);
            toast.error('Gagal menutup sesi');
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'queued_for_admin': return 'bg-red-100 text-red-700 border-red-300';
            case 'live_agent': return 'bg-blue-100 text-blue-700 border-blue-300';
            case 'bot_active': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
            default: return 'bg-slate-100 text-slate-700 border-slate-300';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'queued_for_admin': return <AlertCircle size={16} />;
            case 'live_agent': return <MessageCircle size={16} />;
            case 'bot_active': return <Clock size={16} />;
            default: return <CheckCircle size={16} />;
        }
    };

    const getSenderColor = (senderType: string) => {
        switch (senderType) {
            case 'user': return 'bg-slate-100 text-slate-900';
            case 'admin': return 'bg-green-600 text-white';
            case 'bot': return 'bg-blue-100 text-blue-900';
            default: return 'bg-slate-200 text-slate-900';
        }
    };

    const getSenderAlign = (senderType: string) => {
        return senderType === 'admin' ? 'justify-end' : 'justify-start';
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            <div className="flex h-screen">
                {/* Sidebar - Sessions List */}
                <div className="w-80 bg-white border-r border-slate-200 flex flex-col">
                    <div className="p-4 border-b border-slate-200">
                        <h1 className="text-xl font-bold text-slate-900">Support Dashboard</h1>
                        <p className="text-sm text-slate-500">{sessions.length} sesi aktif</p>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {isLoading ? (
                            <div className="flex justify-center items-center h-32">
                                <Loader2 className="animate-spin text-primary-600" size={32} />
                            </div>
                        ) : sessions.length === 0 ? (
                            <div className="p-4 text-center text-slate-400">
                                <MessageCircle size={48} className="mx-auto mb-2 opacity-20" />
                                <p className="text-sm">Tidak ada sesi aktif</p>
                            </div>
                        ) : (
                            sessions.map((session) => (
                                <button
                                    key={session.id}
                                    onClick={() => setSelectedSession(session)}
                                    className={`w-full p-4 border-b border-slate-100 text-left transition-colors ${selectedSession?.id === session.id
                                        ? 'bg-primary-50 border-l-4 border-l-primary-600'
                                        : 'hover:bg-slate-50'
                                        }`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-medium text-sm text-slate-900">
                                            Session #{session.id.slice(0, 8)}
                                        </span>
                                        <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 border ${getStatusColor(session.status)}`}>
                                            {getStatusIcon(session.status)}
                                            {session.status.replace('_', ' ')}
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-500">
                                        {formatDistanceToNow(new Date(session.created_at), { addSuffix: true, locale: id })}
                                    </p>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Chat Area */}
                <div className="flex-1 flex flex-col">
                    {selectedSession ? (
                        <>
                            {/* Chat Header */}
                            <div className="bg-white border-b border-slate-200 p-4 flex justify-between items-center">
                                <div>
                                    <h2 className="font-bold text-slate-900">Session #{selectedSession.id.slice(0, 8)}</h2>
                                    <p className="text-sm text-slate-500">
                                        {selectedSession.user_id
                                            ? `User ID: ${selectedSession.user_id.slice(0, 8)}...`
                                            : 'Guest User'
                                        }
                                    </p>
                                </div>
                                <Button
                                    onClick={handleResolve}
                                    variant="outline"
                                    size="sm"
                                    className="bg-green-50 border-green-600 text-green-700 hover:bg-green-100"
                                >
                                    <CheckCircle size={16} className="mr-1" />
                                    Resolve
                                </Button>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
                                {messages.map((message) => (
                                    <div key={message.id} className={`flex ${getSenderAlign(message.sender_type)}`}>
                                        <div className="max-w-[70%]">
                                            {message.message_type === 'text' && (
                                                <div className={`px-4 py-2 rounded-2xl ${getSenderColor(message.sender_type)}`}>
                                                    <div className="text-[10px] font-bold mb-1 opacity-70 uppercase">
                                                        {message.sender_type}
                                                    </div>
                                                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                                </div>
                                            )}

                                            {message.message_type === 'options' && (
                                                <div className="space-y-2">
                                                    {JSON.parse(message.content).map((option: string, idx: number) => (
                                                        <div
                                                            key={idx}
                                                            className="px-4 py-2 bg-blue-50 border border-blue-200 text-blue-700 rounded-full text-sm"
                                                        >
                                                            {option}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {message.message_type === 'image' && message.attachment_url && (
                                                <div>
                                                    <img
                                                        src={message.attachment_url}
                                                        alt="Attachment"
                                                        className="rounded-lg max-w-full max-h-64 object-cover"
                                                    />
                                                </div>
                                            )}

                                            <p className="text-[10px] text-slate-400 mt-1 px-2">
                                                {new Date(message.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Reply Input */}
                            <div className="bg-white border-t border-slate-200 p-4">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSendReply()}
                                        placeholder="Ketik balasan Anda..."
                                        className="flex-1 px-4 py-3 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        disabled={isSending}
                                    />
                                    <Button
                                        onClick={handleSendReply}
                                        disabled={!replyText.trim() || isSending}
                                        className="rounded-xl px-6"
                                    >
                                        {isSending ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                                    </Button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-slate-400">
                            <div className="text-center">
                                <MessageCircle size={64} className="mx-auto mb-4 opacity-20" />
                                <p className="text-lg font-medium">Pilih sesi dari sidebar</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
