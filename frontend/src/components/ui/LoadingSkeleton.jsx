import React from 'react';

export const CardSkeleton = () => (
  <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4 animate-pulse">
    <div className="h-5 bg-slate-800 rounded-md w-1/3" />
    <div className="h-8 bg-slate-800 rounded-lg w-2/3" />
    <div className="h-4 bg-slate-800/60 rounded-md w-1/2" />
  </div>
);

export const TableSkeleton = ({ rows = 5 }) => (
  <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden animate-pulse">
    <div className="p-4 border-b border-slate-800 bg-slate-950/40 h-10 w-full" />
    <div className="divide-y divide-slate-800/60">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="p-4 flex items-center justify-between gap-4">
          <div className="h-4 bg-slate-800 rounded w-1/4" />
          <div className="h-4 bg-slate-800/80 rounded w-1/6" />
          <div className="h-4 bg-slate-800/60 rounded w-1/5" />
          <div className="h-8 bg-slate-800 rounded-lg w-20" />
        </div>
      ))}
    </div>
  </div>
);

export const ChartSkeleton = () => (
  <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-6 animate-pulse">
    <div className="flex justify-between items-center">
      <div className="h-6 bg-slate-800 rounded w-1/4" />
      <div className="h-8 bg-slate-800 rounded-lg w-28" />
    </div>
    <div className="h-48 bg-slate-800/40 rounded-xl flex items-end p-4 gap-3">
      <div className="w-1/6 h-2/3 bg-slate-800 rounded-t" />
      <div className="w-1/6 h-full bg-slate-800 rounded-t" />
      <div className="w-1/6 h-1/2 bg-slate-800 rounded-t" />
      <div className="w-1/6 h-4/5 bg-slate-800 rounded-t" />
      <div className="w-1/6 h-1/3 bg-slate-800 rounded-t" />
      <div className="w-1/6 h-3/4 bg-slate-800 rounded-t" />
    </div>
  </div>
);

export default CardSkeleton;
