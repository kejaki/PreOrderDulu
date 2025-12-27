import React from 'react';

interface BadgeProps {
    children: React.ReactNode;
    variant?: 'success' | 'warning' | 'danger' | 'info' | 'default';
    size?: 'sm' | 'md';
    className?: string; // Added className prop
}

export function Badge({ children, variant = 'default', size = 'md', className = '' }: BadgeProps) {
    const variantStyles = {
        success: 'bg-green-100 text-green-800 border-green-200',
        warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        danger: 'bg-red-50 text-red-600 border-red-200',
        info: 'bg-blue-50 text-blue-700 border-blue-200',
        default: 'bg-secondary-100 text-secondary-800 border-secondary-200',
    };

    const sizeStyles = {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-3 py-1 text-sm',
    };

    return (
        <span
            className={`
        inline-flex items-center font-bold rounded-full border
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
        >
            {children}
        </span>
    );
}
