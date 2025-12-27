'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { motion } from 'framer-motion';

interface RevenueChartProps {
    data: { day_name: string; revenue: number }[];
    isLoading: boolean;
}

export function RevenueChart({ data, isLoading }: RevenueChartProps) {
    if (isLoading) {
        return <div className="bg-white rounded-3xl p-6 h-[300px] shadow-sm animate-pulse bg-gray-50" />;
    }

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-slate-900 text-white p-3 rounded-xl text-sm shadow-xl">
                    <p className="font-bold mb-1">{label}</p>
                    <p className="text-rose-400 font-mono">
                        Rp {payload[0].value.toLocaleString('id-ID')}
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 h-[350px] flex flex-col"
        >
            <div className="mb-6">
                <h3 className="text-lg font-bold text-slate-900">Revenue Trend</h3>
                <p className="text-slate-500 text-sm">Last 7 Days Performance</p>
            </div>

            <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <XAxis
                            dataKey="day_name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#94a3b8', fontSize: 12 }}
                            dy={10}
                        />
                        <YAxis
                            hide={false}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#94a3b8', fontSize: 10 }}
                            tickFormatter={(value) => `${value / 1000}k`}
                        />
                        <Tooltip cursor={{ fill: '#f1f5f9', radius: 8 }} content={<CustomTooltip />} />
                        <Bar dataKey="revenue" radius={[6, 6, 6, 6]} barSize={32}>
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.revenue > 0 ? '#e11d48' : '#f1f5f9'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    );
}
