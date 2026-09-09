import React from 'react';
import { Loader2 } from 'lucide-react';

const Button = React.forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  ...props
}, ref) => {
  const baseStyles = 'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap';

  const variants = {
    primary: 'bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white shadow-lg shadow-indigo-900/30 focus:ring-indigo-500',
    secondary: 'bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-white border border-slate-700 focus:ring-slate-500',
    outline: 'bg-transparent hover:bg-slate-800/50 active:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 hover:border-slate-600 focus:ring-slate-500',
    ghost: 'bg-transparent hover:bg-slate-800/50 active:bg-slate-800/70 text-slate-300 hover:text-white focus:ring-slate-500',
    danger: 'bg-red-600 hover:bg-red-500 active:bg-red-700 text-white shadow-lg shadow-red-900/30 focus:ring-red-500',
    success: 'bg-green-600 hover:bg-green-500 active:bg-green-700 text-white shadow-lg shadow-green-900/30 focus:ring-green-500',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-sm sm:text-base',
    lg: 'px-6 py-3 text-base sm:text-lg',
    xl: 'px-8 py-4 text-lg sm:text-xl',
  };

  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {!loading && LeftIcon && <LeftIcon className="h-4 w-4" />}
      {children}
      {!loading && RightIcon && <RightIcon className="h-4 w-4" />}
    </button>
  );
});

Button.displayName = 'Button';

export { Button };
export default Button;
