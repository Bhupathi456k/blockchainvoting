import React from 'react';

const Card = ({
  children,
  className = '',
  header,
  footer,
  hover = false,
  onClick,
}) => {
  return (
    <div
      className={`
        bg-slate-900 border border-slate-800 rounded-xl overflow-hidden
        ${hover ? 'hover:border-slate-700 transition-all duration-200 cursor-pointer' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {header && (
        <div className="px-6 py-4 border-b border-slate-800">
          {header}
        </div>
      )}

      <div className="p-6">
        {children}
      </div>

      {footer && (
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/50">
          {footer}
        </div>
      )}
    </div>
  );
};

export { Card };
export default Card;
