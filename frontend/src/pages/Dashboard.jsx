import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { electionsAPI, candidatesAPI, hostRequestsAPI, votersAPI } from '../services/api';
import web3Service from '../services/web3';
import AttentionCenter from '../components/AttentionCenter';
import OnboardingChecklist from '../components/OnboardingChecklist';
import BlockchainIntegrityCard from '../components/BlockchainIntegrityCard';
import ElectionCountdown from '../components/ElectionCountdown';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { CardSkeleton } from '../components/ui/LoadingSkeleton';
import EmptyState from '../components/ui/EmptyState';
import {
  Vote,
  Wallet,
  Shield,
  Clock,
  PlusCircle,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Users,
  Activity,
  ArrowRight,
  TrendingUp,
  Cpu,
  Search,
  ChevronRight,
  Calendar,
} from 'lucide-react';

const Dashboard = () => {
  const { user, walletConnected, walletAddress, connectWallet, canHostElections, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [activeElection, setActiveElection] = useState(null);
  const [electionsList, setElectionsList] = useState([]);
  const [myHostedElections, setMyHostedElections] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [voterStats, setVoterStats] = useState(null);
  const [hostRequestsCount, setHostRequestsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dashboardSearch, setDashboardSearch] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch active election
      try {
        const activeRes = await electionsAPI.getActive();
        const active = activeRes.data?.data;
        if (active) {
          setActiveElection(active);
          const candRes = await candidatesAPI.getByElection(active.id);
          setCandidates(candRes.data?.data || []);
        } else {
          setActiveElection(null);
        }
      } catch (e) {
        console.log('No active election currently');
      }

      // Fetch all discoverable elections
      try {
        const allRes = await electionsAPI.getAll({ limit: 50 });
        const rawElections = allRes.data?.data;
        const list = Array.isArray(rawElections)
          ? rawElections
          : (rawElections?.elections || []);
        setElectionsList(list);

        if (user) {
          setMyHostedElections(list.filter((e) => e.hostUserId === user.id));
        }
      } catch (e) {
        console.warn('Could not load elections');
      }

      // Fetch admin / host metrics if admin
      if (isAdmin) {
        try {
          const reqsRes = await hostRequestsAPI.getAll({ status: 'PENDING' });
          const rawReqs = reqsRes.data?.data;
          const reqCount = Array.isArray(rawReqs)
            ? rawReqs.length
            : (rawReqs?.requests?.length || rawReqs?.stats?.pending || 0);
          setHostRequestsCount(reqCount);
          const statsRes = await votersAPI.getStats();
          setVoterStats(statsRes.data?.data);
        } catch (e) {
          // Non-fatal
        }
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDashboardSearch = (e) => {
    e.preventDefault();
    if (dashboardSearch.trim()) {
      navigate(`/elections?q=${encodeURIComponent(dashboardSearch.trim())}`);
    } else {
      navigate('/elections');
    }
  };

  const activeElections = electionsList.filter((e) => e.status === 'ACTIVE');
  const upcomingElections = electionsList.filter((e) => e.status === 'UPCOMING');
  const recentlyEndedElections = electionsList.filter((e) => e.status === 'ENDED');

  const activeCount = activeElections.length;
  const upcomingCount = upcomingElections.length;
  const endedCount = recentlyEndedElections.length;

  return (
    <div className="space-y-8">
      {/* Personalized Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 border border-indigo-500/30 text-indigo-300">
              {isAdmin ? 'System Administrator Portal' : canHostElections ? 'Approved Election Host' : 'Verified Voter'}
            </span>
            {walletConnected && (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Web3 Connected
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Welcome back, {user?.name || 'Voter'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
            Stay informed about elections, securely cast your encrypted ballot on the smart contract, and verify tamper-proof results.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {canHostElections ? (
            <Button onClick={() => navigate('/elections/create')} className="shadow-indigo-900/40">
              <PlusCircle className="w-4 h-4 mr-1.5" />
              <span>Create Election</span>
            </Button>
          ) : (
            <Button onClick={() => navigate('/elections')} variant="outline">
              <Vote className="w-4 h-4 mr-1.5" />
              <span>Explore Elections</span>
            </Button>
          )}
        </div>
      </div>

      {/* Find an Election / Global Dashboard Search Bar */}
      <Card className="p-4 sm:p-5 border-slate-800 bg-slate-900/90 shadow-xl">
        <form onSubmit={handleDashboardSearch} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
              id="dashboard-search-input"
              type="text"
              placeholder="Find an Election by title, department, or keyword..."
              value={dashboardSearch}
              onChange={(e) => setDashboardSearch(e.target.value)}
              className="pl-10 bg-slate-950/80 border-slate-700 text-sm w-full"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-xs flex items-center justify-center gap-1.5 px-4">
              <Search className="w-3.5 h-3.5" />
              <span>Search</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/elections')}
              className="border-slate-700 hover:bg-slate-800 text-xs whitespace-nowrap"
            >
              View All Elections
            </Button>
          </div>
        </form>
      </Card>

      {/* Attention Center Action Alerts */}
      <AttentionCenter activeElection={activeElection} pendingHostRequestsCount={hostRequestsCount} />

      {/* Onboarding Checklist for Users & Hosts */}
      <OnboardingChecklist activeElection={activeElection} />

      {/* KPI Overview Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card
          onClick={() => navigate('/elections?status=ACTIVE')}
          className="p-5 border-slate-800 bg-slate-900/80 space-y-2 cursor-pointer hover:border-emerald-500/40 transition"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Elections</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Vote className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white">{activeCount}</div>
          <div className="text-xs text-slate-500">Live polls currently accepting votes</div>
        </Card>

        <Card
          onClick={() => navigate('/elections?status=UPCOMING')}
          className="p-5 border-slate-800 bg-slate-900/80 space-y-2 cursor-pointer hover:border-amber-500/40 transition"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Upcoming Elections</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white">{upcomingCount}</div>
          <div className="text-xs text-slate-500">Scheduled to launch soon</div>
        </Card>

        <Card className="p-5 border-slate-800 bg-slate-900/80 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">My Vote Status</span>
            <div className={`p-2 rounded-xl border ${user?.hasVoted ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-white truncate">
            {user?.hasVoted ? 'Vote Recorded' : 'Ballot Ready'}
          </div>
          <div className="text-xs text-slate-500">
            {user?.hasVoted ? 'Confirmed on Ethereum contract' : 'No active vote cast yet'}
          </div>
        </Card>

        <Card className="p-5 border-slate-800 bg-slate-900/80 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Host Status</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-white uppercase tracking-wider">
            {user?.hostPermissionStatus || 'NONE'}
          </div>
          <div className="text-xs text-slate-500">
            {canHostElections ? 'Authorized to publish elections' : 'Request host permission in settings'}
          </div>
        </Card>
      </div>

      {/* Main Grid: Live Election Command Center & Discoverable Elections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Live Center + Upcoming Discoverable Elections */}
        <div className="lg:col-span-2 space-y-8">
          {/* Featured / Active Election */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <Vote className="w-5 h-5 text-indigo-400" />
                <span>Live Election Command Center</span>
              </h2>
              <Link to="/elections" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1">
                View All <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loading ? (
              <CardSkeleton />
            ) : activeElection ? (
              <Card className="p-6 sm:p-8 border-indigo-900/60 bg-gradient-to-br from-slate-900 via-indigo-950/20 to-slate-900 shadow-2xl relative overflow-hidden space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-950/80 text-emerald-400 border border-emerald-800">
                        POLLING ACTIVE
                      </span>
                      <span className="text-xs text-slate-400">{activeElection.organization || 'Public Election'}</span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">{activeElection.title}</h3>
                  </div>

                  <ElectionCountdown
                    startTime={activeElection.startTime}
                    endTime={activeElection.endTime}
                    status={activeElection.status}
                  />
                </div>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {activeElection.description || 'Cast your ballot securely. Votes are recorded immutably on the Ethereum smart contract.'}
                </p>

                {/* Candidate Quick Stats */}
                <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-slate-300 font-medium">
                    <Users className="w-4 h-4 text-indigo-400" />
                    <span>Candidates contesting:</span>
                    <span className="font-bold text-white">{candidates.length}</span>
                  </div>
                  <div className="text-emerald-400 font-mono font-semibold">
                    Smart Contract Validated ✓
                  </div>
                </div>

                {/* Voting Action CTA */}
                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                  <Button
                    size="lg"
                    onClick={() => navigate(`/elections/${activeElection.id}`)}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 shadow-indigo-900/40 text-white font-semibold flex items-center justify-center gap-2"
                  >
                    <Vote className="w-4 h-4" />
                    <span>{user?.hasVoted ? 'View Election Tally' : 'Cast Encrypted Vote'}</span>
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => navigate('/results')}
                    className="flex-1 border-slate-700 hover:bg-slate-800 text-slate-200 flex items-center justify-center gap-2"
                  >
                    <Activity className="w-4 h-4 text-emerald-400" />
                    <span>View Live Results</span>
                  </Button>
                </div>
              </Card>
            ) : (
              <EmptyState
                icon={Vote}
                title="No Active Elections Right Now"
                description="There are currently no active polls accepting votes. Explore upcoming scheduled elections below."
                actionLabel="Explore Scheduled Elections"
                onAction={() => navigate('/elections')}
              />
            )}
          </div>

          {/* Upcoming Elections Discovery Feed */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Upcoming Scheduled Elections ({upcomingCount})</span>
              </h3>
              <Link to="/elections?status=UPCOMING" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium">
                Browse All Upcoming →
              </Link>
            </div>

            {upcomingElections.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {upcomingElections.slice(0, 4).map((elec) => (
                  <Card key={elec.id} className="p-5 border-slate-800 bg-slate-900/70 space-y-3 hover:border-indigo-500/40 transition">
                    <div className="flex justify-between items-start">
                      <h4 className="text-sm font-bold text-white line-clamp-1">{elec.title}</h4>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-950 text-amber-300 border border-amber-800">
                        UPCOMING
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-2">
                      {elec.description || 'Decentralized cryptographic election.'}
                    </p>
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        Starts: {new Date(elec.startTime).toLocaleDateString()}
                      </span>
                      <span className="text-indigo-300 font-medium">
                        {elec.candidates?.length || 0} Candidates
                      </span>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => navigate(`/elections/${elec.id}`)} className="w-full text-xs mt-2 border-indigo-500/30 text-indigo-300">
                      View Details
                    </Button>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 text-xs text-slate-400 text-center">
                No scheduled elections pending launch at this time.
              </div>
            )}
          </div>

          {/* Hosted Elections Preview (For Approved Hosts) */}
          {canHostElections && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  My Hosted Elections ({myHostedElections.length})
                </h3>
                <Link to="/host/elections" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium">
                  Manage All →
                </Link>
              </div>

              {myHostedElections.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {myHostedElections.slice(0, 2).map((elec) => (
                    <Card key={elec.id} className="p-5 border-slate-800 bg-slate-900/70 space-y-3">
                      <div className="flex justify-between items-start">
                        <h4 className="text-sm font-bold text-white truncate">{elec.title}</h4>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-indigo-950 text-indigo-300 border border-indigo-800">
                          {elec.status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>{new Date(elec.startTime).toLocaleDateString()}</span>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => navigate(`/elections/${elec.id}`)} className="w-full text-xs">
                        Manage Election Details
                      </Button>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
                  <span>You have not created any elections yet.</span>
                  <Button size="sm" onClick={() => navigate('/elections/create')}>
                    Create First Election
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Col: Blockchain Integrity & Security Center */}
        <div className="space-y-6">
          <BlockchainIntegrityCard />

          {/* Quick Actions Shortcuts */}
          <Card className="p-6 border-slate-800 bg-slate-900/90 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white tracking-tight uppercase tracking-wider text-slate-400">
              Quick Shortcuts
            </h3>
            <div className="space-y-2">
              <button
                onClick={() => navigate('/elections')}
                className="w-full p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-indigo-500/50 text-left flex items-center justify-between text-xs sm:text-sm text-slate-200 hover:text-white transition-all group"
              >
                <div className="flex items-center gap-3">
                  <Vote className="w-4 h-4 text-indigo-400" />
                  <span>Discover All Elections</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white" />
              </button>

              <button
                onClick={() => navigate('/activity')}
                className="w-full p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-indigo-500/50 text-left flex items-center justify-between text-xs sm:text-sm text-slate-200 hover:text-white transition-all group"
              >
                <div className="flex items-center gap-3">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span>My Voting Activity Ledger</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white" />
              </button>

              <button
                onClick={() => navigate('/settings/security')}
                className="w-full p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-indigo-500/50 text-left flex items-center justify-between text-xs sm:text-sm text-slate-200 hover:text-white transition-all group"
              >
                <div className="flex items-center gap-3">
                  <Shield className="w-4 h-4 text-indigo-400" />
                  <span>Security & WebAuthn Setup</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white" />
              </button>

              {!canHostElections && (
                <button
                  onClick={() => navigate('/host-request')}
                  className="w-full p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-indigo-500/50 text-left flex items-center justify-between text-xs sm:text-sm text-slate-200 hover:text-white transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Request Host Authorization</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white" />
                </button>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
