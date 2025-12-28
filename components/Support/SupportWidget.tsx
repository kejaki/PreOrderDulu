'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Headphones, X, Send, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';
import { createSupportSession, handleBotResponse, sendUserMessage } from '@/actions/supportBot';

interface Message {
    id: string;
    sender_type: 'user' | 'admin' | 'bot';
    message_type: 'text' | 'options' | 'order_card' | 'image';
    content: string;
    attachment_url?: string;
    created_at: string;
}

export function SupportWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Initialize session when widget opens
    useEffect(() => {
        if (isOpen && !sessionId) {
            initializeSession();
        }
    }, [isOpen]);

    // Subscribe to new messages
    useEffect(() => {
        if (!sessionId) return;

        // Fetch existing messages
        fetchMessages();

        // Subscribe to realtime updates
        const channel = supabase
            .channel(`support-${sessionId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'support_messages',
                    filter: `session_id=eq.${sessionId}`
                },
                (payload) => {
                    setMessages((prev) => [...prev, payload.new as Message]);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [sessionId]);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const initializeSession = async () => {
        setIsLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                toast.error('Anda harus login terlebih dahulu');
                setIsOpen(false);
                return;
            }

            const session = await createSupportSession(user.id);
            setSessionId(session.id);
        } catch (error) {
            console.error('Failed to create session:', error);
            toast.error('Gagal memulai chat');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchMessages = async () => {
        if (!sessionId) return;

        const { data, error } = await supabase
            .from('support_messages')
            .select('*')
            .eq('session_id', sessionId)
            .order('created_at', { ascending: true });

        if (data) setMessages(data);
    };

    const handleSendMessage = async () => {
        if (!inputText.trim() || !sessionId || isSending) return;

        const messageContent = inputText.trim();
        setInputText('');
        setIsSending(true);

        try {
            await sendUserMessage(sessionId, messageContent);

            // Trigger bot response
            await handleBotResponse(sessionId, messageContent);
        } catch (error) {
            console.error('Failed to send message:', error);
            toast.error('Gagal mengirim pesan');
        } finally {
            setIsSending(false);
        }
    };

    const handleOptionClick = async (option: string) => {
        if (isSending || !sessionId) return;
        setIsSending(true);

        try {
            await sendUserMessage(sessionId, option);
            await handleBotResponse(sessionId, option);
        } catch (error) {
            console.error('Failed to select option:', error);
            toast.error('Gagal memilih opsi');
        } finally {
            setIsSending(false);
        }
    };

    const getSenderColor = (senderType: string) => {
        switch (senderType) {
            case 'user': return 'bg-primary-600 text-white';
            case 'admin': return 'bg-green-600 text-white';
            case 'bot': return 'bg-slate-100 text-slate-900';
            default: return 'bg-slate-200 text-slate-900';
        }
    };

    const getSenderAlign = (senderType: string) => {
        return senderType === 'user' ? 'justify-end' : 'justify-start';
    };

    return (
        <>
            {/* Floating Action Button */}
            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-6 right-6 z-50 bg-primary-600 hover:bg-primary-700 text-white rounded-full p-4 shadow-2xl"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
            >
                {isOpen ? <X size={24} /> : <Headphones size={24} />}
            </motion.button>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="fixed bottom-24 right-6 w-[350px] h-[500px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col z-40 overflow-hidden"
                    >
                        {/* Header */}
                        <div className="bg-primary-600 text-white p-4">
                            <h3 className="font-bold text-lg">Customer Support</h3>
                            <p className="text-xs text-primary-100">Online - Siap membantu Anda</p>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
                            {isLoading ? (
                                <div className="flex justify-center items-center h-full">
                                    <Loader2 className="animate-spin text-primary-600" size={32} />
                                </div>
                            ) : (
                                messages.map((message) => (
                                    <div key={message.id} className={`flex ${getSenderAlign(message.sender_type)}`}>
                                        <div className="max-w-[80%]">
                                            {/* Text Message */}
                                            {message.message_type === 'text' && (
                                                <div className={`px-4 py-2 rounded-2xl ${getSenderColor(message.sender_type)}`}>
                                                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                                </div>
                                            )}

                                            {/* Options */}
                                            {message.message_type === 'options' && (
                                                <div className="space-y-2">
                                                    {JSON.parse(message.content).map((option: string) => (
                                                        <button
                                                            key={option}
                                                            onClick={() => handleOptionClick(option)}
                                                            disabled={isSending}
                                                            className="w-full px-4 py-2 bg-white border-2 border-primary-600 text-primary-600 rounded-full text-sm font-medium hover:bg-primary-50 transition-colors disabled:opacity-50"
                                                        >
                                                            {option}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Image */}
                                            {message.message_type === 'image' && message.attachment_url && (
                                                <div>
                                                    <img
                                                        src={message.attachment_url}
                                                        alt="Attachment"
                                                        className="rounded-lg max-w-full max-h-48 object-cover"
                                                    />
                                                    {message.content && (
                                                        <div className={`mt-1 px-4 py-2 rounded-2xl ${getSenderColor(message.sender_type)}`}>
                                                            <p className="text-sm">{message.content}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Timestamp */}
                                            <p className="text-[10px] text-slate-400 mt-1 px-2">
                                                {new Date(message.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="p-3 bg-white border-t border-slate-200">
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                    placeholder="Ketik pesan..."
                                    className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    disabled={isSending || isLoading}
                                />
                                <button
                                    onClick={handleSendMessage}
                                    disabled={!inputText.trim() || isSending || isLoading}
                                    className="bg-primary-600 hover:bg-primary-700 text-white rounded-full p-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {isSending ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
