import React from 'react';
import { CheckCircle2, Clock, Loader2, ArrowRight } from 'lucide-react';

const TransactionTimeline = ({ currentStage = 'CONFIRMED', txHash }) => {
  const stages = [
    { id: 'INITIATED', label: 'Initiated', desc: 'Vote request created' },
    { id: 'SIGNED', label: 'Wallet Signed', desc: 'MetaMask signature approved' },
    { id: 'BROADCAST', label: 'Submitted', desc: 'Broadcast to network mempool' },
    { id: 'MINED', label: 'Block Mined', desc: 'Included in verified block' },
    { id: 'CONFIRMED', label: 'Confirmed', desc: 'Immutable smart contract entry' },
  ];

  const getStageIndex = (stage) => {
    const idx = stages.findIndex((s) => s.id === stage);
    return idx === -1 ? 4 : idx;
  };

  const activeIdx = getStageIndex(currentStage);

  return (
    <div className="space-y-4 p-5 bg-slate-950/80 rounded-2xl border border-slate-800">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
          Transaction Lifecycle Status
        </h4>
        <span className="text-xs font-mono text-emerald-400 font-semibold bg-emerald-950/60 px-2.5 py-0.5 rounded border border-emerald-800/60">
          State: {currentStage}
        </span>
      </div>

      {/* Progress Bar Line */}
      <div className="grid grid-cols-5 gap-2 relative">
        {stages.map((stage, idx) => {
          const isPassed = idx <= activeIdx;
          const isCurrent = idx === activeIdx;

          return (
            <div key={stage.id} className="flex flex-col items-center text-center space-y-2 relative">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-xs transition-all ${
                  isPassed
                    ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                    : 'bg-slate-900 border border-slate-700 text-slate-500'
                }`}
              >
                {isPassed ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
              </div>
              <div className="space-y-0.5">
                <div className={`text-[11px] font-bold ${isPassed ? 'text-white' : 'text-slate-500'}`}>
                  {stage.label}
                </div>
                <div className="text-[10px] text-slate-400 hidden sm:block">{stage.desc}</div>
              </div>
            </div>
          );
        })}
      </div>

      {txHash && (
        <div className="pt-2 border-t border-slate-900 flex justify-between items-center text-xs font-mono text-slate-400">
          <span>Transaction Hash:</span>
          <span className="text-emerald-400 font-bold select-all break-all">{txHash}</span>
        </div>
      )}
    </div>
  );
};

export default TransactionTimeline;
