'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Store } from 'lucide-react';

export default function MerchantLoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;
            router.push('/merchant/dashboard');
        } catch (err: any) {
            setError(err.message || 'Failed to login');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-secondary-50 px-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-secondary-100"
            >
                <div className="text-center mb-8">
                    <div className="inline-flex p-3 rounded-xl bg-primary-50 text-primary-DEFAULT mb-4">
                        <Store size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-secondary-900">Welcome Back</h1>
                    <p className="text-secondary-500">Manage your store and orders</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-200"
                        >
                            {error}
                        </motion.div>
                    )}

                    <div className="space-y-4">
                        <Input
                            label="Email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="merchant@example.com"
                        />
                        <Input
                            label="Password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="••••••••"
                        />
                    </div>

                    <Button type="submit" className="w-full text-lg font-bold py-6" isLoading={isLoading}>
                        Login to Dashboard
                    </Button>
                </form>

                <div className="mt-8 text-center text-sm">
                    <p className="text-secondary-600">
                        New to PreOrderDulu?{' '}
                        <Link href="/merchant/register" className="text-primary-DEFAULT font-bold hover:underline">
                            Register as Partner
                        </Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
