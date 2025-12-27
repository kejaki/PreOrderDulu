'use client';

import { GraduationCap, Store } from 'lucide-react';
import { motion } from 'framer-motion';

interface TypeSelectorProps {
    selected: 'student' | 'general' | null;
    onSelect: (type: 'student' | 'general') => void;
}

export function TypeSelector({ selected, onSelect }: TypeSelectorProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Student Option */}
            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => onSelect('student')}
                className={`
          p-6 rounded-2xl border-2 transition-all duration-300 relative overflow-hidden text-left
          ${selected === 'student'
                        ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200 ring-offset-2'
                        : 'border-secondary-100 bg-white hover:border-primary-300 hover:shadow-lg'
                    }
        `}
            >
                {selected === 'student' && (
                    <motion.div layoutId="active-ring" className="absolute inset-0 border-2 border-primary-500 rounded-2xl pointer-events-none" />
                )}

                <div className="flex flex-col items-center text-center relative z-10">
                    <div className={`p-4 rounded-full mb-4 transition-colors ${selected === 'student' ? 'bg-primary-DEFAULT text-white shadow-primary-500/30 shadow-lg' : 'bg-secondary-50 text-secondary-400'}`}>
                        <GraduationCap size={32} />
                    </div>
                    <h3 className={`text-lg font-bold mb-2 ${selected === 'student' ? 'text-primary-900' : 'text-secondary-900'}`}>Student (Pelajar)</h3>
                    <ul className="text-sm text-secondary-600 text-left space-y-2 w-full pl-4">
                        <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary-DEFAULT" /> KTM required</li>
                        <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary-DEFAULT" /> Class schedule</li>
                        <li className="text-green-600 font-medium flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-green-500" /> KTP optional</li>
                    </ul>
                </div>
            </motion.button>

            {/* General Option */}
            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => onSelect('general')}
                className={`
          p-6 rounded-2xl border-2 transition-all duration-300 relative overflow-hidden text-left
          ${selected === 'general'
                        ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200 ring-offset-2'
                        : 'border-secondary-100 bg-white hover:border-primary-300 hover:shadow-lg'
                    }
        `}
            >
                {selected === 'general' && (
                    <motion.div layoutId="active-ring" className="absolute inset-0 border-2 border-primary-500 rounded-2xl pointer-events-none" />
                )}

                <div className="flex flex-col items-center text-center relative z-10">
                    <div className={`p-4 rounded-full mb-4 transition-colors ${selected === 'general' ? 'bg-primary-DEFAULT text-white shadow-primary-500/30 shadow-lg' : 'bg-secondary-50 text-secondary-400'}`}>
                        <Store size={32} />
                    </div>
                    <h3 className={`text-lg font-bold mb-2 ${selected === 'general' ? 'text-primary-900' : 'text-secondary-900'}`}>General (Umum)</h3>
                    <ul className="text-sm text-secondary-600 text-left space-y-2 w-full pl-4">
                        <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary-DEFAULT" /> KTP required</li>
                        <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary-DEFAULT" /> Selfie with KTP</li>
                        <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary-DEFAULT" /> Business photo</li>
                    </ul>
                </div>
            </motion.button>
        </div>
    );
}
