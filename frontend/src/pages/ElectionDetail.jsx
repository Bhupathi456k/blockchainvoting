import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { electionsAPI, candidatesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Vote,
  Calendar,
  Clock,
  Users,
  ShieldCheck,
  AlertCircle,
  PlusCircle,
  Play,
  Square,
  Trash2,
  BarChart3,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Input from '../components/ui/Input';

const ElectionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [election, setElection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Candidate creation state
  const [showAddCandidate, setShowAddCandidate] = useState(false);
  const [candidateForm, setCandidateForm] = useState({
    name: '',
    party: '',
    description: '',
  });

  useEffect(() => {
    fetchElectionDetail();
  }, [id]);

  const fetchElectionDetail = async () => {
    try {
      setLoading(true);
      const res = await electionsAPI.getById(id);
      setElection(res.data.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load election details');
    } finally {
      setLoading(false);
    }
  };

  const isOwnerOrAdmin = user && election && (user.role === 'ADMIN' || election.hostUserId === user.id);

  const handleStartElection = async () => {
    if (!window.confirm('Are you sure you want to start voting for this election?')) return;
    try {
      setActionLoading(true);
      await electionsAPI.start(election.id);
      await fetchElectionDetail();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to start election');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEndElection = async () => {
    if (!window.confirm('Are you sure you want to end this election? Voting will be permanently closed.')) return;
    try {
      setActionLoading(true);
      await electionsAPI.end(election.id);
      await fetchElectionDetail();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to end election');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteElection = async () => {
    if (!window.confirm('Are you sure you want to delete this election? This cannot be undone.')) return;
    try {
      setActionLoading(true);
      await electionsAPI.delete(election.id);
      navigate('/elections');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete election');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddCandidate = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      await candidatesAPI.create(election.id, candidateForm);
      setCandidateForm({ name: '', party: '', description: '' });
      setShowAddCandidate(false);
      await fetchElectionDetail();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add candidate');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error || !election) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-white">Election Not Found</h2>
        <p className="text-slate-400 text-sm mt-1">{error || 'The requested election does not exist.'}</p>
        <Link to="/elections" className="inline-block mt-4">
          <Button variant="outline">Back to Elections</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Link to="/elections" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Elections Discovery
        </Link>
      </div>

      {/* Main Election Card */}
      <Card className="p-8 bg-slate-900/80 border-slate-800 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant={election.status === 'ACTIVE' ? 'success' : election.status === 'DRAFT' ? 'warning' : 'secondary'}>
                {election.status}
              </Badge>
              <span className="text-xs text-slate-500 font-mono">Election #{election.id}</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">{election.title}</h1>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {election.status === 'ACTIVE' && (
              <Link to="/dashboard">
                <Button className="bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 text-sm font-semibold">
                  <Vote className="w-4 h-4" /> Cast Ballot
                </Button>
              </Link>
            )}

            {(election.status === 'ACTIVE' || election.status === 'ENDED') && (
              <Link to="/results">
                <Button variant="outline" className="border-indigo-500/40 text-indigo-300 hover:bg-indigo-950/40 flex items-center gap-1.5 text-sm">
                  <BarChart3 className="w-4 h-4" /> View Results
                </Button>
              </Link>
            )}

            {isOwnerOrAdmin && election.status === 'DRAFT' && (
              <Button
                onClick={handleStartElection}
                disabled={actionLoading || (election.candidates?.length || 0) < 2}
                className="bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 text-sm"
              >
                <Play className="w-4 h-4" /> Start Election
              </Button>
            )}

            {isOwnerOrAdmin && election.status === 'ACTIVE' && (
              <Button
                onClick={handleEndElection}
                disabled={actionLoading}
                className="bg-amber-600 hover:bg-amber-500 text-white flex items-center gap-1.5 text-sm"
              >
                <Square className="w-4 h-4" /> End Election
              </Button>
            )}

            {isOwnerOrAdmin && election.status !== 'ACTIVE' && (
              <Button
                onClick={handleDeleteElection}
                disabled={actionLoading}
                variant="outline"
                className="border-red-500/40 text-red-400 hover:bg-red-950/30 flex items-center gap-1.5 text-sm"
              >
                <Trash2 className="w-4 h-4" /> Delete
              </Button>
            )}
          </div>
        </div>

        <p className="mt-4 text-slate-300 text-sm leading-relaxed">
          {election.description || 'No detailed description provided for this election.'}
        </p>

        {/* Metadata Grid */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-slate-800 text-xs">
          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800">
            <span className="text-slate-500 block">Start Schedule:</span>
            <span className="text-slate-200 font-semibold mt-1 block">
              {new Date(election.startTime).toLocaleString()}
            </span>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800">
            <span className="text-slate-500 block">End Schedule:</span>
            <span className="text-slate-200 font-semibold mt-1 block">
              {new Date(election.endTime).toLocaleString()}
            </span>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800">
            <span className="text-slate-500 block">Host Access Level:</span>
            <span className="text-indigo-400 font-semibold mt-1 block">
              {isOwnerOrAdmin ? 'Owner / Admin Rights' : 'Standard Voter'}
            </span>
          </div>
        </div>
      </Card>

      {/* Candidates Section */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-400" />
              Registered Candidates ({election.candidates?.length || 0})
            </h2>
            <p className="text-xs text-slate-400">
              Official candidates eligible to receive votes in this election.
            </p>
          </div>

          {isOwnerOrAdmin && election.status === 'DRAFT' && (
            <Button
              onClick={() => setShowAddCandidate(!showAddCandidate)}
              className="bg-indigo-600 hover:bg-indigo-500 text-xs flex items-center gap-1.5"
            >
              <PlusCircle className="w-3.5 h-3.5" /> Add Candidate
            </Button>
          )}
        </div>

        {/* Add Candidate Form */}
        {showAddCandidate && (
          <Card className="p-6 mb-6 bg-slate-900/90 border-indigo-500/40">
            <h3 className="text-sm font-semibold text-white mb-3">Add Candidate to Roster</h3>
            <form onSubmit={handleAddCandidate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Candidate Name *</label>
                  <Input
                    required
                    placeholder="e.g. Jane Doe"
                    value={candidateForm.name}
                    onChange={(e) => setCandidateForm({ ...candidateForm, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Party / Affiliation *</label>
                  <Input
                    required
                    placeholder="e.g. Progressive Tech Coalition"
                    value={candidateForm.party}
                    onChange={(e) => setCandidateForm({ ...candidateForm, party: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Platform / Biography</label>
                <textarea
                  rows="2"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:ring-1 focus:ring-indigo-500"
                  placeholder="Summary of qualifications and platform..."
                  value={candidateForm.description}
                  onChange={(e) => setCandidateForm({ ...candidateForm, description: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowAddCandidate(false)} className="text-xs">
                  Cancel
                </Button>
                <Button type="submit" disabled={actionLoading} className="bg-indigo-600 text-xs">
                  Save Candidate
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Candidates Grid */}
        {(!election.candidates || election.candidates.length === 0) ? (
          <div className="text-center py-12 bg-slate-900/40 border border-slate-800 rounded-xl p-6">
            <Users className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-400">No candidates registered yet.</p>
            {isOwnerOrAdmin && election.status === 'DRAFT' && (
              <p className="text-xs text-amber-400 mt-1">
                ⚠️ An election must have at least 2 candidates before it can be started.
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {election.candidates.map((cand, idx) => (
              <Card key={cand.id} className="p-5 bg-slate-900/60 border-slate-800">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/40">
                      Candidate #{idx + 1}
                    </span>
                    <h4 className="text-base font-bold text-white mt-1">{cand.name}</h4>
                    <p className="text-xs text-indigo-300 font-medium">{cand.party}</p>
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  {cand.description || 'No platform details submitted.'}
                </p>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ElectionDetail;
