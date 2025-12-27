'use client';

import { useState, useRef } from 'react';
import { Upload, X, FileText, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface KYCUploadProps {
    merchantType: 'student' | 'general';
    documents: {
        ktm: File | null;
        classSchedule: File | null;
        ktp: File | null;
        ktpSelfie: File | null;
        businessPhoto: File | null;
    };
    onDocumentChange: (docType: keyof KYCUploadProps['documents'], file: File | null) => void;
    errors: Record<string, string>;
}

interface DocumentConfig {
    key: keyof KYCUploadProps['documents'];
    label: string;
    required: boolean;
    accept: string;
    helperText: string;
}

export function KYCUpload({ merchantType, documents, onDocumentChange, errors }: KYCUploadProps) {
    const studentDocs: DocumentConfig[] = [
        {
            key: 'ktm',
            label: 'Student ID (KTM)',
            required: true,
            accept: 'image/*',
            helperText: 'Upload a clear photo of your Student ID',
        },
        {
            key: 'classSchedule',
            label: 'Class Schedule',
            required: true,
            accept: 'image/*,application/pdf',
            helperText: 'Upload your class schedule or academic proof',
        },
        {
            key: 'ktp',
            label: 'KTP (National ID)',
            required: false,
            accept: 'image/*',
            helperText: 'Optional for students',
        },
    ];

    const generalDocs: DocumentConfig[] = [
        {
            key: 'ktp',
            label: 'KTP (National ID)',
            required: true,
            accept: 'image/*',
            helperText: 'Upload a clear photo of your KTP',
        },
        {
            key: 'ktpSelfie',
            label: 'Selfie with KTP',
            required: true,
            accept: 'image/*',
            helperText: 'Take a selfie while holding your KTP',
        },
        {
            key: 'businessPhoto',
            label: 'Business/Kitchen Photo',
            required: true,
            accept: 'image/*',
            helperText: 'Show your kitchen or business setup',
        },
    ];

    const docsToShow = merchantType === 'student' ? studentDocs : generalDocs;

    return (
        <div className="space-y-6">
            <AnimatePresence mode="popLayout">
                {docsToShow.map((doc, idx) => (
                    <motion.div
                        key={doc.key}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                    >
                        <DocumentUploadField
                            config={doc}
                            file={documents[doc.key]}
                            onChange={(file) => onDocumentChange(doc.key, file)}
                            error={errors[doc.key]}
                        />
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}

interface DocumentUploadFieldProps {
    config: DocumentConfig;
    file: File | null;
    onChange: (file: File | null) => void;
    error?: string;
}

function DocumentUploadField({ config, file, onChange, error }: DocumentUploadFieldProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | null>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            onChange(selectedFile);
            if (selectedFile.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onloadend = () => setPreview(reader.result as string);
                reader.readAsDataURL(selectedFile);
            } else {
                setPreview(null);
            }
        }
    };

    const handleRemove = () => {
        onChange(null);
        setPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div>
            <label className="block text-sm font-bold text-secondary-900 mb-2">
                {config.label}
                {config.required && <span className="text-primary-DEFAULT ml-1">*</span>}
            </label>

            {!file ? (
                <motion.div
                    whileHover={{ scale: 1.01, borderColor: '#FF6B6B', backgroundColor: '#FFF5F5' }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`
            border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
            transition-all duration-200
            ${error ? 'border-red-300 bg-red-50' : 'border-secondary-200 bg-secondary-50'}
          `}
                >
                    <Upload className={`mx-auto mb-3 ${error ? 'text-red-400' : 'text-secondary-400'}`} size={32} />
                    <p className="font-medium text-secondary-700 mb-1">Click to upload</p>
                    <p className="text-xs text-secondary-500">{config.helperText}</p>
                </motion.div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="border-2 border-primary-200 bg-primary-50 rounded-xl p-4"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                            {preview ? (
                                <img src={preview} alt="Preview" className="w-16 h-16 object-cover rounded-lg shadow-sm" />
                            ) : (
                                <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center">
                                    <FileText className="text-primary-500" size={32} />
                                </div>
                            )}
                            <div className="min-w-0 flex-1">
                                <p className="font-bold text-secondary-900 truncate">{file.name}</p>
                                <p className="text-xs text-secondary-500">{(file.size / 1024).toFixed(1)} KB</p>
                            </div>
                            <CheckCircle className="text-green-500 flex-shrink-0" size={24} />
                        </div>
                        <button
                            type="button"
                            onClick={handleRemove}
                            className="ml-2 p-2 text-red-500 hover:bg-red-100 rounded-full transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </motion.div>
            )}

            <input
                ref={fileInputRef}
                type="file"
                accept={config.accept}
                onChange={handleFileSelect}
                className="hidden"
            />

            {error && <p className="mt-2 text-sm text-red-600 flex items-center gap-1"><X size={14} /> {error}</p>}
        </div>
    );
}
