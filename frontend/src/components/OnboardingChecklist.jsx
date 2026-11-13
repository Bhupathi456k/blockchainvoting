import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CheckCircle2, Circle, Sparkles, ChevronRight, X } from 'lucide-react';
import Card from './ui/Card';

const OnboardingChecklist = ({ activeElection }) => {
  const { user, walletConnected, canHostElections } = useAuth();
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const isHost = canHostElections;

  const voterTasks = [
    {
      id: 1,
      title: 'Create Account & Verify Identity',
      completed: true,
      action: () => navigate('/profile'),
    },
    {
      id: 2,
      title: 'Connect Web3 Wallet (MetaMask)',
      completed: walletConnected,
      action: () => navigate('/settings/security'),
    },
    {
      id: 3,
      title: 'Explore Active Elections',
      completed: false,
      action: () => navigate('/elections'),
    },
    {
      id: 4,
      title: 'Cast First Encrypted Ballot',
      completed: !!user?.hasVoted,
      action: () => (activeElection ? navigate(`/elections/${activeElection.id}`) : navigate('/elections')),
    },
  ];

  const hostTasks = [
    {
      id: 1,
      title: 'Obtain Election Host Authorization',
      completed: true,
      action: () => navigate('/host-request'),
    },
    {
      id: 2,
      title: 'Configure New Election Metadata',
      completed: false,
      action: () => navigate('/elections/create'),
    },
    {
      id: 3,
      title: 'Register Candidates on Smart Contract',
      completed: false,
      action: () => navigate('/elections/create'),
    },
    {
      id: 4,
      title: 'Publish & Launch Live Voting',
      completed: false,
      action: () => navigate('/host/elections'),
    },
  ];

  const tasks = isHost ? hostTasks : voterTasks;
  const completedCount = tasks.filter((t) => t.completed).length;
  const progressPercent = Math.round((completedCount / tasks.length) * 100);

  if (completedCount === tasks.length) return null; // Hide if 100% complete

  return (
    <Card className="p-6 mb-8 border-indigo-900/40 bg-gradient-to-r from-slate-900 via-indigo-950/20 to-slate-900 relative overflow-hidden shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              {isHost ? 'Host Onboarding Checklist' : 'Voter Onboarding Checklist'}
            </h3>
            <p className="text-xs text-slate-400">
              Complete these steps to fully utilize the BlockVote platform
            </p>
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-slate-500 hover:text-white p-1 rounded-lg transition-colors"
          title="Dismiss Checklist"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="mb-5 space-y-1.5">
        <div className="flex justify-between text-xs font-semibold text-slate-400">
          <span>Completion Progress</span>
          <span className="text-indigo-400">{completedCount} of {tasks.length} Completed ({progressPercent}%)</span>
        </div>
        <div className="w-full bg-slate-950/80 rounded-full h-2 overflow-hidden border border-slate-800">
          <div
            className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-2 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Task List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {tasks.map((task) => (
          <div
            key={task.id}
            onClick={task.action}
            className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
              task.completed
                ? 'bg-slate-950/40 border-slate-800 text-slate-400'
                : 'bg-slate-900/90 border-slate-700 hover:border-indigo-500 text-white hover:shadow-md'
            }`}
          >
            <div className="flex items-center gap-3">
              {task.completed ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              ) : (
                <Circle className="w-5 h-5 text-slate-500 flex-shrink-0" />
              )}
              <span className={`text-xs sm:text-sm font-medium ${task.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                {task.title}
              </span>
            </div>
            {!task.completed && <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />}
          </div>
        ))}
      </div>
    </Card>
  );
};

export default OnboardingChecklist;
