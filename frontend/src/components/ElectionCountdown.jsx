import React, { useState, useEffect } from 'react';
import { Clock, AlertCircle } from 'lucide-react';

const ElectionCountdown = ({ startTime, endTime, status }) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: false });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const targetDate = status === 'UPCOMING' ? new Date(startTime).getTime() : new Date(endTime).getTime();
      const difference = targetDate - now;

      if (difference <= 0 || status === 'ENDED') {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds, isExpired: false });
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [startTime, endTime, status]);

  if (status === 'ENDED' || timeLeft.isExpired) {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-400 font-medium">
        <Clock className="w-3.5 h-3.5 text-slate-500" />
        <span>Voting Ended</span>
      </div>
    );
  }

  const label = status === 'UPCOMING' ? 'Starts In:' : 'Ends In:';

  return (
    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-slate-950/90 border border-indigo-900/60 rounded-xl text-xs font-mono shadow-inner">
      <span className="text-slate-400 font-sans font-semibold text-[11px] uppercase tracking-wider">{label}</span>
      <div className="flex items-center gap-1 font-bold text-indigo-400">
        {timeLeft.days > 0 && <span>{timeLeft.days}d</span>}
        <span>{String(timeLeft.hours).padStart(2, '0')}h</span>
        <span>:</span>
        <span>{String(timeLeft.minutes).padStart(2, '0')}m</span>
        <span>:</span>
        <span className="text-emerald-400">{String(timeLeft.seconds).padStart(2, '0')}s</span>
      </div>
    </div>
  );
};

export default ElectionCountdown;
