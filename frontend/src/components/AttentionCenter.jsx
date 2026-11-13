import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, ShieldAlert, Wallet, CheckCircle2, Clock, ArrowRight, ShieldCheck } from 'lucide-react';
import Button from './ui/Button';

const AttentionCenter = ({ activeElection, pendingHostRequestsCount = 0 }) => {
  const { user, walletConnected, connectWallet, isVoter, isAdmin, canHostElections } = useAuth();
  const navigate = useNavigate();

  const alerts = [];

  // 1. Wallet connection alert
  if (!walletConnected) {
    alerts.push({
      id: 'wallet',
      type: 'warning',
      icon: Wallet,
      title: 'MetaMask Wallet Disconnected',
      message: 'Connect your Ethereum Web3 wallet to verify eligibility and cast votes on the blockchain.',
      actionLabel: 'Connect Wallet',
      onAction: connectWallet,
    });
  }

  // 2. Host permission alert for regular voters
  if (isVoter && !canHostElections) {
    if (user?.hostPermissionStatus === 'PENDING') {
      alerts.push({
        id: 'host-pending',
        type: 'info',
        icon: Clock,
        title: 'Host Permission Request Under Review',
        message: 'Your request to host elections has been submitted and is currently being audited by System Administrators.',
        actionLabel: 'View Status',
        onAction: () => navigate('/host-request'),
      });
    } else if (user?.hostPermissionStatus === 'REJECTED') {
      alerts.push({
        id: 'host-rejected',
        type: 'error',
        icon: AlertCircle,
        title: 'Host Request Decision Updated',
        message: 'Your recent hosting request was not approved. Click to view administrator feedback.',
        actionLabel: 'View Details',
        onAction: () => navigate('/host-request'),
      });
    } else if (user?.hostPermissionStatus === 'NONE' || !user?.hostPermissionStatus) {
      alerts.push({
        id: 'host-none',
        type: 'info',
        icon: ShieldAlert,
        title: 'Want to Host Your Own Election?',
        message: 'You can submit a formal request to become an authorized Election Host on BlockVote.',
        actionLabel: 'Request Host Permission',
        onAction: () => navigate('/host-request'),
      });
    }
  }

  // 3. Active Election alert
  if (activeElection) {
    alerts.push({
      id: 'active-election',
      type: 'success',
      icon: CheckCircle2,
      title: `Live Election Active: ${activeElection.title}`,
      message: user?.hasVoted
        ? 'You have cast your vote in this election. Click to view live cryptographic tally & progress.'
        : 'Voting is currently open! Review candidates and cast your ballot before polls close.',
      actionLabel: user?.hasVoted ? 'View Results' : 'Vote Now',
      onAction: () => navigate(`/elections/${activeElection.id}`),
    });
  }

  // 4. Admin alerts
  if (isAdmin && pendingHostRequestsCount > 0) {
    alerts.push({
      id: 'admin-host-reqs',
      type: 'warning',
      icon: ShieldCheck,
      title: `${pendingHostRequestsCount} Host Request${pendingHostRequestsCount > 1 ? 's' : ''} Awaiting Review`,
      message: 'New users have submitted requests for election host authorization.',
      actionLabel: 'Review Requests',
      onAction: () => navigate('/admin/host-requests'),
    });
  }

  if (alerts.length === 0) return null;

  return (
    <div className="space-y-3 mb-8">
      {alerts.map((a) => {
        const typeStyles = {
          warning: 'bg-amber-950/40 border-amber-800/60 text-amber-200',
          info: 'bg-indigo-950/40 border-indigo-800/60 text-indigo-200',
          error: 'bg-red-950/40 border-red-800/60 text-red-200',
          success: 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200',
        }[a.type];

        const Icon = a.icon;

        return (
          <div
            key={a.id}
            className={`p-4 sm:p-5 rounded-2xl border backdrop-blur-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all shadow-lg ${typeStyles}`}
          >
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-white/10 flex-shrink-0 mt-0.5 sm:mt-0">
                <Icon className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
                  <span>{a.title}</span>
                </h4>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{a.message}</p>
              </div>
            </div>

            {a.actionLabel && (
              <Button
                size="sm"
                variant={a.type === 'warning' ? 'secondary' : 'primary'}
                onClick={a.onAction}
                className="flex-shrink-0 flex items-center gap-1.5 shadow-md w-full sm:w-auto justify-center"
              >
                <span>{a.actionLabel}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default AttentionCenter;
