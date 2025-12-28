'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Loader2, CheckCircle, AlertCircle, Clock, XCircle, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export default function AdminTicketPage() {
    const [tickets, setTickets] = useState<any[]>([]);
    const [filter, setFilter] = useState<'All' | 'Open' | 'Resolved'>('All');
    const [isLoading, setIsLoading] = useState(true);

    // Response State
    const [respondingId, setRespondingId] = useState<string | null>(null);
    const [responseText, setResponseText] = useState('');
    const [statusUpdate, setStatusUpdate] = useState('Resolved');

    useEffect(() => {
        fetchTickets();
    }, [filter]);

    const fetchTickets = async () => {
        setIsLoading(true);
        let query = supabase
            .from('support_tickets')
            .select('*')
            .order('created_at', { ascending: false });

        if (filter !== 'All') {
            if (filter === 'Open') query = query.in('status', ['Open', 'In Progress']);
            if (filter === 'Resolved') query = query.in('status', ['Resolved', 'Closed']);
        }

        const { data, error } = await query;
        if (data) setTickets(data);
        if (error) console.error(error);
        setIsLoading(false);
    };

    const handleUpdateTicket = async (ticketId: string) => {
        try {
            const { error } = await supabase
                .from('support_tickets')
                .update({
                    admin_response: responseText,
                    status: statusUpdate,
                    updated_at: new Date().toISOString()
                })
                .eq('id', ticketId);

            if (error) throw error;

            toast.success('Ticket updated');
            setRespondingId(null);
            setResponseText('');
            fetchTickets();
        } catch (error) {
            toast.error('Failed to update');
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Resolved': return 'bg-green-100 text-green-700';
            case 'In Progress': return 'bg-blue-100 text-blue-700';
            case 'Closed': return 'bg-slate-100 text-slate-700';
            default: return 'bg-yellow-100 text-yellow-700';
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans p-8">
            <div className="max-w-5xl mx-auto space-y-6">

                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-slate-900">Support Tickets Dashboard</h1>
                    <div className="flex gap-2">
                        {['All', 'Open', 'Resolved'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f as any)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === f
                                    ? 'bg-primary-600 text-white shadow-md'
                                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                                    }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-4">
                    {isLoading ? (
                        <div className="text-center py-12">Loading tickets...</div>
                    ) : tickets.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-xl border border-dashed">No tickets found.</div>
                    ) : (
                        tickets.map((ticket) => (
                            <div key={ticket.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded textxs font-mono">
                                                #{ticket.id.slice(0, 8)}
                                            </span>
                                            <span className="text-xs text-slate-400">
                                                {format(new Date(ticket.created_at), 'dd MMM yyyy HH:mm', { locale: id })}
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-900">{ticket.subject}</h3>
                                        <p className="text-sm text-slate-500 font-medium">{ticket.category}</p>
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(ticket.status)}`}>
                                        {ticket.status}
                                    </div>
                                </div>

                                <div className="bg-slate-50 p-4 rounded-lg text-sm text-slate-700 mb-4 whitespace-pre-wrap">
                                    {ticket.description}
                                </div>

                                {ticket.attachment_url && (
                                    <div className="mb-4">
                                        <a
                                            href={ticket.attachment_url}
                                            target="_blank"
                                            className="text-primary-600 text-sm hover:underline font-medium"
                                        >
                                            View Attachment 📎
                                        </a>
                                    </div>
                                )}

                                {/* Admin Response Section */}
                                {ticket.admin_response ? (
                                    <div className="mt-4 pt-4 border-t border-slate-100 bg-blue-50/50 p-4 rounded-lg">
                                        <div className="text-xs font-bold text-slate-900 mb-1">Your Response:</div>
                                        <p className="text-sm text-slate-700">{ticket.admin_response}</p>
                                        <button
                                            onClick={() => {
                                                setRespondingId(ticket.id);
                                                setResponseText(ticket.admin_response);
                                                setStatusUpdate(ticket.status);
                                            }}
                                            className="text-xs text-primary-600 font-bold mt-2 hover:underline"
                                        >
                                            Edit Response
                                        </button>
                                    </div>
                                ) : (
                                    !respondingId && (
                                        <Button
                                            onClick={() => setRespondingId(ticket.id)}
                                            variant="outline"
                                            size="sm"
                                        >
                                            Reply & Update
                                        </Button>
                                    )
                                )}

                                {/* Reply Editor */}
                                {respondingId === ticket.id && (
                                    <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200 animate-in fade-in slide-in-from-top-2">
                                        <h4 className="font-bold text-sm mb-2">Update Ticket</h4>
                                        <div className="space-y-3">
                                            <div>
                                                <label className="text-xs font-bold text-slate-500 block mb-1">Status</label>
                                                <div className="flex gap-2">
                                                    {['In Progress', 'Resolved', 'Closed'].map(s => (
                                                        <button
                                                            key={s}
                                                            onClick={() => setStatusUpdate(s)}
                                                            className={`px-3 py-1 rounded text-xs border ${statusUpdate === s
                                                                ? 'bg-slate-800 text-white border-slate-800'
                                                                : 'bg-white text-slate-600 border-slate-300'
                                                                }`}
                                                        >
                                                            {s}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-slate-500 block mb-1">Response</label>
                                                <textarea
                                                    value={responseText}
                                                    onChange={(e) => setResponseText(e.target.value)}
                                                    className="w-full text-sm p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                                    rows={3}
                                                    placeholder="Type your solution here..."
                                                />
                                            </div>
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="secondary"
                                                    onClick={() => {
                                                        setRespondingId(null);
                                                        setResponseText('');
                                                    }}
                                                >
                                                    Cancel
                                                </Button>
                                                <Button onClick={() => handleUpdateTicket(ticket.id)}>
                                                    <Send size={16} className="mr-2" />
                                                    Submit Update
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
