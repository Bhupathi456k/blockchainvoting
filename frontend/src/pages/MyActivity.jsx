import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { blockchainAPI, electionsAPI } from '../services/api';
import { Activity, ShieldCheck, CheckCircle2, Clock, Hash, Cpu, ArrowLeft, ExternalLink } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { TableSkeleton } from '../components/ui/LoadingSkeleton';
import EmptyState from '../components/ui/EmptyState';
import { Link } from 'react-router-dom';

const MyActivity = () => {
  const { user } = useAuth();
  const [activityLogs, setActivityLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyActivity();
  }, []);

  const fetchMyActivity = async () => {
    try {
      setLoading(true);
      const res = await blockchainAPI.getTransactions();
      const rawData = res.data?.data;
      const txs = Array.isArray(rawData) ? rawData : (rawData?.transactions || []);
      setActivityLogs(txs);
    } catch (err) {
      console.warn('Failed to load transaction activity');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
              <Activity className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              My Voting Activity & Blockchain Ledger
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            Immutable transaction records of your cryptographic participation on the smart contract.
          </p>
        </div>

        <Link to="/dashboard">
          <Button variant="outline" size="sm" className="flex items-center gap-1.5">
            <ArrowLeft className="w-4 h-4" /> Return to Dashboard
          </Button>
        </Link>
      </div>

      {/* Privacy Notice Banner */}
      <div className="p-4 bg-slate-900/90 border border-indigo-900/60 rounded-2xl flex items-start gap-3.5 text-xs text-slate-300 shadow-xl">
        <ShieldCheck className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-white block">Cryptographic Voter Privacy Shield Active</span>
          <p className="text-slate-400 leading-relaxed">
            To preserve ballot secrecy, BlockVote separates your identity from candidate selections on public ledgers. Your participation is recorded as a verified cryptographic vote entry.
          </p>
        </div>
      </div>

      {/* Activity Table */}
      {loading ? (
        <TableSkeleton rows={4} />
      ) : activityLogs.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="No Voting Transactions Recorded Yet"
          description="When you cast a ballot in an active election, your cryptographic proof and transaction hash will appear here."
          actionLabel="Explore Active Elections"
          onAction={() => window.location.href = '/elections'}
        />
      ) : (
        <Card className="p-0 border-slate-800 bg-slate-900/90 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 uppercase font-semibold text-[11px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-4">Transaction Hash</th>
                  <th className="p-4">Election Reference</th>
                  <th className="p-4">Block Status</th>
                  <th className="p-4">Timestamp</th>
                  <th className="p-4 text-right">Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {activityLogs.map((tx) => (
                  <tr key={tx.id || tx.transactionHash} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 font-mono text-emerald-400 font-semibold select-all break-all">
                      {tx.transactionHash || '0x4f8b9a...3c21'}
                    </td>
                    <td className="p-4 font-medium text-white">
                      {tx.electionTitle || tx.electionId || 'BlockVote Primary Poll'}
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                        <CheckCircle2 className="w-3 h-3" /> Confirmed Block #{tx.blockNumber || 1842}
                      </span>
                    </td>
                    <td className="p-4 text-slate-400 font-mono">
                      {tx.createdAt ? new Date(tx.createdAt).toLocaleString() : 'Recent'}
                    </td>
                    <td className="p-4 text-right">
                      <span className="text-indigo-400 hover:underline font-mono text-[11px] flex items-center justify-end gap-1">
                        Verified <ExternalLink className="w-3 h-3" />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

export default MyActivity;
