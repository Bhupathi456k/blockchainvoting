import React, { useState, useEffect } from 'react';
import { blockchainAPI } from '../services/api';
import { CheckCircle, Search, AlertCircle } from 'lucide-react';

const BlockchainExplorer = () => {
  const [status, setStatus] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [searchHash, setSearchHash] = useState('');
  const [searchedTx, setSearchedTx] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBlockchainData();
  }, []);

  const fetchBlockchainData = async () => {
    try {
      setLoading(true);
      const [statusRes, txRes] = await Promise.all([
        blockchainAPI.getStatus(),
        blockchainAPI.getTransactions({ limit: 10 }),
      ]);
      setStatus(statusRes.data.data);
      setTransactions(txRes.data.data.transactions || []);
    } catch (err) {
      setError('Failed to load blockchain information');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchHash) return;

    setSearching(true);
    setSearchedTx(null);
    setError('');

    try {
      const response = await blockchainAPI.verifyTransaction(searchHash);
      setSearchedTx(response.data.data);
    } catch (err) {
      setError('Transaction not found on blockchain');
    } finally {
      setSearching(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-white mb-2">Blockchain Explorer</h1>
      <p className="text-gray-400 mb-8">Inspect verifiable transactions and blockchain state</p>

      {/* Network & Contract Status */}
      {status && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <span className="text-gray-400 text-sm">Chain ID</span>
            <div className="text-2xl font-bold text-white mt-1">{status.chainId}</div>
            <span className="text-xs text-green-400">Hardhat Local Node</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <span className="text-gray-400 text-sm">Current Block</span>
            <div className="text-2xl font-bold text-indigo-400 mt-1">#{status.blockNumber}</div>
            <span className="text-xs text-gray-500">Live Blockchain State</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <span className="text-gray-400 text-sm">Smart Contract</span>
            <div className="text-sm font-mono text-green-400 mt-1 truncate">
              {status.contract?.address || 'Not Deployed'}
            </div>
            <span className="text-xs text-gray-500">
              Total Votes: {status.contract?.totalVotes || 0}
            </span>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex gap-2">
          <input
            type="text"
            value={searchHash}
            onChange={(e) => setSearchHash(e.target.value)}
            placeholder="Search by Transaction Hash (0x...)"
            className="flex-1 px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={searching}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl flex items-center space-x-2 transition"
          >
            <Search className="h-4 w-4" />
            <span>Verify</span>
          </button>
        </div>
      </form>

      {error && (
        <div className="bg-red-950/50 border border-red-500/50 rounded-xl p-4 mb-6 flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-red-300">{error}</p>
        </div>
      )}

      {/* Searched Transaction Result */}
      {searchedTx && (
        <div className="bg-slate-900 border border-indigo-500/50 rounded-xl p-6 mb-8">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-400" />
            <span>Verified Blockchain Transaction</span>
          </h3>
          <div className="space-y-3 font-mono text-xs">
            <div>
              <span className="text-gray-500">Tx Hash:</span>
              <p className="text-white break-all">{searchedTx.blockchain.hash}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500">Block Number:</span>
                <p className="text-indigo-400">#{searchedTx.blockchain.blockNumber}</p>
              </div>
              <div>
                <span className="text-gray-500">Status:</span>
                <p className="text-green-400">{searchedTx.blockchain.status}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Transactions List */}
      <h2 className="text-xl font-bold text-white mb-4">Recent Blockchain Transactions</h2>
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        {transactions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No transactions recorded yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {transactions.map((tx) => (
              <div key={tx.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div className="font-mono text-xs">
                  <span className="text-indigo-400 font-bold mr-2">[{tx.transactionType}]</span>
                  <span className="text-white truncate">{tx.transactionHash}</span>
                </div>
                <div className="flex items-center space-x-4 text-xs">
                  <span className="text-gray-400">Block #{tx.blockNumber}</span>
                  <span className="text-green-400">{tx.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BlockchainExplorer;
