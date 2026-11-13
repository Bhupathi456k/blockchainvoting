import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { electionsAPI } from '../services/api';
import {
  Search,
  LayoutDashboard,
  Vote,
  Shield,
  UserCheck,
  FileText,
  Activity,
  Key,
  LogOut,
  X,
  Sparkles,
  PlusCircle,
  Clock,
  ArrowRight,
} from 'lucide-react';

const CommandPalette = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [searchedElections, setSearchedElections] = useState([]);
  const [searching, setSearching] = useState(false);
  const navigate = useNavigate();
  const { user, isAdmin, canHostElections, logout } = useAuth();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Live search elections when query changes
  useEffect(() => {
    if (!query.trim()) {
      setSearchedElections([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setSearching(true);
        const res = await electionsAPI.getElections({ q: query.trim(), limit: 5 });
        const list = res.data?.data?.elections || res.data?.data || [];
        setSearchedElections(Array.isArray(list) ? list : []);
      } catch (err) {
        setSearchedElections([]);
      } finally {
        setSearching(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const actions = [
    {
      category: 'General Navigation',
      items: [
        { id: 'dash', label: 'Go to User Dashboard', icon: LayoutDashboard, path: '/dashboard' },
        { id: 'elections', label: 'Browse All Elections', icon: Vote, path: '/elections' },
        { id: 'activity', label: 'View My Voting Activity', icon: Activity, path: '/activity' },
        { id: 'security', label: 'Security & WebAuthn Settings', icon: Shield, path: '/settings/security' },
      ],
    },
  ];

  if (canHostElections) {
    actions.push({
      category: 'Host Portal',
      items: [
        { id: 'host-create', label: 'Create & Host New Election', icon: PlusCircle, path: '/elections/create' },
        { id: 'host-elections', label: 'Manage My Hosted Elections', icon: Vote, path: '/host/elections' },
      ],
    });
  } else if (!isAdmin) {
    actions.push({
      category: 'Host Portal',
      items: [
        { id: 'host-req', label: 'Request Election Host Authorization', icon: Sparkles, path: '/host-request' },
      ],
    });
  }

  if (isAdmin) {
    actions.push({
      category: 'System Administration',
      items: [
        { id: 'admin-dash', label: 'Admin Command Center', icon: LayoutDashboard, path: '/admin' },
        { id: 'admin-users', label: 'Manage Platform Users', icon: UserCheck, path: '/admin/users' },
        { id: 'admin-hosts', label: 'Review Pending Host Requests', icon: Sparkles, path: '/admin/host-requests' },
        { id: 'admin-elections', label: 'Global Election Management', icon: Vote, path: '/admin/elections' },
        { id: 'admin-reports', label: 'Export System Reports', icon: FileText, path: '/admin/reports' },
        { id: 'admin-logs', label: 'View Audit Logs', icon: Key, path: '/admin/audit-logs' },
      ],
    });
  }

  const handleSelect = (path) => {
    onClose();
    setQuery('');
    navigate(path);
  };

  const filteredActions = actions.map((group) => ({
    ...group,
    items: group.items.filter((item) =>
      item.label.toLowerCase().includes(query.toLowerCase())
    ),
  })).filter((group) => group.items.length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Header */}
        <div className="p-4 border-b border-slate-800 flex items-center gap-3 bg-slate-950/60">
          <Search className="w-5 h-5 text-indigo-400 flex-shrink-0" />
          <input
            id="command-palette-input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search elections, pages, or commands... (Esc to close)"
            className="w-full bg-transparent text-white placeholder-slate-500 text-sm focus:outline-none"
            autoFocus
          />
          {searching && (
            <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          )}
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Command & Elections List */}
        <div className="p-2 overflow-y-auto space-y-4 divide-y divide-slate-800/40">
          {/* Live Discovered Elections */}
          {query.trim() && searchedElections.length > 0 && (
            <div className="pt-2 first:pt-0 space-y-1">
              <div className="px-3 text-[11px] font-bold text-indigo-400 uppercase tracking-wider flex items-center justify-between">
                <span>Matching Elections ({searchedElections.length})</span>
                <span className="text-[10px] text-slate-500">Live API</span>
              </div>
              {searchedElections.map((election) => (
                <button
                  key={election.id}
                  onClick={() => handleSelect(`/elections/${election.id}`)}
                  className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-indigo-950/50 hover:border-indigo-800/50 border border-transparent flex items-center justify-between text-xs sm:text-sm text-slate-200 hover:text-white transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <Vote className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <div>
                      <div className="font-semibold text-white">{election.title}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                          election.status === 'ACTIVE'
                            ? 'bg-emerald-950 text-emerald-300'
                            : 'bg-amber-950 text-amber-300'
                        }`}>
                          {election.status}
                        </span>
                        <span>Starts: {new Date(election.startTime).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] text-indigo-400 group-hover:text-indigo-300 font-mono">View Election →</span>
                </button>
              ))}
              <button
                onClick={() => handleSelect(`/elections?q=${encodeURIComponent(query.trim())}`)}
                className="w-full text-left px-3 py-2 rounded-lg text-xs text-indigo-400 hover:text-indigo-300 hover:bg-slate-800/40 flex items-center gap-1.5 font-medium mt-1"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>Search all elections for "{query.trim()}"</span>
              </button>
            </div>
          )}

          {/* Navigation Actions */}
          {filteredActions.length > 0 && (
            filteredActions.map((group) => (
              <div key={group.category} className="pt-2 first:pt-0 space-y-1">
                <div className="px-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  {group.category}
                </div>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item.path)}
                      className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-indigo-950/50 hover:border-indigo-800/50 border border-transparent flex items-center justify-between text-xs sm:text-sm text-slate-300 hover:text-white transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4 text-indigo-400 group-hover:text-indigo-300 flex-shrink-0" />
                        <span>{item.label}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 group-hover:text-slate-400 font-mono">Jump →</span>
                    </button>
                  );
                })}
              </div>
            ))
          )}

          {query.trim() && searchedElections.length === 0 && filteredActions.length === 0 && (
            <div className="p-8 text-center text-xs text-slate-500 space-y-2">
              <p>No matching elections or commands found for "{query}".</p>
              <button
                onClick={() => handleSelect(`/elections?q=${encodeURIComponent(query.trim())}`)}
                className="text-indigo-400 hover:underline inline-block text-xs"
              >
                Search in Elections Discovery page →
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-[11px] text-slate-500">
          <span>Search elections or commands</span>
          <span className="font-mono bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-slate-400">
            Ctrl + K
          </span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
