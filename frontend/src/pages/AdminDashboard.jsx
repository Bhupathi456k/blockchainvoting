import React, { useState, useEffect } from 'react';
import {
  electionsAPI,
  candidatesAPI,
  votersAPI,
  hostRequestsAPI,
  auditLogsAPI,
  reportsAPI,
} from '../services/api';
import {
  Plus,
  Play,
  Square,
  CheckCircle,
  AlertCircle,
  Clock,
  XCircle,
  Eye,
  Check,
  X,
  Shield,
  FileText,
  Users,
  BarChart3,
  Download,
  Search,
  RefreshCw,
  Cpu,
  Lock,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Input from '../components/ui/Input';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('host-requests'); // 'host-requests' | 'elections' | 'voters' | 'audit-logs' | 'reports'
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Data states
  const [elections, setElections] = useState([]);
  const [voters, setVoters] = useState([]);
  const [voterStats, setVoterStats] = useState(null);
  const [hostRequests, setHostRequests] = useState([]);
  const [hostStats, setHostStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });

  // Audit Logs state
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditStats, setAuditStats] = useState({ totalLogs: 0, categoryCounts: {} });
  const [auditFilterCategory, setAuditFilterCategory] = useState('');
  const [auditSearch, setAuditSearch] = useState('');
  const [auditLoading, setAuditLoading] = useState(false);

  // Reports state
  const [reportSummary, setReportSummary] = useState(null);
  const [reportElections, setReportElections] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);

  // Request review modal states
  const [requestFilter, setRequestFilter] = useState('ALL');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [processingAction, setProcessingAction] = useState(false);

  // Election modal states
  const [showCreateElection, setShowCreateElection] = useState(false);
  const [showAddCandidate, setShowAddCandidate] = useState(false);
  const [selectedElectionId, setSelectedElectionId] = useState(null);

  // Form states
  const [electionForm, setElectionForm] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
  });

  const [candidateForm, setCandidateForm] = useState({
    name: '',
    party: '',
    description: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (activeTab === 'audit-logs') {
      fetchAuditLogs();
    } else if (activeTab === 'reports') {
      fetchReports();
    } else if (activeTab === 'voters') {
      fetchVotersList();
    }
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const [electionsRes, statsRes, requestsRes] = await Promise.all([
        electionsAPI.getAll(),
        votersAPI.getStats(),
        hostRequestsAPI.getAll(),
      ]);
      setElections(electionsRes.data.data || []);
      setVoterStats(statsRes.data.data || null);
      setHostRequests(requestsRes.data.data?.requests || []);
      setHostStats(requestsRes.data.data?.stats || { total: 0, pending: 0, approved: 0, rejected: 0 });
    } catch (err) {
      setError('Failed to load admin dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    if (activeTab === 'audit-logs') await fetchAuditLogs();
    if (activeTab === 'reports') await fetchReports();
    if (activeTab === 'voters') await fetchVotersList();
    setRefreshing(false);
  };

  const fetchVotersList = async () => {
    try {
      const res = await votersAPI.getAll();
      setVoters(res.data.data || []);
      const statsRes = await votersAPI.getStats();
      setVoterStats(statsRes.data.data || null);
    } catch (err) {
      console.error('Failed to load voters list:', err);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      setAuditLoading(true);
      const params = {};
      if (auditFilterCategory) params.category = auditFilterCategory;
      if (auditSearch) params.search = auditSearch;
      const res = await auditLogsAPI.getAll(params);
      setAuditLogs(res.data.data?.logs || []);
      setAuditStats(res.data.data?.stats || { totalLogs: 0, categoryCounts: {} });
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setAuditLoading(false);
    }
  };

  const fetchReports = async () => {
    try {
      setReportsLoading(true);
      const [summaryRes, electionsRes] = await Promise.all([
        reportsAPI.getSummary(),
        reportsAPI.getElections(),
      ]);
      setReportSummary(summaryRes.data.data || null);
      setReportElections(electionsRes.data.data?.reports || []);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setReportsLoading(false);
    }
  };

  const handleApproveRequest = async (requestId) => {
    try {
      setProcessingAction(true);
      setError('');
      await hostRequestsAPI.approve(requestId);
      setSuccess('Host request approved successfully! User is now authorized to create elections.');
      setSelectedRequest(null);
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to approve request');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleRejectRequest = async () => {
    if (!selectedRequest) return;
    try {
      setProcessingAction(true);
      setError('');
      await hostRequestsAPI.reject(selectedRequest.id, { adminReason: rejectReason });
      setSuccess('Host request rejected.');
      setShowRejectModal(false);
      setSelectedRequest(null);
      setRejectReason('');
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reject request');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleCreateElection = async (e) => {
    e.preventDefault();
    try {
      await electionsAPI.create(electionForm);
      setSuccess('Election created successfully');
      setShowCreateElection(false);
      setElectionForm({ title: '', description: '', startTime: '', endTime: '' });
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create election');
    }
  };

  const handleAddCandidate = async (e) => {
    e.preventDefault();
    try {
      await candidatesAPI.create(selectedElectionId, candidateForm);
      setSuccess('Candidate added successfully');
      setShowAddCandidate(false);
      setCandidateForm({ name: '', party: '', description: '' });
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add candidate');
    }
  };

  const handleStartElection = async (id) => {
    try {
      await electionsAPI.start(id);
      setSuccess('Election started successfully');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to start election');
    }
  };

  const handleEndElection = async (id) => {
    try {
      await electionsAPI.end(id);
      setSuccess('Election ended successfully');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to end election');
    }
  };

  const handleToggleEligibility = async (voter) => {
    try {
      setProcessingAction(true);
      await votersAPI.updateEligibility(voter.id, { isEligible: !voter.isEligible });
      setSuccess(`Voter ${voter.name} eligibility updated.`);
      await fetchVotersList();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update eligibility');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleAuthorizeOnChain = async (voter) => {
    try {
      setProcessingAction(true);
      setError('');
      const res = await votersAPI.authorizeOnChain(voter.id);
      setSuccess(`Voter ${voter.name} authorized on blockchain! TX: ${res.data.data?.blockchainReceipt?.txHash || 'Confirmed'}`);
      await fetchVotersList();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to authorize voter on blockchain');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleBatchAuthorizeOnChain = async () => {
    if (!window.confirm('Batch authorize all eligible voters with linked Web3 wallets on the blockchain smart contract?')) return;
    try {
      setProcessingAction(true);
      setError('');
      const res = await votersAPI.batchAuthorizeOnChain();
      setSuccess(`Batch authorized ${res.data.data?.authorizedCount} voters on blockchain!`);
      await fetchVotersList();
    } catch (err) {
      setError(err.response?.data?.error || 'Batch authorization failed');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleExportAuditLogs = async () => {
    try {
      const response = await auditLogsAPI.export('csv');
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `blockvote-audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError('Failed to download audit logs CSV');
    }
  };

  const handleExportReport = async (type) => {
    try {
      const response = await reportsAPI.export(type, 'csv');
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `blockvote-${type}-report-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(`Failed to download ${type} CSV report`);
    }
  };

  const filteredRequests = hostRequests.filter((req) => {
    if (requestFilter === 'ALL') return true;
    return req.status === requestFilter;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
              <Shield className="w-5 h-5" />
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">System Administration</h1>
          </div>
          <p className="text-slate-400 text-sm">
            Platform governance, election hosting permissions, on-chain voter registration, and audit telemetry.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
            className="border-slate-700 text-slate-300 hover:bg-slate-800 text-xs flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            onClick={() => setShowCreateElection(true)}
            className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-indigo-900/30"
          >
            <Plus className="w-4 h-4" />
            New Election
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-950/60 border border-red-500/40 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-red-300 flex-1">{error}</div>
          <button onClick={() => setError('')} className="text-red-400 hover:text-red-200">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="bg-emerald-950/60 border border-emerald-500/40 rounded-xl p-4 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-emerald-300 flex-1">{success}</div>
          <button onClick={() => setSuccess('')} className="text-emerald-400 hover:text-emerald-200">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex overflow-x-auto border-b border-slate-800 gap-2 pb-px no-scrollbar">
        <button
          onClick={() => setActiveTab('host-requests')}
          className={`pb-3 px-3 text-sm font-semibold flex items-center gap-2 border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'host-requests'
              ? 'border-indigo-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Host Applications</span>
          {hostStats.pending > 0 && (
            <span className="bg-amber-500 text-slate-950 text-xs px-2 py-0.5 rounded-full font-bold">
              {hostStats.pending}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('elections')}
          className={`pb-3 px-3 text-sm font-semibold flex items-center gap-2 border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'elections'
              ? 'border-indigo-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Elections ({elections.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('voters')}
          className={`pb-3 px-3 text-sm font-semibold flex items-center gap-2 border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'voters'
              ? 'border-indigo-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Voter Roster & Web3 Auth</span>
        </button>

        <button
          onClick={() => setActiveTab('audit-logs')}
          className={`pb-3 px-3 text-sm font-semibold flex items-center gap-2 border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'audit-logs'
              ? 'border-indigo-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>Audit Logs & Telemetry</span>
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`pb-3 px-3 text-sm font-semibold flex items-center gap-2 border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'reports'
              ? 'border-indigo-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Reports & Turnout</span>
        </button>
      </div>

      {/* ===================================================================== */}
      {/* TAB 1: ELECTION HOST REQUESTS                                         */}
      {/* ===================================================================== */}
      {activeTab === 'host-requests' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
              <span className="text-slate-400 text-xs">Total Applications</span>
              <div className="text-2xl font-bold text-white mt-1">{hostStats.total}</div>
            </div>
            <div className="bg-slate-900/80 border border-amber-500/30 rounded-xl p-4">
              <span className="text-amber-400 text-xs flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Pending Review
              </span>
              <div className="text-2xl font-bold text-amber-400 mt-1">{hostStats.pending}</div>
            </div>
            <div className="bg-slate-900/80 border border-emerald-500/30 rounded-xl p-4">
              <span className="text-emerald-400 text-xs flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" /> Approved Hosts
              </span>
              <div className="text-2xl font-bold text-emerald-400 mt-1">{hostStats.approved}</div>
            </div>
            <div className="bg-slate-900/80 border border-red-500/30 rounded-xl p-4">
              <span className="text-red-400 text-xs flex items-center gap-1.5">
                <XCircle className="w-3.5 h-3.5" /> Rejected
              </span>
              <div className="text-2xl font-bold text-red-400 mt-1">{hostStats.rejected}</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 mr-2">Filter:</span>
            {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((filter) => (
              <button
                key={filter}
                onClick={() => setRequestFilter(filter)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  requestFilter === filter
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800/80 text-slate-400 hover:text-white'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          {filteredRequests.length === 0 ? (
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center">
              <Clock className="mx-auto h-12 w-12 text-slate-600 mb-3" />
              <h3 className="text-lg font-bold text-white mb-1">No Applications Found</h3>
              <p className="text-slate-400 text-xs">There are no host permission requests matching the selected filter.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRequests.map((req) => (
                <Card
                  key={req.id}
                  className="p-6 bg-slate-900/70 border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-bold text-white">{req.electionTitle}</h3>
                      <Badge
                        variant={
                          req.status === 'PENDING'
                            ? 'warning'
                            : req.status === 'APPROVED'
                            ? 'success'
                            : 'destructive'
                        }
                      >
                        {req.status}
                      </Badge>
                    </div>

                    <div className="text-xs text-slate-400 flex flex-wrap gap-4">
                      <div>
                        <span className="text-slate-500">Applicant: </span>
                        <span className="text-slate-200 font-medium">{req.requester?.name || 'User #' + req.userId}</span>
                        <span className="text-indigo-400 ml-1">({req.requester?.email})</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Expected Voters: </span>
                        <span className="text-slate-200 font-medium">{req.expectedVoters}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Submitted: </span>
                        <span className="text-slate-200 font-medium">
                          {new Date(req.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 line-clamp-2 max-w-3xl">{req.purpose}</p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      onClick={() => setSelectedRequest(req)}
                      className="border-slate-700 text-xs flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Details</span>
                    </Button>

                    {req.status === 'PENDING' && (
                      <>
                        <Button
                          onClick={() => handleApproveRequest(req.id)}
                          disabled={processingAction}
                          className="bg-emerald-600 hover:bg-emerald-500 text-xs flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </Button>
                        <Button
                          onClick={() => {
                            setSelectedRequest(req);
                            setShowRejectModal(true);
                          }}
                          disabled={processingAction}
                          variant="destructive"
                          className="text-xs flex items-center gap-1"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </Button>
                      </>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: ELECTIONS                                                      */}
      {/* ===================================================================== */}
      {activeTab === 'elections' && (
        <div className="space-y-4">
          {elections.length === 0 ? (
            <div className="text-center py-12 bg-slate-900/40 border border-slate-800 rounded-xl">
              <FileText className="w-12 h-12 text-slate-600 mx-auto mb-2" />
              <p className="text-slate-400 text-sm">No elections created yet.</p>
            </div>
          ) : (
            elections.map((election) => (
              <Card key={election.id} className="p-6 bg-slate-900/70 border-slate-800">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-bold text-white">{election.title}</h3>
                      <Badge
                        variant={
                          election.status === 'ACTIVE'
                            ? 'success'
                            : election.status === 'DRAFT'
                            ? 'warning'
                            : 'secondary'
                        }
                      >
                        {election.status}
                      </Badge>
                      <span className="text-xs text-slate-500 font-mono">ID: #{election.id}</span>
                    </div>
                    <p className="text-slate-400 text-xs mt-1 max-w-2xl">{election.description}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {election.status === 'DRAFT' && (
                      <>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSelectedElectionId(election.id);
                            setShowAddCandidate(true);
                          }}
                          className="border-indigo-500/40 text-indigo-300 hover:bg-indigo-950/40 text-xs"
                        >
                          Add Candidate
                        </Button>
                        <Button
                          onClick={() => handleStartElection(election.id)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs flex items-center gap-1.5"
                        >
                          <Play className="w-3.5 h-3.5" /> Start Voting
                        </Button>
                      </>
                    )}

                    {election.status === 'ACTIVE' && (
                      <Button
                        onClick={() => handleEndElection(election.id)}
                        className="bg-amber-600 hover:bg-amber-500 text-white text-xs flex items-center gap-1.5"
                      >
                        <Square className="w-3.5 h-3.5" /> End Election
                      </Button>
                    )}
                  </div>
                </div>

                {/* Candidate Roster */}
                <div className="border-t border-slate-800/80 pt-4 mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-400">
                      Registered Candidates ({election.candidates?.length || 0})
                    </span>
                  </div>
                  {(!election.candidates || election.candidates.length === 0) ? (
                    <p className="text-xs text-slate-500 italic">No candidates registered. Add at least 2 before starting.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {election.candidates.map((cand) => (
                        <div key={cand.id} className="bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                          <p className="text-white text-xs font-bold">{cand.name}</p>
                          <p className="text-[11px] text-indigo-400">{cand.party}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: VOTER ROSTER & WEB3 AUTH                                       */}
      {/* ===================================================================== */}
      {activeTab === 'voters' && (
        <div className="space-y-6">
          {voterStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
                <span className="text-slate-400 text-xs">Total Registered Voters</span>
                <div className="text-2xl font-bold text-white mt-1">{voterStats.totalVoters}</div>
              </div>
              <div className="bg-slate-900/80 border border-indigo-500/30 rounded-xl p-4">
                <span className="text-indigo-400 text-xs">Eligible Voters</span>
                <div className="text-2xl font-bold text-indigo-400 mt-1">{voterStats.eligibleVoters}</div>
              </div>
              <div className="bg-slate-900/80 border border-emerald-500/30 rounded-xl p-4">
                <span className="text-emerald-400 text-xs">Ballots Cast</span>
                <div className="text-2xl font-bold text-emerald-400 mt-1">{voterStats.votedCount}</div>
              </div>
              <div className="bg-slate-900/80 border border-amber-500/30 rounded-xl p-4">
                <span className="text-amber-400 text-xs">Turnout Rate</span>
                <div className="text-2xl font-bold text-amber-400 mt-1">{voterStats.turnoutPercentage}%</div>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-400" />
              Registered Voters Roster ({voters.length})
            </h3>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleBatchAuthorizeOnChain}
                disabled={processingAction}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs flex items-center gap-1.5 shadow-md shadow-indigo-950/40"
              >
                <Cpu className="w-3.5 h-3.5" /> Batch Authorize On-Chain
              </Button>
              <Button
                variant="outline"
                onClick={() => handleExportReport('voters')}
                className="border-slate-700 text-xs flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" /> Export Voters CSV
              </Button>
            </div>
          </div>

          <Card className="overflow-hidden border-slate-800 bg-slate-900/80">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3">Voter ID</th>
                    <th className="p-3">Name & Email</th>
                    <th className="p-3">Wallet Address</th>
                    <th className="p-3">Eligibility</th>
                    <th className="p-3">Voted Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                  {voters.map((voter) => (
                    <tr key={voter.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-3 font-semibold text-white">{voter.voterId}</td>
                      <td className="p-3 font-sans">
                        <div className="font-semibold text-white">{voter.name}</div>
                        <div className="text-[11px] text-slate-400">{voter.email}</div>
                      </td>
                      <td className="p-3">
                        {voter.walletAddress ? (
                          <span className="text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
                            {voter.walletAddress.substring(0, 6)}...{voter.walletAddress.substring(38)}
                          </span>
                        ) : (
                          <span className="text-slate-500 font-sans italic">Not Linked</span>
                        )}
                      </td>
                      <td className="p-3">
                        <Badge variant={voter.isEligible ? 'success' : 'secondary'}>
                          {voter.isEligible ? 'ELIGIBLE' : 'INELIGIBLE'}
                        </Badge>
                      </td>
                      <td className="p-3">
                        {voter.hasVoted ? (
                          <span className="text-emerald-400 font-sans font-semibold flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" /> Voted
                          </span>
                        ) : (
                          <span className="text-slate-500 font-sans">Not Yet</span>
                        )}
                      </td>
                      <td className="p-3 text-right space-x-2 font-sans">
                        <Button
                          variant="outline"
                          onClick={() => handleToggleEligibility(voter)}
                          disabled={processingAction}
                          className="text-[11px] py-1 px-2 border-slate-700 hover:bg-slate-800"
                        >
                          {voter.isEligible ? 'Deauthorize' : 'Authorize'}
                        </Button>
                        {voter.walletAddress && voter.isEligible && (
                          <Button
                            onClick={() => handleAuthorizeOnChain(voter)}
                            disabled={processingAction}
                            className="text-[11px] py-1 px-2 bg-indigo-600 hover:bg-indigo-500 text-white"
                          >
                            Web3 Auth
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 4: AUDIT LOGS & TELEMETRY                                         */}
      {/* ===================================================================== */}
      {activeTab === 'audit-logs' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Cpu className="w-4 h-4 text-indigo-400" />
                Immutable Audit Log Stream
              </h3>
              <p className="text-xs text-slate-400">
                Cryptographically registered record of user logins, host permissions, and election events.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleExportAuditLogs}
                className="border-slate-700 text-xs flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" /> Export Audit CSV
              </Button>
            </div>
          </div>

          {/* Audit Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                placeholder="Search audit action or performed by..."
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchAuditLogs()}
                className="pl-9 bg-slate-900/80 border-slate-800 text-xs"
              />
            </div>
            <select
              value={auditFilterCategory}
              onChange={(e) => {
                setAuditFilterCategory(e.target.value);
                fetchAuditLogs();
              }}
              className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">All Categories</option>
              <option value="AUTH">Authentication (AUTH)</option>
              <option value="HOST_REQUEST">Host Permission (HOST_REQUEST)</option>
              <option value="ELECTION">Elections (ELECTION)</option>
              <option value="VOTER">Voter Governance (VOTER)</option>
              <option value="VOTING">Ballot Casting (VOTING)</option>
              <option value="BLOCKCHAIN">Blockchain Smart Contract (BLOCKCHAIN)</option>
            </select>
            <Button onClick={fetchAuditLogs} className="bg-indigo-600 text-xs">
              Search
            </Button>
          </div>

          <Card className="overflow-hidden border-slate-800 bg-slate-900/80">
            {auditLoading ? (
              <div className="py-12 text-center text-slate-400 text-xs">Loading audit stream...</div>
            ) : auditLogs.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">No audit events recorded for this query.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-3">Timestamp</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Action</th>
                      <th className="p-3">Actor / Origin</th>
                      <th className="p-3">Target</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="p-3 text-slate-400 whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-950/70 border border-indigo-800/50 text-indigo-300">
                            {log.category}
                          </span>
                        </td>
                        <td className="p-3 font-semibold text-white">{log.action}</td>
                        <td className="p-3 font-sans">
                          <div className="text-slate-200">{log.performedBy}</div>
                          {log.ipAddress && <div className="text-[10px] text-slate-500 font-mono">IP: {log.ipAddress}</div>}
                        </td>
                        <td className="p-3 text-slate-400">
                          {log.targetType ? `${log.targetType} #${log.targetId || ''}` : '-'}
                        </td>
                        <td className="p-3">
                          <Badge variant={log.status === 'SUCCESS' ? 'success' : 'destructive'}>
                            {log.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 5: REPORTS & TURNOUT ANALYTICS                                    */}
      {/* ===================================================================== */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-400" />
                System Analytics & Turnout Reports
              </h3>
              <p className="text-xs text-slate-400">
                Official election turnout analysis, participation rates, and institutional summary data.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => handleExportReport('elections')}
                className="border-slate-700 text-xs flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" /> Export Elections CSV
              </Button>
              <Button
                variant="outline"
                onClick={() => handleExportReport('voters')}
                className="border-slate-700 text-xs flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" /> Export Voters CSV
              </Button>
            </div>
          </div>

          {reportSummary && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="p-5 bg-slate-900/80 border-slate-800">
                <span className="text-slate-400 text-xs font-semibold">Total Voters Overview</span>
                <div className="mt-2 text-2xl font-bold text-white">{reportSummary.voters?.totalVoters}</div>
                <div className="mt-1 text-xs text-indigo-400">
                  {reportSummary.voters?.eligibleVoters} authorized • {reportSummary.voters?.withWallet} Web3 wallets
                </div>
              </Card>

              <Card className="p-5 bg-slate-900/80 border-slate-800">
                <span className="text-slate-400 text-xs font-semibold">Global Voter Turnout</span>
                <div className="mt-2 text-2xl font-bold text-emerald-400">{reportSummary.voters?.turnoutPercentage}%</div>
                <div className="mt-1 text-xs text-slate-400">
                  {reportSummary.voters?.votedCount} ballots securely recorded
                </div>
              </Card>

              <Card className="p-5 bg-slate-900/80 border-slate-800">
                <span className="text-slate-400 text-xs font-semibold">Host Applications</span>
                <div className="mt-2 text-2xl font-bold text-amber-400">{reportSummary.hostRequests?.total}</div>
                <div className="mt-1 text-xs text-slate-400">
                  {reportSummary.hostRequests?.approved} approved • {reportSummary.hostRequests?.pending} pending
                </div>
              </Card>
            </div>
          )}

          {/* Per-Election Breakdown */}
          <Card className="p-6 bg-slate-900/80 border-slate-800">
            <h4 className="text-sm font-bold text-white mb-4">Election Turnout Breakdown</h4>
            {reportsLoading ? (
              <div className="py-8 text-center text-xs text-slate-400">Loading reports...</div>
            ) : reportElections.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No election reports available.</p>
            ) : (
              <div className="space-y-4">
                {reportElections.map((r) => (
                  <div key={r.electionId} className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{r.title}</span>
                          <Badge
                            variant={
                              r.status === 'ACTIVE'
                                ? 'success'
                                : r.status === 'DRAFT'
                                ? 'warning'
                                : 'secondary'
                            }
                          >
                            {r.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-400">Host: {r.host?.name} ({r.host?.email})</p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-indigo-400">{r.metrics?.totalVotesCast} Votes Cast</div>
                        <div className="text-[11px] text-slate-400">{r.metrics?.candidateCount} Candidates Registered</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: VIEW REQUEST DETAILS                                           */}
      {/* ===================================================================== */}
      {selectedRequest && !showRejectModal && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-2xl font-bold text-white">{selectedRequest.electionTitle}</h3>
                <p className="text-xs text-slate-400 mt-1">Host Request ID: #{selectedRequest.id}</p>
              </div>
              <Badge
                variant={
                  selectedRequest.status === 'PENDING'
                    ? 'warning'
                    : selectedRequest.status === 'APPROVED'
                    ? 'success'
                    : 'destructive'
                }
              >
                {selectedRequest.status}
              </Badge>
            </div>

            <div className="bg-slate-950/60 rounded-xl p-4 space-y-2 border border-slate-800">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Applicant Information</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block">Name</span>
                  <span className="text-white font-medium">{selectedRequest.requester?.name}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Email</span>
                  <span className="text-white font-medium">{selectedRequest.requester?.email}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Voter ID</span>
                  <span className="text-indigo-400 font-mono font-medium">{selectedRequest.requester?.voterId}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Proposed Election Parameters</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <span className="text-slate-500 block">Election Type</span>
                  <span className="text-white font-medium">{selectedRequest.electionType || 'General'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Expected Voters</span>
                  <span className="text-white font-medium">{selectedRequest.expectedVoters}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Proposed Start</span>
                  <span className="text-white font-medium">{new Date(selectedRequest.proposedStartDate).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Proposed End</span>
                  <span className="text-white font-medium">{new Date(selectedRequest.proposedEndDate).toLocaleString()}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-500 block mb-1">Purpose / Governance Justification</span>
                <p className="text-white bg-slate-950/60 p-3 rounded-lg border border-slate-800 leading-relaxed">
                  {selectedRequest.purpose}
                </p>
              </div>

              {selectedRequest.adminReason && (
                <div>
                  <span className="text-red-400 block mb-1 font-semibold">Administrator Rejection Reason:</span>
                  <p className="text-red-300 bg-red-950/40 border border-red-900/50 p-3 rounded-lg">
                    {selectedRequest.adminReason}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-800">
              <Button variant="outline" onClick={() => setSelectedRequest(null)} className="text-xs">
                Close
              </Button>

              {selectedRequest.status === 'PENDING' && (
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => setShowRejectModal(true)}
                    disabled={processingAction}
                    variant="destructive"
                    className="text-xs font-semibold"
                  >
                    Reject Request
                  </Button>
                  <Button
                    onClick={() => handleApproveRequest(selectedRequest.id)}
                    disabled={processingAction}
                    className="bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white"
                  >
                    {processingAction ? 'Approving...' : 'Approve Request'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: REJECT REQUEST REASON */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-xl font-bold text-white">Reject Hosting Request</h3>
            <p className="text-slate-400 text-xs">
              Please provide a clear reason for rejecting the request submitted by{' '}
              <span className="text-white font-medium">{selectedRequest?.requester?.name}</span>.
            </p>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Rejection Reason</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g., The proposed election dates overlap with an institutional election schedule."
                rows="4"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowRejectModal(false)} className="text-xs">
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleRejectRequest}
                disabled={processingAction}
                className="text-xs font-semibold"
              >
                {processingAction ? 'Rejecting...' : 'Confirm Rejection'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE ELECTION MODAL */}
      {showCreateElection && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-4">Create New Election</h3>
            <form onSubmit={handleCreateElection} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Title *</label>
                <Input
                  required
                  value={electionForm.title}
                  onChange={(e) => setElectionForm({ ...electionForm, title: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Description</label>
                <textarea
                  value={electionForm.description}
                  onChange={(e) => setElectionForm({ ...electionForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:ring-1 focus:ring-indigo-500"
                  rows="3"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Start Time *</label>
                <Input
                  type="datetime-local"
                  required
                  value={electionForm.startTime}
                  onChange={(e) => setElectionForm({ ...electionForm, startTime: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">End Time *</label>
                <Input
                  type="datetime-local"
                  required
                  value={electionForm.endTime}
                  onChange={(e) => setElectionForm({ ...electionForm, endTime: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" type="button" onClick={() => setShowCreateElection(false)} className="text-xs">
                  Cancel
                </Button>
                <Button type="submit" className="bg-indigo-600 text-xs">
                  Create Election
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD CANDIDATE MODAL */}
      {showAddCandidate && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-4">Add Candidate</h3>
            <form onSubmit={handleAddCandidate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Candidate Name *</label>
                <Input
                  required
                  value={candidateForm.name}
                  onChange={(e) => setCandidateForm({ ...candidateForm, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Party / Affiliation *</label>
                <Input
                  required
                  value={candidateForm.party}
                  onChange={(e) => setCandidateForm({ ...candidateForm, party: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Description</label>
                <textarea
                  value={candidateForm.description}
                  onChange={(e) => setCandidateForm({ ...candidateForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:ring-1 focus:ring-indigo-500"
                  rows="3"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" type="button" onClick={() => setShowAddCandidate(false)} className="text-xs">
                  Cancel
                </Button>
                <Button type="submit" className="bg-indigo-600 text-xs">
                  Save Candidate
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
