import React from 'react';
import { Inbox } from 'lucide-react';
import Button from './Button';

const EmptyState = ({
  icon: Icon = Inbox,
  title = 'No Data Found',
  description = 'There are no items to display at this time.',
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div className={`p-8 sm:p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800/80 flex flex-col items-center justify-center space-y-4 ${className}`}>
      <div className="p-4 bg-slate-800/60 text-slate-400 rounded-2xl border border-slate-700/50 shadow-inner">
        <Icon className="w-8 h-8 sm:w-10 sm:h-10" />
      </div>
      <div className="max-w-md space-y-1">
        <h3 className="text-lg font-bold text-white tracking-tight">{title}</h3>
        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">{description}</p>
      </div>
      {actionLabel && onAction && (
        <div className="pt-2">
          <Button onClick={onAction} size="sm">
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
};

export default EmptyState;
