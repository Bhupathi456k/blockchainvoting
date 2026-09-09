import React from 'react';

const Badge = ({ children, variant = 'default', size = 'md', className = '' }) => {
  const variants = {
    default: 'bg-slate-800 text-slate-300 border-slate-700',
    primary: 'bg-indigo-950 text-indigo-400 border-indigo-800',
    success: 'bg-green-950 text-green-400 border-green-800',
    warning: 'bg-amber-950 text-amber-400 border-amber-800',
    danger: 'bg-red-950 text-red-400 border-red-800',
    info: 'bg-blue-950 text-blue-400 border-blue-800',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  };

  return (
    <span
      className={`
        inline-flex items-center font-medium rounded-full border
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
    >
      {children}
    </span>
  );
};

export { Badge };
export default Badge;
