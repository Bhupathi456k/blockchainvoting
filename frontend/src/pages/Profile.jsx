import React from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Phone, ShieldCheck, Wallet, Sparkles, CheckCircle2, KeyRound } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const { user, walletConnected, walletAddress, connectWallet, canHostElections } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center font-bold text-2xl shadow-inner">
            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-white tracking-tight">{user.name}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-indigo-950 text-indigo-300 border border-indigo-800">
                {user.role}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-1">Voter ID: {user.voterId || 'N/A'}</p>
          </div>
        </div>

        <Button onClick={() => navigate('/settings/security')} variant="outline" size="sm" className="flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-indigo-400" />
          <span>Security & Passkeys</span>
        </Button>
      </div>

      {/* Account Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 border-slate-800 bg-slate-900/90 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-white tracking-tight uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-3">
            Personal Information
          </h3>

          <div className="space-y-3.5 text-xs sm:text-sm">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-slate-400 flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-400" /> Full Name
              </span>
              <span className="font-semibold text-white">{user.name}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-slate-400 flex items-center gap-2">
                <Mail className="w-4 h-4 text-indigo-400" /> Email Address
              </span>
              <span className="font-mono text-white text-xs">{user.email || 'N/A'}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-slate-400 flex items-center gap-2">
                <Phone className="w-4 h-4 text-indigo-400" /> Phone Number
              </span>
              <span className="font-mono text-white text-xs">{user.phone || 'Not configured'}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-slate-400 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-indigo-400" /> Voter Identifier
              </span>
              <span className="font-mono text-emerald-400 font-semibold">{user.voterId}</span>
            </div>
          </div>
        </Card>

        <Card className="p-6 border-slate-800 bg-slate-900/90 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-white tracking-tight uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-3">
            Platform Status & Web3
          </h3>

          <div className="space-y-3.5 text-xs sm:text-sm">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-slate-400 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" /> Host Permission
              </span>
              <span className="font-bold text-amber-400 uppercase tracking-wider text-xs">
                {user.hostPermissionStatus || 'NONE'}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-slate-400 flex items-center gap-2">
                <Wallet className="w-4 h-4 text-emerald-400" /> Web3 Wallet
              </span>
              {walletConnected ? (
                <span className="font-mono text-emerald-400 font-bold text-xs select-all">
                  {walletAddress ? `${walletAddress.substring(0, 8)}...${walletAddress.substring(walletAddress.length - 4)}` : 'Connected'}
                </span>
              ) : (
                <Button size="sm" onClick={connectWallet} className="text-xs">
                  Connect Wallet
                </Button>
              )}
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-slate-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Voter Eligibility
              </span>
              <span className="font-semibold text-emerald-400">Verified Eligible</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
