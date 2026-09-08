import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { electionsAPI, candidatesAPI, blockchainAPI } from '../services/api';
import web3Service from '../services/web3';
import { Vote, Wallet, CheckCircle, AlertCircle, Clock, Trophy, ExternalLink } from 'lucide-react';

const Dashboard = () => {
  const { user, walletConnected, walletAddress, connectWallet, refreshUser } = useAuth();
  const [election, setElection] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [txHash, setTxHash] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchActiveElection();
  }, []);

  const fetchActiveElection = async () => {
    try {
      setLoading(true);
      const response = await electionsAPI.getActive();
      const activeElection = response.data.data;

      if (activeElection) {
        setElection(activeElection);
        const candResponse = await candidatesAPI.getByElection(activeElection.id);
        setCandidates(candResponse.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch election:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async () => {
    if (!selectedCandidate) {
      return setError('Please select a candidate');
    }

    if (!walletConnected) {
      return setError('Please connect your MetaMask wallet first');
    }

    if (user.hasVoted) {
      return setError('You have already voted');
    }

    setError('');
    setSuccess('');
    setVoting(true);

    try {
      // Initialize contract
      const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS;
      if (!contractAddress) {
        throw new Error('Contract address not configured');
      }

      web3Service.initContract(contractAddress);

      // Check authorization
      const isAuthorized = await web3Service.isAuthorized(walletAddress);
      if (!isAuthorized) {
        throw new Error('Your wallet is not authorized to vote. Please contact administrator.');
      }

      // Check if already voted on blockchain
      const hasVoted = await web3Service.hasVoted(walletAddress);
      if (hasVoted) {
        throw new Error('You have already cast your vote on the blockchain');
      }

      // Cast vote on blockchain
      const result = await web3Service.castVote(selectedCandidate.blockchainCandidateId || selectedCandidate.id);

      setTxHash(result.transactionHash);

      // Record transaction in backend
      await blockchainAPI.recordVote({
        electionId: election.id,
        transactionHash: result.transactionHash,
        candidateId: selectedCandidate.id,
      });

      setSuccess('Vote cast successfully! Your vote has been recorded on the blockchain.');
      await refreshUser();

      setTimeout(() => {
        navigate('/results');
      }, 3000);
    } catch (err) {
      console.error('Voting error:', err);
      setError(err.message || 'Failed to cast vote. Please try again.');
    } finally {
      setVoting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!election) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
          <Clock className="mx-auto h-16 w-16 text-gray-500 mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">No Active Election</h2>
          <p className="text-gray-400">There are currently no active elections. Please check back later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Election Info */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">{election.title}</h1>
        <p className="text-gray-400 mb-4">{election.description}</p>
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center space-x-2 text-green-400">
            <CheckCircle className="h-4 w-4" />
            <span>Active Election</span>
          </div>
          <div className="text-gray-400">
            Ends: {new Date(election.endTime).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Wallet Status */}
      {!walletConnected && (
        <div className="bg-amber-950/50 border border-amber-500/50 rounded-xl p-4 mb-6 flex items-start space-x-3">
          <Wallet className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-amber-300 font-medium mb-2">Connect Your Wallet to Vote</p>
            <button
              onClick={connectWallet}
              className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
            >
              Connect MetaMask
            </button>
          </div>
        </div>
      )}

      {/* Voting Status */}
      {user.hasVoted && (
        <div className="bg-green-950/50 border border-green-500/50 rounded-xl p-4 mb-6 flex items-start space-x-3">
          <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-green-300 font-medium">You have already voted in this election.</p>
            <p className="text-green-400/70 text-sm mt-1">
              Your vote has been securely recorded on the blockchain.
            </p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-950/50 border border-red-500/50 rounded-xl p-4 mb-6 flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-red-300">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="bg-green-950/50 border border-green-500/50 rounded-xl p-4 mb-6">
          <div className="flex items-start space-x-3 mb-3">
            <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
            <p className="text-green-300 font-medium">{success}</p>
          </div>
          {txHash && (
            <div className="ml-8 bg-slate-900/50 p-3 rounded-lg">
              <p className="text-xs text-gray-400 mb-1">Transaction Hash:</p>
              <div className="flex items-center space-x-2">
                <code className="text-xs text-green-400 font-mono break-all">{txHash}</code>
                <button
                  onClick={() => navigator.clipboard.writeText(txHash)}
                  className="text-gray-400 hover:text-white text-xs"
                >
                  Copy
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Candidates */}
      <h2 className="text-2xl font-bold text-white mb-4">Candidates</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {candidates.map((candidate) => (
          <div
            key={candidate.id}
            onClick={() => !user.hasVoted && setSelectedCandidate(candidate)}
            className={`
              bg-slate-900 border rounded-xl p-5 cursor-pointer transition-all
              ${selectedCandidate?.id === candidate.id
                ? 'border-indigo-500 ring-2 ring-indigo-500/50'
                : 'border-slate-800 hover:border-slate-700'
              }
              ${user.hasVoted ? 'opacity-60 cursor-not-allowed' : ''}
            `}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white">{candidate.name}</h3>
                <p className="text-sm text-indigo-400">{candidate.party}</p>
              </div>
              {selectedCandidate?.id === candidate.id && (
                <CheckCircle className="h-5 w-5 text-indigo-400 flex-shrink-0" />
              )}
            </div>
            <p className="text-sm text-gray-400 line-clamp-3">{candidate.description}</p>
          </div>
        ))}
      </div>

      {/* Vote Button */}
      {!user.hasVoted && (
        <button
          onClick={handleVote}
          disabled={!selectedCandidate || !walletConnected || voting}
          className="w-full py-4 px-6 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          {voting ? (
            <>
              <span className="inline-block animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></span>
              <span>Casting Vote...</span>
            </>
          ) : (
            <>
              <Vote className="h-5 w-5" />
              <span>Cast Your Vote</span>
            </>
          )}
        </button>
      )}
    </div>
  );
};

export default Dashboard;
