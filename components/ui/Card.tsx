
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={`bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-xl shadow-lg p-6 transition-colors hover:border-slate-700 ${className}`}>
      {children}
    </div>
  );
};

export default Card;