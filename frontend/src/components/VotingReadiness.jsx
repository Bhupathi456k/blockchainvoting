import React from 'react';
import { CheckCircle2, XCircle, ShieldCheck, AlertTriangle, Wallet, Lock, Play } from 'lucide-react';
import Card from './ui/Card';
import Button from './ui/Button';
import { useAuth } from '../context/AuthContext';

const VotingReadiness = ({ election, onStartVoting }) => {
  const { user, walletConnected, connectWallet } = useAuth();

  const checks = [
    {
      id: 'auth',
      label: 'User Authenticated',
      passed: !!user,
      detail: user ? `Signed in as ${user.name} (${user.voterId})` : 'Authentication required',
    },
    {
      id: 'wallet',
      label: 'MetaMask Wallet Connected',
      passed: walletConnected,
      detail: walletConnected ? 'Web3 wallet connected & verified' : 'Wallet connection required',
      fixAction: !walletConnected ? connectWallet : null,
      fixLabel: 'Connect Wallet',
    },
    {
      id: 'eligible',
      label: 'Voter Eligibility Status',
      passed: user?.isEligible !== false,
      detail: user?.isEligible !== false ? 'Verified eligible voter' : 'Account not eligible for this election',
    },
    {
      id: 'active',
      label: 'Election Active Status',
      passed: election?.status === 'ACTIVE',
      detail: election?.status === 'ACTIVE' ? 'Polls open for live voting' : `Election status: ${election?.status || 'Inactive'}`,
    },
    {
      id: 'not_voted',
      label: 'Ballot Availability',
      passed: !user?.hasVoted,
      detail: !user?.hasVoted ? 'Ballot ready to cast' : 'Vote already recorded on blockchain',
    },
  ];

  const allPassed = checks.every((c) => c.passed);

  return (
    <Card className="p-6 border-slate-800 bg-slate-900/90 shadow-xl space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl border ${allPassed ? 'bg-emerald-950/60 border-emerald-800/60 text-emerald-400' : 'bg-amber-950/60 border-amber-800/60 text-amber-400'}`}>
            {allPassed ? <ShieldCheck className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">Voting Readiness Audit</h3>
            <p className="text-xs text-slate-400">Cryptographic pre-vote security verification</p>
          </div>
        </div>

        <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${allPassed ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800' : 'bg-amber-950/80 text-amber-400 border border-amber-800'}`}>
          {allPassed ? 'Ready to Vote' : 'Action Required'}
        </span>
      </div>

      <div className="space-y-3">
        {checks.map((item) => (
          <div
            key={item.id}
            className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              {item.passed ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              ) : (
                <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              )}
              <div>
                <div className="text-xs font-semibold text-white">{item.label}</div>
                <div className="text-xs text-slate-400">{item.detail}</div>
              </div>
            </div>

            {item.fixAction && (
              <Button size="sm" variant="outline" onClick={item.fixAction} className="text-xs flex-shrink-0">
                {item.fixLabel}
              </Button>
            )}
          </div>
        ))}
      </div>

      <div className="pt-2">
        {allPassed ? (
          <Button
            size="lg"
            onClick={onStartVoting}
            className="w-full bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/40 text-white font-semibold flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4" />
            <span>Proceed to Cast Encrypted Vote</span>
          </Button>
        ) : (
          <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-xs text-slate-400 text-center">
            ⚠️ Please satisfy all readiness requirements above before submitting your vote on the smart contract.
          </div>
        )}
      </div>
    </Card>
  );
};

export default VotingReadiness;
