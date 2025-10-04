import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hideLabel?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({ label, id, className, hideLabel, ...props }, ref) => {
  const inputId = id || label.replace(/\s+/g, '-').toLowerCase();

  return (
    <div className="flex flex-col w-full">
      <label htmlFor={inputId} className={`mb-1.5 text-sm font-medium text-slate-400 ${hideLabel ? 'sr-only' : ''}`}>
        {label}
      </label>
      <input
        ref={ref}
        id={inputId}
        className={`bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-colors w-full ${className}`}
        {...props}
      />
    </div>
  );
});

Input.displayName = 'Input';

export default Input;