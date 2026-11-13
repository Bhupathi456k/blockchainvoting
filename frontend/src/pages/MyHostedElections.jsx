import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { electionsAPI } from '../services/api';
import { Vote, PlusCircle, Play, Square, Clock, Users, Activity, ChevronRight, CheckCircle2 } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { TableSkeleton } from '../components/ui/LoadingSkeleton';
import EmptyState from '../components/ui/EmptyState';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { useNavigate, Link } from 'react-router-dom';

const MyHostedElections = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedElection, setSelectedElection] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null); // 'start' | 'end'
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchMyHostedElections();
  }, []);

  const fetchMyHostedElections = async () => {
    try {
      setLoading(true);
      const res = await electionsAPI.getAll();
      const rawData = res.data?.data;
      const all = Array.isArray(rawData) ? rawData : (rawData?.elections || []);
      const mine = all.filter((e) => e.hostUserId === user?.id);
      setElections(mine);
    } catch (err) {
      console.error('Failed to load hosted elections:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async () => {
    if (!selectedElection) return;
    try {
      setActionLoading(true);
      await electionsAPI.start(selectedElection.id);
      setConfirmAction(null);
      setSelectedElection(null);
      await fetchMyHostedElections();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to start election');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEnd = async () => {
    if (!selectedElection) return;
    try {
      setActionLoading(true);
      await electionsAPI.end(selectedElection.id);
      setConfirmAction(null);
      setSelectedElection(null);
      await fetchMyHostedElections();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to end election');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="p-2 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-400">
              <Vote className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              My Hosted Elections
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            Manage election metadata, candidates, starting schedules, and live voter tallies.
          </p>
        </div>

        <Button onClick={() => navigate('/elections/create')} className="shadow-indigo-900/40">
          <PlusCircle className="w-4 h-4 mr-1.5" />
          <span>Create New Election</span>
        </Button>
      </div>

      {loading ? (
        <TableSkeleton rows={3} />
      ) : elections.length === 0 ? (
        <EmptyState
          icon={Vote}
          title="No Elections Created Yet"
          description="You are an authorized election host! Launch your first election using the step-by-step creation wizard."
          actionLabel="Launch Election Wizard"
          onAction={() => navigate('/elections/create')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {elections.map((elec) => (
            <Card key={elec.id} className="p-6 bg-slate-900/80 border-slate-800 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-950 text-indigo-400 border border-indigo-800">
                    {elec.status}
                  </span>
                  <h3 className="text-lg font-bold text-white mt-1.5">{elec.title}</h3>
                </div>
                <Link to={`/elections/${elec.id}`}>
                  <Button size="sm" variant="outline" className="text-xs">
                    View Details
                  </Button>
                </Link>
              </div>

              <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                {elec.description || 'No description provided.'}
              </p>

              {/* Election Health Box */}
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-500 block">Candidates:</span>
                  <span className="font-bold text-white">{elec.candidates?.length || 0} Registered</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Start Date:</span>
                  <span className="font-mono text-slate-300">{new Date(elec.startTime).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                {elec.status === 'DRAFT' && (
                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedElection(elec);
                      setConfirmAction('start');
                    }}
                    disabled={(elec.candidates?.length || 0) < 2}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-xs"
                  >
                    <Play className="w-3.5 h-3.5 mr-1" /> Start Voting
                  </Button>
                )}

                {elec.status === 'ACTIVE' && (
                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedElection(elec);
                      setConfirmAction('end');
                    }}
                    className="w-full bg-amber-600 hover:bg-amber-500 text-xs"
                  >
                    <Square className="w-3.5 h-3.5 mr-1" /> End Voting
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Confirmation Dialogs */}
      <ConfirmDialog
        isOpen={confirmAction === 'start'}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleStart}
        loading={actionLoading}
        title="Start Live Voting?"
        description={`This will open polling for "${selectedElection?.title}". Voters will be able to cast on-chain ballots immediately.`}
        confirmText="Start Voting"
        variant="primary"
      />

      <ConfirmDialog
        isOpen={confirmAction === 'end'}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleEnd}
        loading={actionLoading}
        title="End Election & Close Polls?"
        description={`This will permanently close voting for "${selectedElection?.title}" and finalize the cryptographic results tally.`}
        confirmText="End Election"
        variant="warning"
      />
    </div>
  );
};

export default MyHostedElections;
