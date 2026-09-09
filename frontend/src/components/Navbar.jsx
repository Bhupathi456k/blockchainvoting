import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Vote, LogOut, User, Shield, Wallet, CheckCircle, Menu, X } from 'lucide-react';

const Navbar = () => {
  const { user, logout, isAdmin, walletConnected, walletAddress, connectWallet } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMobileMenuOpen(false);
  };

  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <nav className="bg-slate-900/95 backdrop-blur-sm text-white shadow-lg sticky top-0 z-50 border-b border-slate-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Brand */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2.5 group" onClick={closeMobileMenu}>
              <div className="bg-indigo-600/20 p-1.5 rounded-lg border border-indigo-500/30 group-hover:border-indigo-500/50 transition-colors">
                <Vote className="h-6 w-6 text-indigo-400" />
              </div>
              <span className="font-bold text-xl tracking-tight">BlockVote</span>
            </Link>

            {/* Desktop Navigation Links */}
            {user && (
              <div className="hidden md:flex ml-8 space-x-1">
                <Link
                  to="/dashboard"
                  className="text-slate-300 hover:text-white hover:bg-slate-800/50 px-3 py-2 rounded-lg text-sm font-medium transition-all"
                >
                  Dashboard
                </Link>
                <Link
                  to="/elections"
                  className="text-slate-300 hover:text-white hover:bg-slate-800/50 px-3 py-2 rounded-lg text-sm font-medium transition-all"
                >
                  Elections
                </Link>
                <Link
                  to="/results"
                  className="text-slate-300 hover:text-white hover:bg-slate-800/50 px-3 py-2 rounded-lg text-sm font-medium transition-all"
                >
                  Results
                </Link>
                <Link
                  to="/blockchain"
                  className="text-slate-300 hover:text-white hover:bg-slate-800/50 px-3 py-2 rounded-lg text-sm font-medium transition-all"
                >
                  Explorer
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="text-indigo-400 hover:text-indigo-300 hover:bg-indigo-950/30 px-3 py-2 rounded-lg text-sm font-medium flex items-center space-x-1.5 transition-all"
                  >
                    <Shield className="h-4 w-4" />
                    <span>Admin</span>
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Desktop Right Side */}
          <div className="hidden md:flex items-center space-x-3">
            {user ? (
              <>
                {/* Wallet Connection */}
                {walletConnected ? (
                  <div className="flex items-center space-x-2 bg-slate-800/70 px-3 py-1.5 rounded-lg border border-slate-700 text-xs">
                    <CheckCircle className="h-3.5 w-3.5 text-green-400" />
                    <span className="text-slate-300 font-mono">{formatAddress(walletAddress)}</span>
                  </div>
                ) : (
                  <button
                    onClick={connectWallet}
                    className="flex items-center space-x-1.5 bg-amber-600 hover:bg-amber-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  >
                    <Wallet className="h-3.5 w-3.5" />
                    <span>Connect Wallet</span>
                  </button>
                )}

                {/* User Info */}
                <div className="flex items-center space-x-2 bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700">
                  <User className="h-4 w-4 text-slate-400" />
                  <span className="text-sm text-slate-200 max-w-32 truncate">{user.name}</span>
                  <span className="text-xs bg-indigo-950/70 px-2 py-0.5 rounded text-indigo-400 border border-indigo-800/50">
                    {user.role}
                  </span>
                </div>

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className="text-slate-400 hover:text-red-400 hover:bg-slate-800/50 p-2 rounded-lg transition-all"
                  title="Logout"
                  aria-label="Logout"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="text-slate-300 hover:text-white hover:bg-slate-800/50 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg shadow-indigo-900/30 transition-all"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-slate-300 hover:text-white p-2 rounded-lg hover:bg-slate-800/50 transition-all"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-900/98 backdrop-blur-sm">
          <div className="px-4 py-3 space-y-2">
            {user ? (
              <>
                {/* User Info Mobile */}
                <div className="flex items-center space-x-2 bg-slate-800/50 px-3 py-2 rounded-lg border border-slate-700 mb-3">
                  <User className="h-4 w-4 text-slate-400" />
                  <span className="text-sm text-slate-200 flex-1 truncate">{user.name}</span>
                  <span className="text-xs bg-indigo-950/70 px-2 py-0.5 rounded text-indigo-400 border border-indigo-800/50">
                    {user.role}
                  </span>
                </div>

                {/* Wallet Mobile */}
                {walletConnected ? (
                  <div className="flex items-center space-x-2 bg-slate-800/70 px-3 py-2 rounded-lg border border-slate-700 mb-3">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span className="text-xs text-slate-300 font-mono">{formatAddress(walletAddress)}</span>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      connectWallet();
                      closeMobileMenu();
                    }}
                    className="w-full flex items-center justify-center space-x-1.5 bg-amber-600 hover:bg-amber-500 text-white px-3 py-2 rounded-lg text-sm font-medium transition-all mb-3"
                  >
                    <Wallet className="h-4 w-4" />
                    <span>Connect Wallet</span>
                  </button>
                )}

                {/* Navigation Links Mobile */}
                <Link
                  to="/dashboard"
                  onClick={closeMobileMenu}
                  className="block text-slate-300 hover:text-white hover:bg-slate-800/50 px-3 py-2 rounded-lg text-sm font-medium transition-all"
                >
                  Dashboard
                </Link>
                <Link
                  to="/elections"
                  onClick={closeMobileMenu}
                  className="block text-slate-300 hover:text-white hover:bg-slate-800/50 px-3 py-2 rounded-lg text-sm font-medium transition-all"
                >
                  Elections Discovery
                </Link>
                <Link
                  to="/results"
                  onClick={closeMobileMenu}
                  className="block text-slate-300 hover:text-white hover:bg-slate-800/50 px-3 py-2 rounded-lg text-sm font-medium transition-all"
                >
                  Results
                </Link>
                <Link
                  to="/blockchain"
                  onClick={closeMobileMenu}
                  className="block text-slate-300 hover:text-white hover:bg-slate-800/50 px-3 py-2 rounded-lg text-sm font-medium transition-all"
                >
                  Blockchain Explorer
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={closeMobileMenu}
                    className="flex items-center space-x-1.5 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-950/30 px-3 py-2 rounded-lg text-sm font-medium transition-all"
                  >
                    <Shield className="h-4 w-4" />
                    <span>Admin Panel</span>
                  </Link>
                )}

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-2 text-red-400 hover:text-red-300 hover:bg-red-950/20 px-3 py-2 rounded-lg text-sm font-medium transition-all mt-2"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={closeMobileMenu}
                  className="block text-slate-300 hover:text-white hover:bg-slate-800/50 px-3 py-2 rounded-lg text-sm font-medium transition-all"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={closeMobileMenu}
                  className="block bg-indigo-600 hover:bg-indigo-500 text-white text-center px-3 py-2 rounded-lg text-sm font-medium transition-all"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
