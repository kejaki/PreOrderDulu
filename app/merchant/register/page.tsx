'use client';

import dynamic from 'next/dynamic';
import { Suspense, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { TypeSelector } from '@/components/MerchantRegistration/TypeSelector';
import { KYCUpload } from '@/components/MerchantRegistration/KYCUpload';

const LocationPicker = dynamic(
    () => import('@/components/MerchantRegistration/LocationPicker').then(mod => mod.LocationPicker),
    {
        ssr: false,
        loading: () => <div className="h-64 bg-secondary-50 animate-pulse rounded-xl" />
    }
);
import { supabase, uploadKYCDocument } from '@/lib/supabase';
import { ArrowLeft, ArrowRight, Check, Store, MapPin, FileCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

type MerchantType = 'student' | 'general' | null;

interface FormData {
    merchantName: string;
    email: string;
    password: string;
    phone: string;
    businessDescription: string;
    latitude: number | null;
    longitude: number | null;
    addressText: string;
    merchantType: MerchantType;
    emergencyContactName: string;
    emergencyContactPhone: string;
    emergencyContactRelation: string;
    ktm: File | null;
    classSchedule: File | null;
    ktp: File | null;
    ktpSelfie: File | null;
    businessPhoto: File | null;
}

export default function MerchantRegisterPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState<FormData>({
        merchantName: '',
        email: '',
        password: '',
        phone: '',
        businessDescription: '',
        latitude: null,
        longitude: null,
        addressText: '',
        merchantType: null,
        emergencyContactName: '',
        emergencyContactPhone: '',
        emergencyContactRelation: '',
        ktm: null,
        classSchedule: null,
        ktp: null,
        ktpSelfie: null,
        businessPhoto: null,
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const updateField = (field: keyof FormData, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
    };

    const validateStep = (currentStep: number): boolean => {
        const newErrors: Record<string, string> = {};

        if (currentStep === 1) {
            if (!formData.merchantName.trim()) newErrors.merchantName = 'Name is required';
            if (!formData.email.trim()) newErrors.email = 'Email is required';
            if (!formData.email.includes('@')) newErrors.email = 'Invalid email format';
            if (!formData.password || formData.password.length < 6) newErrors.password = 'Password (min 6 chars)';
            if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
            if (!formData.latitude || !formData.longitude) newErrors.location = 'Please select location';
            if (!formData.addressText.trim()) newErrors.addressText = 'Address is required';
        }

        if (currentStep === 2) {
            if (!formData.merchantType) newErrors.merchantType = 'Please select merchant type';
        }

        if (currentStep === 3) {
            if (formData.merchantType === 'student') {
                if (!formData.ktm) newErrors.ktm = 'Required';
                if (!formData.classSchedule) newErrors.classSchedule = 'Required';
                if (!formData.emergencyContactName.trim()) newErrors.emergencyContactName = 'Name required';
                if (!formData.emergencyContactPhone.trim()) newErrors.emergencyContactPhone = 'Phone required';
            } else if (formData.merchantType === 'general') {
                if (!formData.ktp) newErrors.ktp = 'Required';
                if (!formData.ktpSelfie) newErrors.ktpSelfie = 'Required';
                if (!formData.businessPhoto) newErrors.businessPhoto = 'Required';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (validateStep(step)) setStep(step + 1);
    };

    const handleSubmit = async () => {
        if (!validateStep(step)) return;

        setIsSubmitting(true);

        try {
            // 1. Sign up
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        full_name: formData.merchantName,
                        role: 'merchant'
                    }
                }
            });

            if (authError || !authData.user) throw new Error(authError?.message || 'Failed to create account');

            if (!authData.session) {
                alert('Success! Check your email to verify account.');
                router.push('/merchant/login');
                return;
            }

            // 2. Create/Update merchant record (using upsert in case trigger already created it)
            const { data: merchant, error: merchantError } = await supabase
                .from('merchants')
                .upsert({
                    id: authData.user.id,
                    merchant_name: formData.merchantName,
                    merchant_type: formData.merchantType,
                    email: formData.email,
                    phone: formData.phone,
                    latitude: formData.latitude,
                    longitude: formData.longitude,
                    address_text: formData.addressText,
                    business_description: formData.businessDescription,
                    emergency_contact_name: formData.merchantType === 'student' ? formData.emergencyContactName : null,
                    emergency_contact_phone: formData.merchantType === 'student' ? formData.emergencyContactPhone : null,
                    emergency_contact_relation: formData.merchantType === 'student' ? formData.emergencyContactRelation : null,
                    is_verified: false, // Default to false for new profiles
                    verification_status: 'pending'
                })
                .select()
                .single();

            if (merchantError || !merchant) throw new Error(merchantError?.message || 'Failed to create merchant');

            // 3. Upload KYC
            const uploadPromises: Promise<any>[] = [];
            const queueUpload = (docType: string, file: File) => uploadPromises.push(uploadAndSaveKYC(merchant.id, docType, file));

            if (formData.merchantType === 'student') {
                if (formData.ktm) queueUpload('ktm', formData.ktm);
                if (formData.classSchedule) queueUpload('class_schedule', formData.classSchedule);
                if (formData.ktp) queueUpload('ktp', formData.ktp);
            } else if (formData.merchantType === 'general') {
                if (formData.ktp) queueUpload('ktp', formData.ktp);
                if (formData.ktpSelfie) queueUpload('ktp_selfie', formData.ktpSelfie);
                if (formData.businessPhoto) queueUpload('business_photo', formData.businessPhoto);
            }

            await Promise.all(uploadPromises);

            router.push('/merchant/dashboard'); // Or logic success page? Assuming dashboard for now or login
            // Ideally login page for first time
            alert('Registration Complete! Please login.');
            router.push('/merchant/login');

        } catch (error: any) {
            console.error(error);
            alert(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    async function uploadAndSaveKYC(merchantId: string, docType: string, file: File) {
        const fileUrl = await uploadKYCDocument(merchantId, docType, file);
        if (!fileUrl) throw new Error(`Failed to upload ${docType}`);

        const { error } = await supabase.from('kyc_documents').insert({
            merchant_id: merchantId,
            document_type: docType,
            file_url: fileUrl,
            file_name: file.name,
            file_size: file.size,
            mime_type: file.type,
        });

        if (error) throw new Error(`Failed to save ${docType}`);
    }

    const steps = [
        { num: 1, label: 'Basic Info', icon: Store },
        { num: 2, label: 'Type', icon: FileCheck }, // Changed icon just to differ
        { num: 3, label: 'KYC', icon: ArrowRight }, // arrow as placeholder
    ];

    return (
        <div className="min-h-screen bg-secondary-50 py-12 px-4 selection:bg-primary-100 selection:text-primary-900">
            <div className="max-w-3xl mx-auto space-y-8">

                {/* Header */}
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold text-secondary-900">Become a Partner</h1>
                    <p className="text-secondary-500">Join the hyper-local food revolution</p>
                </div>

                {/* Stepper */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-secondary-100 flex justify-between items-center relative overflow-hidden">
                    <div className="absolute top-1/2 left-0 right-0 h-1 bg-secondary-100 -z-0 -translate-y-1/2 mx-12"></div>
                    <div
                        className="absolute top-1/2 left-0 h-1 bg-primary-DEFAULT -z-0 -translate-y-1/2 mx-12 transition-all duration-500"
                        style={{ width: `${((step - 1) / 2) * 100}%` }}
                    ></div>

                    {[1, 2, 3].map((s) => (
                        <div key={s} className="relative z-10 flex flex-col items-center bg-white px-2">
                            <motion.div
                                animate={{
                                    scale: step === s ? 1.1 : 1,
                                    backgroundColor: step >= s ? '#FF6B6B' : '#cbd5e1',
                                    borderColor: step >= s ? '#FF6B6B' : '#94a3b8'
                                }}
                                className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold border-4 transition-colors duration-300`}
                            >
                                {step > s ? <Check size={20} /> : s}
                            </motion.div>
                            <span className={`text-xs mt-2 font-bold ${step >= s ? 'text-secondary-900' : 'text-secondary-600'}`}>
                                {s === 1 && 'Info'}
                                {s === 2 && 'Type'}
                                {s === 3 && 'KYC'}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Main Form */}
                <AnimatePresence mode='wait'>
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                        className="bg-white rounded-3xl shadow-sm border border-secondary-100 p-8"
                    >
                        {step === 1 && (
                            <div className="space-y-6">
                                <h2 className="text-2xl font-bold text-secondary-900">Tell us about your business</h2>
                                <div className="grid gap-6 md:grid-cols-2">
                                    <div className='md:col-span-2'>
                                        <Input label="Merchant Name" value={formData.merchantName} onChange={e => updateField('merchantName', e.target.value)} error={errors.merchantName} required />
                                    </div>
                                    <Input label="Email" type="email" value={formData.email} onChange={e => updateField('email', e.target.value)} error={errors.email} required />
                                    <Input label="Phone (WA)" type="tel" value={formData.phone} onChange={e => updateField('phone', e.target.value)} error={errors.phone} required />
                                    <div className='md:col-span-2'>
                                        <Input label="Password" type="password" value={formData.password} onChange={e => updateField('password', e.target.value)} error={errors.password} required />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-bold text-secondary-900 mb-2">Location <span className="text-primary-DEFAULT">*</span></label>
                                        <div className="rounded-xl overflow-hidden border-2 border-dashed border-secondary-200 hover:border-primary-300 transition-colors">
                                            <Suspense fallback={<div className="h-64 bg-secondary-50 animate-pulse" />}>
                                                <LocationPicker
                                                    onLocationSelect={(lat, lng, addr) => {
                                                        updateField('latitude', lat);
                                                        updateField('longitude', lng);
                                                        updateField('addressText', addr);
                                                    }}
                                                    initialLocation={formData.latitude ? { lat: formData.latitude!, lng: formData.longitude! } : undefined}
                                                />
                                            </Suspense>
                                        </div>
                                        {formData.addressText && <p className="text-xs mt-2 text-secondary-700 flex gap-1 font-medium"><MapPin size={12} /> {formData.addressText}</p>}
                                        {errors.location && <p className="text-sm text-red-500 mt-1">{errors.location}</p>}
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-bold text-secondary-900 mb-2">Description</label>
                                        <textarea
                                            className="w-full px-4 py-3 bg-secondary-50 border-none rounded-xl focus:ring-2 focus:ring-primary-DEFAULT resize-none placeholder:text-secondary-500" rows={3}
                                            value={formData.businessDescription}
                                            onChange={e => updateField('businessDescription', e.target.value)}
                                            placeholder="What makes your food special?"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-6">
                                <h2 className="text-2xl font-bold text-secondary-900">Are you a Student?</h2>
                                <p className="text-secondary-500">Choosing the right type helps us verify your documents faster.</p>
                                <TypeSelector selected={formData.merchantType} onSelect={t => updateField('merchantType', t)} />
                                {errors.merchantType && <p className="text-red-500 text-sm bg-red-50 p-2 rounded">{errors.merchantType}</p>}
                            </div>
                        )}

                        {step === 3 && formData.merchantType && (
                            <div className="space-y-6">
                                <h2 className="text-2xl font-bold text-secondary-900">Verify your Identity</h2>
                                <KYCUpload
                                    merchantType={formData.merchantType}
                                    documents={{
                                        ktm: formData.ktm, classSchedule: formData.classSchedule, ktp: formData.ktp,
                                        ktpSelfie: formData.ktpSelfie, businessPhoto: formData.businessPhoto
                                    }}
                                    onDocumentChange={(key, file) => updateField(key as keyof FormData, file)}
                                    errors={errors}
                                />
                                {formData.merchantType === 'student' && (
                                    <div className="mt-8 pt-8 border-t border-secondary-100">
                                        <h3 className="font-bold text-lg mb-4">Emergency Contact</h3>
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <Input label="Name" value={formData.emergencyContactName} onChange={e => updateField('emergencyContactName', e.target.value)} error={errors.emergencyContactName} required />
                                            <Input label="Phone" value={formData.emergencyContactPhone} onChange={e => updateField('emergencyContactPhone', e.target.value)} error={errors.emergencyContactPhone} required />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>

                {/* Footer Nav */}
                <div className="space-y-6 pt-4">
                    <div className="flex justify-between items-center">
                        {step > 1 ? (
                            <Button variant="secondary" onClick={() => setStep(step - 1)} disabled={isSubmitting}>Back</Button>
                        ) : (
                            <Button variant="secondary" onClick={() => router.push('/')}>Cancel</Button>
                        )}

                        {step < 3 ? (
                            <Button onClick={handleNext}>Next Step <ArrowRight size={18} className="ml-2" /></Button>
                        ) : (
                            <Button onClick={handleSubmit} isLoading={isSubmitting} className="px-8">{isSubmitting ? 'Submitting...' : 'Complete Registration'}</Button>
                        )}
                    </div>

                    {step === 1 && (
                        <p className="text-center text-sm text-secondary-500">
                            Sudah punya akun mitra?{' '}
                            <Link href="/merchant/login" className="text-primary-DEFAULT font-bold hover:underline">
                                Login di sini
                            </Link>
                        </p>
                    )}
                </div>

            </div>
        </div>
    );
}
