import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helperText?: string;
}

export function Input({
    label,
    error,
    helperText,
    className = '',
    ...props
}: InputProps) {
    return (
        <div className="w-full">
            {label && (
                <label className="block text-sm font-bold text-secondary-900 mb-1">
                    {label}
                    {props.required && <span className="text-primary-DEFAULT ml-1">*</span>}
                </label>
            )}
            <input
                className={`
          w-full px-4 py-2 border rounded-lg
          focus:ring-2 focus:ring-primary-DEFAULT focus:border-primary-DEFAULT
          ${error ? 'border-red-500' : 'border-secondary-200'}
          ${props.disabled ? 'bg-secondary-50 cursor-not-allowed' : 'bg-white'}
          ${className}
        `}
                {...props}
            />
            {error && (
                <p className="mt-1 text-sm text-red-600">{error}</p>
            )}
            {helperText && !error && (
                <p className="mt-1 text-sm text-secondary-600">{helperText}</p>
            )}
        </div>
    );
}
