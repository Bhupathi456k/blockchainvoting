import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { electionsAPI, candidatesAPI, blockchainAPI, hostRequestsAPI } from '../services/api';
import web3Service from '../services/web3';
import { Vote, Wallet, CheckCircle, AlertCircle, Clock, Plus, Shield, Send, AlertTriangle, Play, Square, UserCheck } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

const Dashboard = () => {
  const { user, walletConnected, walletAddress, connectWallet, refreshUser } = useAuth();
  const [activeElection, setActiveElection] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [myHostedElections, setMyHostedElections] = useState([]);
  const [hostRequestData, setHostRequestData] = useState(null);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [txHash, setTxHash] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      // Fetch active election
      try {
        const activeRes = await electionsAPI.getActive();
        const active = activeRes.data.data;
        if (active) {
          setActiveElection(active);
          const candResponse = await candidatesAPI.getByElection(active.id);
          setCandidates(candResponse.data.data);
        }
      } catch (err) {
        console.warn('No active election');
      }

      // Fetch user's host request status & history
      try {
        const hostReqRes = await hostRequestsAPI.getMyRequests();
        setHostRequestData(hostReqRes.data.data);
      } catch (err) {
        console.warn('Could not load host requests');
      }

      // Fetch all elections to filter ones hosted by this user
      try {
        const allElectionsRes = await electionsAPI.getAll();
        const all = allElectionsRes.data.data;
        if (user && all) {
          const mine = all.filter((e) => e.hostUserId === user.id);
          setMyHostedElections(mine);
        }
      } catch (err) {
        console.warn('Could not load elections list');
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
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
        electionId: activeElection.id,
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

  const handleStartElection = async (electionId) => {
    try {
      await electionsAPI.start(electionId);
      setSuccess('Election started successfully!');
      loadDashboardData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to start election');
    }
  };

  const handleEndElection = async (electionId) => {
    try {
      await electionsAPI.end(electionId);
      setSuccess('Election ended successfully!');
      loadDashboardData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to end election');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  const hostStatus = user?.hostPermissionStatus || hostRequestData?.hostPermissionStatus || 'NONE';
  const latestRequest = hostRequestData?.latestRequest;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* User Welcome & Info Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Welcome, {user?.name}</h1>
          <p className="text-gray-400 text-sm">
            Unified Voting & Election Dashboard • Voter ID: <span className="text-indigo-400 font-mono">{user?.voterId}</span>
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {user?.role === 'ADMIN' ? (
            <span className="bg-purple-950 text-purple-300 border border-purple-800 px-3 py-1 rounded-full text-xs font-semibold">
              ADMINISTRATOR
            </span>
          ) : (
            <span className="bg-slate-800 text-gray-300 border border-slate-700 px-3 py-1 rounded-full text-xs font-semibold">
              VOTER
            </span>
          )}
          {hostStatus === 'APPROVED' && (
            <span className="bg-green-950 text-green-400 border border-green-800 px-3 py-1 rounded-full text-xs font-semibold flex items-center space-x-1">
              <CheckCircle className="h-3 w-3" />
              <span>APPROVED HOST</span>
            </span>
          )}
        </div>
      </div>

      {/* Global Alerts */}
      {error && (
        <div className="bg-red-950/50 border border-red-500/50 rounded-xl p-4 flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-red-300">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-950/50 border border-green-500/50 rounded-xl p-4">
          <div className="flex items-start space-x-3 mb-2">
            <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
            <p className="text-green-300 font-medium">{success}</p>
          </div>
          {txHash && (
            <div className="ml-8 bg-slate-900/50 p-3 rounded-lg">
              <p className="text-xs text-gray-400 mb-1">Transaction Hash:</p>
              <code className="text-xs text-green-400 font-mono break-all">{txHash}</code>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 1: VOTING DASHBOARD                                               */}
      {/* ========================================================================= */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
            <Vote className="h-6 w-6 text-indigo-400" />
            <span>Your Voting Dashboard</span>
          </h2>
          <Button
            onClick={() => navigate('/results')}
            className="bg-slate-800 hover:bg-slate-700 text-xs px-3 py-1.5"
          >
            View Election Results
          </Button>
        </div>

        {/* Wallet Connection Banner */}
        {!walletConnected && (
          <div className="bg-amber-950/50 border border-amber-500/50 rounded-xl p-4 flex items-start justify-between gap-4">
            <div className="flex items-start space-x-3">
              <Wallet className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-amber-300 font-medium">Connect Your Web3 Wallet to Vote</p>
                <p className="text-amber-400/80 text-sm mt-0.5">
                  MetaMask is required to cast tamper-proof cryptographic ballots on the Ethereum blockchain.
                </p>
              </div>
            </div>
            <button
              onClick={connectWallet}
              className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition flex-shrink-0"
            >
              Connect MetaMask
            </button>
          </div>
        )}

        {/* Voting Status if voted */}
        {user?.hasVoted && (
          <div className="bg-green-950/50 border border-green-500/50 rounded-xl p-4 flex items-start space-x-3">
            <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-green-300 font-medium">You have cast your ballot.</p>
              <p className="text-green-400/70 text-sm mt-1">
                Your vote is permanently and immutably recorded on the smart contract.
              </p>
            </div>
          </div>
        )}

        {/* Active Election Card */}
        {activeElection ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center space-x-3 mb-1">
                  <h3 className="text-2xl font-bold text-white">{activeElection.title}</h3>
                  <span className="bg-green-950 text-green-400 border border-green-800 text-xs px-2.5 py-0.5 rounded-full font-medium">
                    ACTIVE NOW
                  </span>
                </div>
                <p className="text-gray-400">{activeElection.description}</p>
              </div>
              <div className="text-sm text-gray-400 flex items-center space-x-1.5">
                <Clock className="h-4 w-4 text-indigo-400" />
                <span>Ends: {new Date(activeElection.endTime).toLocaleString()}</span>
              </div>
            </div>

            {/* Candidates */}
            <h4 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">
              Select a Candidate to Cast Vote
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {candidates.map((candidate) => (
                <div
                  key={candidate.id}
                  onClick={() => !user?.hasVoted && setSelectedCandidate(candidate)}
                  className={`
                    bg-slate-800/60 border rounded-xl p-5 cursor-pointer transition-all
                    ${selectedCandidate?.id === candidate.id
                      ? 'border-indigo-500 ring-2 ring-indigo-500/50 bg-indigo-950/20'
                      : 'border-slate-700 hover:border-slate-600'
                    }
                    ${user?.hasVoted ? 'opacity-60 cursor-not-allowed' : ''}
                  `}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="text-lg font-bold text-white">{candidate.name}</h4>
                      <p className="text-xs text-indigo-400 font-medium">{candidate.party}</p>
                    </div>
                    {selectedCandidate?.id === candidate.id && (
                      <CheckCircle className="h-5 w-5 text-indigo-400 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-gray-400 line-clamp-3">{candidate.description}</p>
                </div>
              ))}
            </div>

            {/* Cast Vote Action Button */}
            {!user?.hasVoted && (
              <button
                onClick={handleVote}
                disabled={!selectedCandidate || !walletConnected || voting}
                className="w-full py-3.5 px-6 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {voting ? (
                  <>
                    <span className="inline-block animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></span>
                    <span>Signing Transaction on Blockchain...</span>
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
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
            <Clock className="mx-auto h-12 w-12 text-gray-500 mb-3" />
            <h3 className="text-xl font-bold text-white mb-1">No Active Election Available</h3>
            <p className="text-gray-400 text-sm">
              There are currently no elections accepting votes. When an election starts, it will appear here.
            </p>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SECTION 2: ELECTION HOSTING (DYNAMIC STATES)                              */}
      {/* ========================================================================= */}
      <div className="space-y-6 pt-4 border-t border-slate-800">
        <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
          <Shield className="h-6 w-6 text-indigo-400" />
          <span>Election Hosting Authorization</span>
        </h2>

        {/* STATE 1: NONE (NORMAL USER) */}
        {hostStatus === 'NONE' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Want to Host and Manage Your Own Election?
                </h3>
                <p className="text-gray-400 text-sm max-w-2xl mb-2">
                  You are currently not authorized to host elections. Normal voter accounts require administrator
                  authorization before gaining access to election creation and candidate configuration.
                </p>
                <p className="text-xs text-gray-500">
                  Submit a hosting request with your proposed election details. Once approved by an admin, you can create and publish elections.
                </p>
              </div>
              <Button
                onClick={() => navigate('/host-request')}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-3 rounded-xl flex-shrink-0 flex items-center space-x-2 font-medium"
              >
                <Send className="h-4 w-4" />
                <span>Request Permission to Host</span>
              </Button>
            </div>
          </div>
        )}

        {/* STATE 2: PENDING USER */}
        {hostStatus === 'PENDING' && (
          <div className="bg-amber-950/30 border border-amber-500/40 rounded-2xl p-6 md:p-8">
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex-shrink-0">
                <Clock className="h-8 w-8 text-amber-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-xl font-bold text-white">Election Hosting Request Under Review</h3>
                  <span className="bg-amber-900/60 text-amber-300 border border-amber-700 text-xs px-3 py-1 rounded-full font-semibold animate-pulse">
                    ⏳ PENDING ADMIN REVIEW
                  </span>
                </div>
                <p className="text-amber-200/80 text-sm mb-4">
                  Your request to become an election host has been submitted and is currently being evaluated by a platform administrator.
                  You will be able to create and host elections immediately after approval.
                </p>

                {latestRequest && (
                  <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 mt-3 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div>
                      <span className="text-gray-500 block">Proposed Election</span>
                      <span className="text-white font-medium">{latestRequest.electionTitle}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Expected Voters</span>
                      <span className="text-white font-medium">{latestRequest.expectedVoters} voters</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Submitted At</span>
                      <span className="text-white font-medium">
                        {new Date(latestRequest.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STATE 3: APPROVED USER */}
        {hostStatus === 'APPROVED' && (
          <div className="space-y-6">
            <div className="bg-green-950/30 border border-green-500/40 rounded-2xl p-6 md:p-8">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-xl flex-shrink-0">
                    <UserCheck className="h-8 w-8 text-green-400" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-3 mb-1">
                      <h3 className="text-xl font-bold text-white">Hosting Permission Approved</h3>
                      <span className="bg-green-900/60 text-green-300 border border-green-700 text-xs px-3 py-0.5 rounded-full font-semibold">
                        ✓ APPROVED
                      </span>
                    </div>
                    <p className="text-green-200/80 text-sm">
                      You are authorized to create, configure candidates, and host elections on BlockVote.
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => navigate('/elections/create')}
                  className="bg-green-600 hover:bg-green-500 text-white px-5 py-3 rounded-xl flex-shrink-0 flex items-center space-x-2 font-bold shadow-lg"
                >
                  <Plus className="h-5 w-5" />
                  <span>+ Create & Host Election</span>
                </Button>
              </div>
            </div>

            {/* My Hosted Elections List */}
            {myHostedElections.length > 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <h3 className="text-xl font-bold text-white mb-4">Elections Hosted by You</h3>
                <div className="space-y-4">
                  {myHostedElections.map((el) => (
                    <div
                      key={el.id}
                      className="bg-slate-800/60 border border-slate-700 rounded-xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                    >
                      <div>
                        <div className="flex items-center space-x-3 mb-1">
                          <h4 className="text-lg font-bold text-white">{el.title}</h4>
                          <span
                            className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                              el.status === 'ACTIVE'
                                ? 'bg-green-950 text-green-400 border border-green-800'
                                : el.status === 'ENDED'
                                ? 'bg-gray-800 text-gray-400 border border-gray-700'
                                : 'bg-yellow-950 text-yellow-400 border border-yellow-800'
                            }`}
                          >
                            {el.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mb-2">{el.description}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(el.startTime).toLocaleDateString()} - {new Date(el.endTime).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="flex items-center space-x-2">
                        {el.status === 'DRAFT' && (
                          <button
                            onClick={() => handleStartElection(el.id)}
                            className="bg-green-600 hover:bg-green-500 text-white text-xs px-3 py-1.5 rounded-lg flex items-center space-x-1"
                          >
                            <Play className="h-3 w-3" />
                            <span>Start Election</span>
                          </button>
                        )}
                        {el.status === 'ACTIVE' && (
                          <button
                            onClick={() => handleEndElection(el.id)}
                            className="bg-red-600 hover:bg-red-500 text-white text-xs px-3 py-1.5 rounded-lg flex items-center space-x-1"
                          >
                            <Square className="h-3 w-3" />
                            <span>End Election</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* STATE 4: REJECTED USER */}
        {hostStatus === 'REJECTED' && (
          <div className="bg-red-950/30 border border-red-500/40 rounded-2xl p-6 md:p-8">
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex-shrink-0">
                <AlertTriangle className="h-8 w-8 text-red-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-xl font-bold text-white">Hosting Request Not Approved</h3>
                  <span className="bg-red-900/60 text-red-300 border border-red-700 text-xs px-3 py-0.5 rounded-full font-semibold">
                    ✕ REJECTED
                  </span>
                </div>
                <p className="text-red-200/80 text-sm mb-3">
                  Your previous request to host an election was reviewed and not approved by the administrator.
                </p>

                {latestRequest?.adminReason && (
                  <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 mb-4">
                    <p className="text-xs text-gray-400 mb-1 font-semibold">Administrator Reason:</p>
                    <p className="text-sm text-red-300 italic">"{latestRequest.adminReason}"</p>
                  </div>
                )}

                <Button
                  onClick={() => navigate('/host-request')}
                  className="bg-red-600 hover:bg-red-500 text-white text-sm px-4 py-2 rounded-xl flex items-center space-x-2"
                >
                  <Send className="h-4 w-4" />
                  <span>Submit New Hosting Request</span>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
