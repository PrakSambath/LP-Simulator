import React from 'react';

interface StatProps {
  label: string;
  value: string | number;
  subValue?: string;
  valueColor?: string;
  className?: string;
  variant?: 'default' | 'minimal';
}

const Stat: React.FC<StatProps> = ({ label, value, subValue, valueColor = 'text-slate-50', className = '', variant = 'default' }) => {
  const containerClasses = variant === 'default'
    ? 'bg-slate-900/50 p-3 rounded-lg border border-slate-700'
    : '';

  return (
    <div className={`${containerClasses} ${className}`}>
      <p className="text-sm text-slate-400">{label}</p>
      <div className="flex items-baseline space-x-2">
        <p className={`text-xl font-semibold ${valueColor}`}>{value}</p>
        {subValue && <p className="text-sm text-slate-500">{subValue}</p>}
      </div>
    </div>
  );
};

export default Stat;