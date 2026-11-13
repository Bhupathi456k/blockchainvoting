import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Vote,
  LogOut,
  User,
  Shield,
  Wallet,
  CheckCircle2,
  Menu,
  X,
  Search,
  Command,
  Bell,
  Check,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = ({ onToggleSidebar, onOpenCommandPalette }) => {
  const { user, logout, isAdmin, walletConnected, walletAddress, connectWallet } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);

  const [notifications, setNotifications] = useState([
    {
      id: '1',
      title: 'Platform Ready',
      message: 'MongoDB & Hardhat Blockchain fully connected.',
      time: 'Just now',
      unread: true,
    },
    {
      id: '2',
      title: 'WebAuthn Security Enabled',
      message: 'Direct single-step authentication active.',
      time: '5m ago',
      unread: true,
    },
  ]);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const handleLogout = () => {
    logout();
    navigate('/login');
    setUserDropdownOpen(false);
  };

  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  return (
    <nav className="bg-slate-900/95 backdrop-blur-md text-white shadow-xl sticky top-0 z-50 border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Left: Brand Logo & Mobile Toggle */}
          <div className="flex items-center gap-3">
            {user && (
              <button
                onClick={onToggleSidebar}
                className="lg:hidden text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800/50 border border-slate-700/60"
                title="Toggle Navigation Menu"
              >
                <Menu className="h-5 w-5" />
              </button>
            )}

            <Link to="/" className="flex items-center space-x-2.5 group">
              <div className="bg-indigo-600/20 p-2 rounded-xl border border-indigo-500/30 group-hover:border-indigo-500/60 transition-all shadow-inner">
                <Vote className="h-5 w-5 text-indigo-400" />
              </div>
              <span className="font-bold text-lg sm:text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
                BlockVote
              </span>
            </Link>
          </div>

          {/* Center: Search & Command Palette Bar (Desktop) */}
          {user && (
            <div className="hidden md:flex flex-1 max-w-md mx-4">
              <button
                onClick={onOpenCommandPalette}
                className="w-full bg-slate-950/60 border border-slate-800 hover:border-indigo-500/50 rounded-xl px-3.5 py-1.5 flex items-center justify-between text-xs text-slate-400 transition-all shadow-inner group"
              >
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-slate-500 group-hover:text-indigo-400" />
                  <span>Search elections, voters, or commands...</span>
                </div>
                <kbd className="hidden sm:inline-flex items-center gap-1 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-[10px] font-mono text-slate-400">
                  <Command className="w-3 h-3" /> K
                </kbd>
              </button>
            </div>
          )}

          {/* Right: Actions, Notifications & Profile */}
          <div className="hidden md:flex items-center space-x-3">
            {user ? (
              <>
                {/* Wallet Button */}
                {walletConnected ? (
                  <div className="flex items-center space-x-2 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-emerald-800/60 text-xs">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                    <span className="text-slate-300 font-mono font-medium">{formatAddress(walletAddress)}</span>
                  </div>
                ) : (
                  <button
                    onClick={connectWallet}
                    className="flex items-center space-x-1.5 bg-amber-600 hover:bg-amber-500 text-white px-3 py-1.5 rounded-xl text-xs font-semibold shadow-md shadow-amber-900/30 transition-all"
                  >
                    <Wallet className="h-4 w-4" />
                    <span>Connect Wallet</span>
                  </button>
                )}

                {/* Notifications Center */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setNotifDropdownOpen(!notifDropdownOpen);
                      setUserDropdownOpen(false);
                    }}
                    className="relative text-slate-400 hover:text-white p-2 rounded-xl bg-slate-950/60 border border-slate-800 transition-colors"
                  >
                    <Bell className="w-4 h-4" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-500 text-white font-bold text-[10px] rounded-full flex items-center justify-center animate-pulse">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {notifDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-4 z-50 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <span className="text-xs font-bold text-white uppercase tracking-wider">
                          Notifications
                        </span>
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllRead}
                            className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {notifications.map((n) => (
                          <div
                            key={n.id}
                            className={`p-2.5 rounded-xl border text-xs space-y-1 ${
                              n.unread
                                ? 'bg-indigo-950/40 border-indigo-800/60 text-slate-200'
                                : 'bg-slate-950/40 border-slate-800 text-slate-400'
                            }`}
                          >
                            <div className="flex justify-between font-semibold text-white">
                              <span>{n.title}</span>
                              <span className="text-[10px] text-slate-500">{n.time}</span>
                            </div>
                            <p className="text-[11px] text-slate-400">{n.message}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* User Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setUserDropdownOpen(!userDropdownOpen);
                      setNotifDropdownOpen(false);
                    }}
                    className="flex items-center space-x-2 bg-slate-950/60 hover:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-800 transition-all text-xs"
                  >
                    <User className="h-4 w-4 text-indigo-400" />
                    <span className="text-slate-200 font-medium max-w-28 truncate">{user.name}</span>
                    <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                  </button>

                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 z-50 space-y-1 text-xs">
                      <div className="p-3 border-b border-slate-800">
                        <div className="font-bold text-white">{user.name}</div>
                        <div className="text-slate-400 text-[11px] truncate font-mono">{user.email || user.voterId}</div>
                      </div>

                      <Link
                        to="/profile"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center space-x-2 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 transition-all"
                      >
                        <User className="w-4 h-4 text-slate-400" />
                        <span>My Profile</span>
                      </Link>

                      <Link
                        to="/settings/security"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center space-x-2 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 transition-all"
                      >
                        <Shield className="w-4 h-4 text-slate-400" />
                        <span>Security & Biometrics</span>
                      </Link>

                      {isAdmin && (
                        <Link
                          to="/admin"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center space-x-2 px-3 py-2 rounded-xl text-indigo-400 hover:bg-indigo-950/40 transition-all font-semibold"
                        >
                          <Shield className="w-4 h-4 text-indigo-400" />
                          <span>Admin Portal</span>
                        </Link>
                      )}

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-red-400 hover:bg-red-950/40 transition-all"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="text-slate-300 hover:text-white hover:bg-slate-800/50 px-4 py-2 rounded-xl text-xs font-semibold transition-all"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-lg shadow-indigo-900/30 transition-all"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;