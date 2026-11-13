import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { electionsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Vote,
  Calendar,
  Clock,
  Users,
  Search,
  PlusCircle,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  Filter,
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Input from '../components/ui/Input';

const ElectionsList = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, canHostElections } = useAuth();
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);

  // Initialize state from URL parameters
  const [filter, setFilter] = useState(() => searchParams.get('status') || 'ALL');
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get('q') || '');
  const [sort, setSort] = useState(() => searchParams.get('sort') || 'createdAt');
  const [page, setPage] = useState(() => parseInt(searchParams.get('page') || '1', 10));
  const [limit, setLimit] = useState(() => parseInt(searchParams.get('limit') || '12', 10));
  const [totalCount, setTotalCount] = useState(0);

  // Update URL parameters when state changes
  useEffect(() => {
    const params = new URLSearchParams();
    if (filter !== 'ALL') params.set('status', filter);
    if (searchTerm) params.set('q', searchTerm);
    if (sort !== 'createdAt') params.set('sort', sort);
    if (page > 1) params.set('page', page.toString());
    if (limit !== 12) params.set('limit', limit.toString());
    setSearchParams(params, { replace: true });
  }, [filter, searchTerm, sort, page, limit, setSearchParams]);

  useEffect(() => {
    fetchElections();
  }, [filter, searchTerm, sort, page, limit]);

  const fetchElections = async () => {
    try {
      setLoading(true);
      const res = await electionsAPI.getElections({
        q: searchTerm.trim() || undefined,
        status: filter === 'ALL' ? undefined : filter,
        sort: sort,
        page: page,
        limit: limit,
      });
      const rawData = res.data?.data;
      const list = Array.isArray(rawData) ? rawData : (rawData?.elections || []);
      const pagination = rawData?.pagination;
      setElections(list);
      setTotalCount(pagination?.total ?? list.length);
    } catch (err) {
      console.error('Failed to load elections:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-sm shadow-emerald-900/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            VOTING LIVE
          </span>
        );
      case 'UPCOMING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 shadow-sm shadow-amber-900/20">
            <Clock className="w-3.5 h-3.5" />
            UPCOMING
          </span>
        );
      case 'DRAFT':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/30">
            <Clock className="w-3.5 h-3.5" />
            DRAFT
          </span>
        );
      case 'ENDED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            CONCLUDED
          </span>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const activeCount = elections.filter((e) => e.status === 'ACTIVE').length;
  const upcomingCount = elections.filter((e) => e.status === 'UPCOMING').length;
  const endedCount = elections.filter((e) => e.status === 'ENDED').length;

  const filteredElections = useMemo(() => {
    return elections.filter((e) => {
      const matchesFilter = filter === 'ALL' || e.status === filter;
      const term = searchTerm.toLowerCase().trim();
      if (!term) return matchesFilter;
      const matchesSearch =
        (e.title && e.title.toLowerCase().includes(term)) ||
        (e.description && e.description.toLowerCase().includes(term)) ||
        (e.type && e.type.toLowerCase().includes(term)) ||
        (e.organization && e.organization.toLowerCase().includes(term)) ||
        (e.category && e.category.toLowerCase().includes(term));
      return matchesFilter && matchesSearch;
    });
  }, [elections, filter, searchTerm]);

  const filterTabs = [
    { label: 'All', value: 'ALL' },
    { label: 'Upcoming', value: 'UPCOMING' },
    { label: 'Active', value: 'ACTIVE' },
    { label: 'Ended', value: 'ENDED' },
  ];

  const totalPages = Math.ceil(totalCount / limit) || 1;

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-center gap-2 mt-8">
        <button
          onClick={() => setPage((prev) => Math.max(1, prev - 1))}
          disabled={page === 1}
          className="px-3 py-1.5 bg-slate-800/60 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-sm transition"
        >
          Previous
        </button>
        <span className="text-sm text-slate-400 mx-2 font-mono">
          Page {page} of {totalPages}
        </span>
        <button
          onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
          disabled={page === totalPages}
          className="px-3 py-1.5 bg-slate-800/60 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-sm transition"
        >
          Next
        </button>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-8 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-400">
              <Vote className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Elections</h1>
          </div>
          <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
            Explore active digital elections, inspect registered candidates, cast your cryptographic on-chain ballot, and view verified results.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {canHostElections ? (
            <Link to="/elections/create">
              <Button className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium flex items-center gap-2 shadow-lg shadow-indigo-900/20">
                <PlusCircle className="w-4 h-4" />
                Create New Election
              </Button>
            </Link>
          ) : (
            <Link to="/host-request">
              <Button variant="outline" className="border-indigo-500/30 text-indigo-300 hover:bg-indigo-950/40 text-xs">
                <Sparkles className="w-3.5 h-3.5 mr-1" />
                Request Hosting Permission
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Stats KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => { setFilter('ALL'); setPage(1); }}
          className={`cursor-pointer p-4 rounded-xl border transition-all ${
            filter === 'ALL'
              ? 'bg-indigo-950/40 border-indigo-500/60 shadow-lg shadow-indigo-950/40'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="text-xs text-slate-400 font-medium">All Registered</div>
          <div className="text-2xl font-bold text-white mt-1">{totalCount}</div>
        </div>

        <div
          onClick={() => { setFilter('UPCOMING'); setPage(1); }}
          className={`cursor-pointer p-4 rounded-xl border transition-all ${
            filter === 'UPCOMING'
              ? 'bg-amber-950/40 border-amber-500/60 shadow-lg shadow-amber-950/40'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="text-xs text-amber-400 font-medium flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            Upcoming / Scheduled
          </div>
          <div className="text-2xl font-bold text-white mt-1">{upcomingCount}</div>
        </div>

        <div
          onClick={() => { setFilter('ACTIVE'); setPage(1); }}
          className={`cursor-pointer p-4 rounded-xl border transition-all ${
            filter === 'ACTIVE'
              ? 'bg-emerald-950/40 border-emerald-500/60 shadow-lg shadow-emerald-950/40'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="text-xs text-emerald-400 font-medium flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Active Ballots
          </div>
          <div className="text-2xl font-bold text-white mt-1">{activeCount}</div>
        </div>

        <div
          onClick={() => { setFilter('ENDED'); setPage(1); }}
          className={`cursor-pointer p-4 rounded-xl border transition-all ${
            filter === 'ENDED'
              ? 'bg-purple-950/40 border-purple-500/60 shadow-lg shadow-purple-950/40'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="text-xs text-purple-400 font-medium flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Concluded & Verified
          </div>
          <div className="text-2xl font-bold text-white mt-1">{endedCount}</div>
        </div>
      </div>

      {/* Search and Filter Control Bar */}
      <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-xl">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <Input
            id="elections-search-input"
            type="text"
            placeholder="Search elections by title, description, category..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="pl-10 bg-slate-950/80 border-slate-700 text-sm w-full"
          />
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs text-slate-500 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Filters:
          </span>
          {filterTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => {
                setFilter(tab.value);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filter === tab.value
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/30'
                  : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Elections Grid */}
      {loading ? (
        <div className="mt-12 flex flex-col items-center justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
          <p className="mt-4 text-sm text-slate-400">Loading elections from decentralized network...</p>
        </div>
      ) : filteredElections.length === 0 ? (
        <div className="mt-8 text-center py-16 bg-slate-900/30 border border-slate-800 rounded-2xl p-8">
          <div className="flex justify-center">
            <div className="w-12 h-12 bg-indigo-950/50 border border-indigo-800/40 rounded-2xl flex items-center justify-center text-indigo-400 mb-4">
              <Search className="w-7 h-7" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-white">No Elections Found</h3>
          <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
            {searchTerm ? `No elections match query "${searchTerm}".` : 'There are currently no elections matching this status category.'}
          </p>
          {searchTerm && (
            <button
              onClick={() => { setSearchTerm(''); setFilter('ALL'); }}
              className="mt-4 text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
            >
              Clear Search & View All
            </button>
          )}
          {canHostElections && !searchTerm && (
            <Link to="/elections/create" className="inline-block mt-4">
              <Button className="bg-indigo-600 hover:bg-indigo-500 text-xs">Create First Election</Button>
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredElections.map((election) => (
              <Card
                key={election.id}
                className="flex flex-col justify-between p-6 bg-slate-900/70 border-slate-800 hover:border-indigo-500/40 hover:shadow-xl hover:shadow-indigo-950/20 transition-all group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex flex-col gap-1">
                      {getStatusBadge(election.status)}
                      <span className="text-[11px] text-slate-500 font-mono">#{election.id.slice(-6)}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-1">
                        {election.title}
                      </h3>

                      <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed min-h-[2.5rem]">
                        {election.description || 'Secure decentralized election hosted on the blockchain.'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-2 text-xs text-slate-300">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" />
                        Registered Candidates:
                      </span>
                      <span className="font-semibold text-indigo-300 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/40">
                        {election.candidates?.length || 0} Candidates
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        Starts:
                      </span>
                      <span className="text-slate-300 font-mono text-[11px]">
                        {new Date(election.startTime).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        Ends:
                      </span>
                      <span className="text-slate-300 font-mono text-[11px]">
                        {new Date(election.endTime).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center gap-2">
                  {election.status === 'ACTIVE' && (
                    <>
                      <Link to={`/elections/${election.id}`} className="flex-1">
                        <Button className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-950/40 flex items-center justify-center gap-1.5">
                          <Vote className="w-3.5 h-3.5" />
                          Vote Now
                        </Button>
                      </Link>
                      <Link to={`/results`} className="flex-1">
                        <Button variant="outline" className="w-full py-2 border-slate-700 hover:bg-slate-800 text-xs flex items-center justify-center gap-1.5">
                          <BarChart3 className="w-3.5 h-3.5" />
                          Live Results
                        </Button>
                      </Link>
                    </>
                  )}

                  {(election.status === 'UPCOMING' || election.status === 'DRAFT') && (
                    <Link to={`/elections/${election.id}`} className="flex-1">
                      <Button variant="outline" className="w-full py-2 border-indigo-500/30 hover:bg-indigo-950/40 text-indigo-300 hover:text-white text-xs flex items-center justify-center gap-1.5">
                        <ChevronRight className="w-3.5 h-3.5" />
                        View Details
                      </Button>
                    </Link>
                  )}

                  {election.status === 'ENDED' && (
                    <Link to="/results" className="flex-1">
                      <Button variant="outline" className="w-full py-2 border-slate-700 hover:bg-slate-800 text-xs flex items-center justify-center gap-1.5">
                        <BarChart3 className="w-3.5 h-3.5" />
                        View Results
                      </Button>
                    </Link>
                  )}
                </div>
              </Card>
            ))}
          </div>

          {renderPagination()}
        </>
      )}
    </div>
  );
};

export default ElectionsList;