import React, { useState, useEffect } from 'react';
import { electionsAPI } from '../services/api';
import { Trophy, Users, TrendingUp, AlertCircle } from 'lucide-react';

const Results = () => {
  const [elections, setElections] = useState([]);
  const [selectedElection, setSelectedElection] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchElections();
  }, []);

  const fetchElections = async () => {
    try {
      const response = await electionsAPI.getAll();
      const rawData = response.data?.data;
      const allElections = Array.isArray(rawData) ? rawData : (rawData?.elections || []);
      const activeOrEnded = allElections.filter(e => e.status === 'ACTIVE' || e.status === 'ENDED');
      setElections(activeOrEnded);

      if (activeOrEnded.length > 0) {
        selectElection(activeOrEnded[0].id);
      } else {
        setLoading(false);
      }
    } catch (err) {
      setError('Failed to load elections');
      setLoading(false);
    }
  };

  const selectElection = async (electionId) => {
    try {
      setLoading(true);
      setError('');
      const response = await electionsAPI.getResults(electionId);
      const electionData = elections.find(e => e.id === parseInt(electionId));
      setSelectedElection(electionData);
      setResults(response.data.data);
    } catch (err) {
      setError('Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (elections.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
          <AlertCircle className="mx-auto h-16 w-16 text-gray-500 mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">No Results Available</h2>
          <p className="text-gray-400">There are no completed or active elections.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Election Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">Select Election</label>
        <select
          value={selectedElection?.id || ''}
          onChange={(e) => selectElection(e.target.value)}
          className="w-full md:w-96 px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {elections.map((election) => (
            <option key={election.id} value={election.id}>
              {election.title} ({election.status})
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="bg-red-950/50 border border-red-500/50 rounded-xl p-4 mb-6 flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-red-300">{error}</p>
        </div>
      )}

      {results && (
        <>
          {/* Election Info */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-6">
            <h1 className="text-3xl font-bold text-white mb-2">{results.election.title}</h1>
            <p className="text-gray-400 mb-4">{results.election.description}</p>
            <div className="flex items-center space-x-4 text-sm">
              <div className={`flex items-center space-x-2 ${results.election.status === 'ENDED' ? 'text-gray-400' : 'text-green-400'}`}>
                <div className={`h-2 w-2 rounded-full ${results.election.status === 'ENDED' ? 'bg-gray-400' : 'bg-green-400'}`}></div>
                <span>{results.election.status}</span>
              </div>
              <span className="text-gray-400">•</span>
              <span className="text-gray-400">
                {results.election.status === 'ENDED' ? 'Ended' : 'Ends'}: {new Date(results.election.endTime).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Total Votes</span>
                <Users className="h-5 w-5 text-indigo-400" />
              </div>
              <div className="text-3xl font-bold text-white">{results.totalVotes}</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Candidates</span>
                <TrendingUp className="h-5 w-5 text-green-400" />
              </div>
              <div className="text-3xl font-bold text-white">{results.candidates.length}</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Data Source</span>
                <Trophy className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="text-lg font-semibold text-white capitalize">{results.dataSource.replace('_', ' ')}</div>
            </div>
          </div>

          {/* Winner */}
          {results.winner && (
            <div className="bg-gradient-to-r from-yellow-900/30 to-amber-900/30 border border-yellow-500/50 rounded-2xl p-6 mb-6">
              <div className="flex items-center space-x-3 mb-3">
                <Trophy className="h-8 w-8 text-yellow-400" />
                <h2 className="text-2xl font-bold text-white">Winner</h2>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-yellow-300">{results.winner.name}</h3>
                  <p className="text-yellow-400/80">{results.winner.party}</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-yellow-300">{results.winner.voteCount}</div>
                  <div className="text-sm text-yellow-400/80">{results.winner.percentage}% of votes</div>
                </div>
              </div>
            </div>
          )}

          {/* Tie */}
          {results.isTie && (
            <div className="bg-blue-950/30 border border-blue-500/50 rounded-xl p-4 mb-6">
              <p className="text-blue-300 font-medium">
                There is a tie between {results.tiedCandidates.length} candidates
              </p>
            </div>
          )}

          {/* Candidates Results */}
          <h2 className="text-2xl font-bold text-white mb-4">Vote Distribution</h2>
          <div className="space-y-3">
            {results.candidates
              .sort((a, b) => b.voteCount - a.voteCount)
              .map((candidate, index) => (
                <div
                  key={candidate.id}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-5"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl font-bold text-gray-500">#{index + 1}</div>
                      <div>
                        <h3 className="text-lg font-bold text-white">{candidate.name}</h3>
                        <p className="text-sm text-gray-400">{candidate.party}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-white">{candidate.voteCount}</div>
                      <div className="text-sm text-gray-400">{candidate.percentage}%</div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-800 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        index === 0 ? 'bg-yellow-400' : index === 1 ? 'bg-indigo-400' : 'bg-gray-600'
                      }`}
                      style={{ width: `${candidate.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
          </div>

          {results.totalVotes === 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center mt-6">
              <p className="text-gray-400">No votes have been cast yet.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Results;
