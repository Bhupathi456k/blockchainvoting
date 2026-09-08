import React from 'react';
import { Link } from 'react-router-dom';
import { Vote, Shield, Zap, Lock, CheckCircle, ArrowRight } from 'lucide-react';

const Home = () => {
  return (
    <div className="min-h-[90vh]">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="mb-6">
          <Vote className="h-16 w-16 text-indigo-400 mx-auto mb-4" />
        </div>
        <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-indigo-400 to-purple-400 text-transparent bg-clip-text">
          Secure Digital Voting Platform
        </h1>
        <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
          A tamper-proof electronic voting system powered by Ethereum blockchain technology and smart contracts
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/register"
            className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg transition flex items-center justify-center space-x-2"
          >
            <span>Register to Vote</span>
            <ArrowRight className="h-5 w-5" />
          </Link>
          <Link
            to="/login"
            className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl border border-slate-700 transition"
          >
            Sign In
          </Link>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <Shield className="h-10 w-10 text-indigo-400 mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">Blockchain Security</h3>
            <p className="text-sm text-gray-400">
              All votes stored on Ethereum blockchain for tamper-proof transparency
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <Lock className="h-10 w-10 text-green-400 mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">Duplicate Prevention</h3>
            <p className="text-sm text-gray-400">
              Smart contract prevents duplicate voting at the blockchain level
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <Zap className="h-10 w-10 text-yellow-400 mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">Real-time Results</h3>
            <p className="text-sm text-gray-400">
              Vote counting directly calculated from blockchain state
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <CheckCircle className="h-10 w-10 text-purple-400 mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">Verifiable</h3>
            <p className="text-sm text-gray-400">
              Every transaction verified with transaction hash and block number
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
