import React from 'react';
import { CheckCircle2 } from 'lucide-react';

const ElectionLifecycle = ({ currentStatus = 'ACTIVE' }) => {
  const steps = [
    { key: 'DRAFT', label: 'Draft' },
    { key: 'UPCOMING', label: 'Scheduled' },
    { key: 'ACTIVE', label: 'Voting Active' },
    { key: 'ENDED', label: 'Polls Closed' },
    { key: 'VERIFIED', label: 'Tally Finalized' },
  ];

  const getActiveIndex = (status) => {
    switch (status) {
      case 'DRAFT': return 0;
      case 'UPCOMING': return 1;
      case 'ACTIVE': return 2;
      case 'ENDED': return 3;
      case 'VERIFIED': return 4;
      default: return 2;
    }
  };

  const activeIdx = getActiveIndex(currentStatus);

  return (
    <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-3">
      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
        Election Lifecycle Progress
      </div>
      <div className="flex items-center justify-between gap-1 overflow-x-auto pb-1">
        {steps.map((step, idx) => {
          const isPassed = idx <= activeIdx;
          const isCurrent = idx === activeIdx;

          return (
            <React.Fragment key={step.key}>
              <div className="flex flex-col items-center flex-shrink-0">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                    isCurrent
                      ? 'bg-indigo-600 text-white ring-4 ring-indigo-500/20'
                      : isPassed
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-slate-900 border border-slate-700 text-slate-500'
                  }`}
                >
                  {isPassed ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
                </div>
                <span className={`text-[10px] font-medium mt-1 ${isCurrent ? 'text-indigo-400 font-bold' : isPassed ? 'text-slate-300' : 'text-slate-600'}`}>
                  {step.label}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div className={`flex-1 h-0.5 min-w-[1.5rem] ${idx < activeIdx ? 'bg-emerald-500' : 'bg-slate-800'}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default ElectionLifecycle;
