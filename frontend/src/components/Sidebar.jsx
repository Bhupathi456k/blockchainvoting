import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Vote,
  Activity,
  Shield,
  User,
  PlusCircle,
  Sparkles,
  Users,
  FileText,
  Key,
  Database,
  Award,
  Cpu,
  LogOut,
  X,
  ChevronRight,
} from 'lucide-react';

const Sidebar = ({ isMobileOpen, onCloseMobile }) => {
  const { user, isAdmin, canHostElections, logout } = useAuth();
  const location = useLocation();

  if (!user) return null;

  let navItems = [];

  if (isAdmin) {
    navItems = [
      { label: 'Admin Overview', path: '/admin', icon: LayoutDashboard },
      { label: 'User Management', path: '/admin/users', icon: Users },
      { label: 'Host Requests', path: '/admin/host-requests', icon: Sparkles },
      { label: 'Elections Control', path: '/admin/elections', icon: Vote },
      { label: 'Candidate Registry', path: '/admin/candidates', icon: Award },
      { label: 'Blockchain Transactions', path: '/admin/transactions', icon: Cpu },
      { label: 'Results Center', path: '/results', icon: Activity },
      { label: 'Reports & Analytics', path: '/admin/reports', icon: FileText },
      { label: 'Audit Logs', path: '/admin/audit-logs', icon: Key },
      { label: 'System Health', path: '/admin/settings', icon: Database },
    ];
  } else if (canHostElections) {
    navItems = [
      { label: 'Dashboard Overview', path: '/dashboard', icon: LayoutDashboard },
      { label: 'Explore Elections', path: '/elections', icon: Vote },
      { label: 'My Hosted Elections', path: '/host/elections', icon: Award },
      { label: 'Create New Election', path: '/elections/create', icon: PlusCircle },
      { label: 'My Voting Activity', path: '/activity', icon: Activity },
      { label: 'Security Center', path: '/settings/security', icon: Shield },
      { label: 'My Profile', path: '/profile', icon: User },
    ];
  } else {
    navItems = [
      { label: 'Dashboard Overview', path: '/dashboard', icon: LayoutDashboard },
      { label: 'Explore Elections', path: '/elections', icon: Vote },
      { label: 'My Voting Activity', path: '/activity', icon: Activity },
      { label: 'Host Permission', path: '/host-request', icon: Sparkles },
      { label: 'Security Center', path: '/settings/security', icon: Shield },
      { label: 'My Profile', path: '/profile', icon: User },
    ];
  }

  const roleLabel = isAdmin ? 'SYSTEM ADMIN' : canHostElections ? 'APPROVED HOST' : 'VOTER';
  const roleBadgeStyle = isAdmin
    ? 'bg-red-950/80 border-red-800 text-red-300'
    : canHostElections
    ? 'bg-indigo-950/80 border-indigo-800 text-indigo-300'
    : 'bg-emerald-950/80 border-emerald-800 text-emerald-300';

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm lg:hidden animate-in fade-in"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 w-64 bg-slate-900/95 border-r border-slate-800/80 backdrop-blur-xl transition-transform duration-300 transform flex flex-col justify-between ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-4 space-y-6 overflow-y-auto flex-1">
          {/* User Badge Header */}
          <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border ${roleBadgeStyle}`}>
                {roleLabel}
              </span>
              <button
                onClick={onCloseMobile}
                className="lg:hidden text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <div className="text-xs font-bold text-white truncate">{user.name}</div>
              <div className="text-[11px] text-slate-400 font-mono truncate">{user.email || user.voterId}</div>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1">
            <div className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Menu Navigation
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onCloseMobile}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-indigo-600 text-white font-semibold shadow-lg shadow-indigo-900/30'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-white/70" />}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer Logout */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-950/40 border border-red-900/30 transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out Platform</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
