import React, { useState, useEffect } from 'react';
import { electionsAPI, candidatesAPI, votersAPI } from '../services/api';
import { Plus, Play, Square, Users, CheckCircle, AlertCircle, Edit, Trash2 } from 'lucide-react';

const AdminDashboard = () => {
  const [elections, setElections] = useState([]);
  const [voterStats, setVoterStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateElection, setShowCreateElection] = useState(false);
  const [showAddCandidate, setShowAddCandidate] = useState(false);
  const [selectedElectionId, setSelectedElectionId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [electionForm, setElectionForm] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
  });

  const [candidateForm, setCandidateForm] = useState({
    name: '',
    party: '',
    description: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [electionsRes, statsRes] = await Promise.all([
        electionsAPI.getAll(),
        votersAPI.getStats(),
      ]);
      setElections(electionsRes.data.data);
      setVoterStats(statsRes.data.data);
    } catch (err) {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateElection = async (e) => {
    e.preventDefault();
    try {
      await electionsAPI.create(electionForm);
      setSuccess('Election created successfully');
      setShowCreateElection(false);
      setElectionForm({ title: '', description: '', startTime: '', endTime: '' });
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create election');
    }
  };

  const handleAddCandidate = async (e) => {
    e.preventDefault();
    try {
      await candidatesAPI.create(selectedElectionId, candidateForm);
      setSuccess('Candidate added successfully');
      setShowAddCandidate(false);
      setCandidateForm({ name: '', party: '', description: '' });
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add candidate');
    }
  };

  const handleStartElection = async (id) => {
    try {
      await electionsAPI.start(id);
      setSuccess('Election started successfully');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to start election');
    }
  };

  const handleEndElection = async (id) => {
    try {
      await electionsAPI.end(id);
      setSuccess('Election ended successfully');
      fetchData();
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

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
          <p className="text-gray-400">Manage elections, candidates, and monitor voting</p>
        </div>
        <button
          onClick={() => setShowCreateElection(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl font-medium flex items-center space-x-2 transition"
        >
          <Plus className="h-5 w-5" />
          <span>New Election</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-950/50 border border-red-500/50 rounded-xl p-4 mb-6 flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-red-300">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-950/50 border border-green-500/50 rounded-xl p-4 mb-6 flex items-start space-x-3">
          <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
          <p className="text-green-300">{success}</p>
        </div>
      )}

      {/* Voter Statistics */}
      {voterStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <span className="text-gray-400 text-sm">Total Voters</span>
            <div className="text-3xl font-bold text-white mt-1">{voterStats.totalVoters}</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <span className="text-gray-400 text-sm">Eligible Voters</span>
            <div className="text-3xl font-bold text-indigo-400 mt-1">{voterStats.eligibleVoters}</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <span className="text-gray-400 text-sm">Votes Cast</span>
            <div className="text-3xl font-bold text-green-400 mt-1">{voterStats.votedCount}</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <span className="text-gray-400 text-sm">Turnout Rate</span>
            <div className="text-3xl font-bold text-yellow-400 mt-1">{voterStats.turnoutPercentage}%</div>
          </div>
        </div>
      )}

      {/* Elections List */}
      <h2 className="text-2xl font-bold text-white mb-4">Elections</h2>
      <div className="space-y-4">
        {elections.map((election) => (
          <div key={election.id} className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center space-x-3">
                  <h3 className="text-xl font-bold text-white">{election.title}</h3>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    election.status === 'ACTIVE' ? 'bg-green-950 text-green-400 border border-green-800' :
                    election.status === 'ENDED' ? 'bg-gray-800 text-gray-400 border border-gray-700' :
                    'bg-yellow-950 text-yellow-400 border border-yellow-800'
                  }`}>
                    {election.status}
                  </span>
                </div>
                <p className="text-gray-400 text-sm mt-1">{election.description}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                {election.status === 'DRAFT' && (
                  <>
                    <button
                      onClick={() => {
                        setSelectedElectionId(election.id);
                        setShowAddCandidate(true);
                      }}
                      className="bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg text-sm transition"
                    >
                      Add Candidate
                    </button>
                    <button
                      onClick={() => handleStartElection(election.id)}
                      className="bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded-lg text-sm flex items-center space-x-1 transition"
                    >
                      <Play className="h-4 w-4" />
                      <span>Start</span>
                    </button>
                  </>
                )}

                {election.status === 'ACTIVE' && (
                  <button
                    onClick={() => handleEndElection(election.id)}
                    className="bg-red-600 hover:bg-red-500 text-white px-3 py-1.5 rounded-lg text-sm flex items-center space-x-1 transition"
                  >
                    <Square className="h-4 w-4" />
                    <span>End</span>
                  </button>
                )}
              </div>
            </div>

            {/* Candidates */}
            <div className="border-t border-slate-800 pt-4 mt-4">
              <h4 className="text-sm font-semibold text-gray-400 mb-2">
                Candidates ({election.candidates?.length || 0})
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {election.candidates?.map((candidate) => (
                  <div key={candidate.id} className="bg-slate-800/50 p-3 rounded-lg">
                    <p className="text-white font-medium">{candidate.name}</p>
                    <p className="text-xs text-indigo-400">{candidate.party}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Election Modal */}
      {showCreateElection && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-4">Create Election</h3>
            <form onSubmit={handleCreateElection} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={electionForm.title}
                  onChange={(e) => setElectionForm({ ...electionForm, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Description</label>
                <textarea
                  value={electionForm.description}
                  onChange={(e) => setElectionForm({ ...electionForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
                  rows="3"
                ></textarea>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Start Time</label>
                <input
                  type="datetime-local"
                  required
                  value={electionForm.startTime}
                  onChange={(e) => setElectionForm({ ...electionForm, startTime: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">End Time</label>
                <input
                  type="datetime-local"
                  required
                  value={electionForm.endTime}
                  onChange={(e) => setElectionForm({ ...electionForm, endTime: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateElection(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Candidate Modal */}
      {showAddCandidate && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-4">Add Candidate</h3>
            <form onSubmit={handleAddCandidate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Candidate Name</label>
                <input
                  type="text"
                  required
                  value={candidateForm.name}
                  onChange={(e) => setCandidateForm({ ...candidateForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Party / Affiliation</label>
                <input
                  type="text"
                  value={candidateForm.party}
                  onChange={(e) => setCandidateForm({ ...candidateForm, party: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Description</label>
                <textarea
                  value={candidateForm.description}
                  onChange={(e) => setCandidateForm({ ...candidateForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
                  rows="3"
                ></textarea>
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCandidate(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm"
                >
                  Add Candidate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
