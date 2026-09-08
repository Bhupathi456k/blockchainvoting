import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Vote, LogOut, User, Shield, Wallet, CheckCircle, AlertCircle } from 'lucide-react';

const Navbar = () => {
  const { user, logout, isAdmin, walletConnected, walletAddress, connectWallet } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  return (
    <nav className="bg-slate-900 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <Vote className="h-8 w-8 text-indigo-400" />
              <span className="font-bold text-xl tracking-tight">BlockVote</span>
            </Link>

            {user && (
              <div className="hidden md:flex ml-10 space-x-4">
                <Link
                  to="/dashboard"
                  className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                >
                  Dashboard
                </Link>
                <Link
                  to="/results"
                  className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                >
                  Results
                </Link>
                <Link
                  to="/blockchain"
                  className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                >
                  Blockchain Explorer
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="text-indigo-400 hover:text-indigo-300 px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-1"
                  >
                    <Shield className="h-4 w-4" />
                    <span>Admin Panel</span>
                  </Link>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {/* Wallet Connection Status */}
                {walletConnected ? (
                  <div className="flex items-center space-x-2 bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700 text-xs text-green-400">
                    <CheckCircle className="h-4 w-4" />
                    <span>{formatAddress(walletAddress)}</span>
                  </div>
                ) : (
                  <button
                    onClick={connectWallet}
                    className="flex items-center space-x-1 bg-amber-600 hover:bg-amber-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition"
                  >
                    <Wallet className="h-4 w-4" />
                    <span>Connect Wallet</span>
                  </button>
                )}

                {/* User info */}
                <div className="flex items-center space-x-2 text-sm text-gray-300">
                  <User className="h-4 w-4" />
                  <span>{user.name}</span>
                  <span className="text-xs bg-slate-800 px-2 py-0.5 rounded text-indigo-400 border border-slate-700">
                    {user.role}
                  </span>
                </div>

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className="text-gray-400 hover:text-red-400 p-2 rounded-lg transition"
                  title="Logout"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
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
