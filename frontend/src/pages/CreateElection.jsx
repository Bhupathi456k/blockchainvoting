import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { electionsAPI, candidatesAPI } from '../services/api';
import { Container } from '../components/ui/Container';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { ArrowLeft, Plus, Trash2, AlertCircle, CheckCircle } from 'lucide-react';

const CreateElection = () => {
  const navigate = useNavigate();
  const { canHostElections } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdElectionId, setCreatedElectionId] = useState(null);

  const [electionData, setElectionData] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
  });

  const [candidates, setCandidates] = useState([
    { name: '', party: '', description: '' },
    { name: '', party: '', description: '' },
  ]);

  // Redirect if not authorized
  if (!canHostElections) {
    return (
      <Container className="max-w-2xl mx-auto px-4 py-12">
        <Card className="p-8 text-center">
          <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-gray-400 mb-6">
            You do not have permission to create elections. Please request hosting permission from an administrator.
          </p>
          <Button onClick={() => navigate('/dashboard')}>Return to Dashboard</Button>
        </Card>
      </Container>
    );
  }

  const handleElectionChange = (e) => {
    const { name, value } = e.target;
    setElectionData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCandidateChange = (index, field, value) => {
    const updated = [...candidates];
    updated[index][field] = value;
    setCandidates(updated);
  };

  const addCandidate = () => {
    setCandidates([...candidates, { name: '', party: '', description: '' }]);
  };

  const removeCandidate = (index) => {
    if (candidates.length > 2) {
      setCandidates(candidates.filter((_, i) => i !== index));
    }
  };

  const handleCreateElection = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate dates
      const start = new Date(electionData.startTime);
      const end = new Date(electionData.endTime);

      if (start >= end) {
        throw new Error('Start time must be before end time');
      }

      // Create election
      const electionResponse = await electionsAPI.create(electionData);
      const electionId = electionResponse.data.data.id;
      setCreatedElectionId(electionId);
      setCurrentStep(2);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to create election');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCandidates = async () => {
    setError('');
    setLoading(true);

    try {
      // Validate at least 2 candidates with names
      const validCandidates = candidates.filter((c) => c.name.trim() !== '');
      if (validCandidates.length < 2) {
        throw new Error('At least 2 candidates are required');
      }

      // Add all candidates
      await Promise.all(
        validCandidates.map((candidate) =>
          candidatesAPI.create(createdElectionId, candidate)
        )
      );

      setCurrentStep(3);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to add candidates');
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = () => {
    navigate('/dashboard');
  };

  // Step 1: Election Details
  if (currentStep === 1) {
    return (
      <Container className="max-w-3xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center space-x-2 text-gray-400 hover:text-white transition mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Dashboard</span>
        </button>

        <Card className="p-6 md:p-8">
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
              Create & Host Election
            </h1>
            <p className="text-gray-400">Step 1 of 2: Election Details</p>
          </div>

          {error && (
            <div className="bg-red-950/50 border border-red-500/50 rounded-xl p-4 mb-6 flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-300">{error}</p>
            </div>
          )}

          <form onSubmit={handleCreateElection} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Election Title <span className="text-red-400">*</span>
              </label>
              <Input
                type="text"
                name="title"
                value={electionData.title}
                onChange={handleElectionChange}
                placeholder="e.g., Student Council Election 2026"
                required
                maxLength={255}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={electionData.description}
                onChange={handleElectionChange}
                placeholder="Brief description of the election"
                rows="4"
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Start Date & Time <span className="text-red-400">*</span>
                </label>
                <Input
                  type="datetime-local"
                  name="startTime"
                  value={electionData.startTime}
                  onChange={handleElectionChange}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  End Date & Time <span className="text-red-400">*</span>
                </label>
                <Input
                  type="datetime-local"
                  name="endTime"
                  value={electionData.endTime}
                  onChange={handleElectionChange}
                  required
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="bg-slate-800 hover:bg-slate-700"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-500"
              >
                {loading ? 'Creating...' : 'Continue to Candidates'}
              </Button>
            </div>
          </form>
        </Card>
      </Container>
    );
  }

  // Step 2: Add Candidates
  if (currentStep === 2) {
    return (
      <Container className="max-w-3xl mx-auto px-4 py-8">
        <Card className="p-6 md:p-8">
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
              Add Candidates
            </h1>
            <p className="text-gray-400">Step 2 of 2: Configure candidates for your election</p>
          </div>

          {error && (
            <div className="bg-red-950/50 border border-red-500/50 rounded-xl p-4 mb-6 flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-300">{error}</p>
            </div>
          )}

          <div className="space-y-4 mb-6">
            {candidates.map((candidate, index) => (
              <Card key={index} className="p-4 bg-slate-800/50">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-semibold text-white">
                    Candidate {index + 1}
                  </h3>
                  {candidates.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeCandidate(index)}
                      className="text-red-400 hover:text-red-300 transition"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  <Input
                    type="text"
                    placeholder="Candidate Name *"
                    value={candidate.name}
                    onChange={(e) => handleCandidateChange(index, 'name', e.target.value)}
                    required
                  />
                  <Input
                    type="text"
                    placeholder="Party / Affiliation"
                    value={candidate.party}
                    onChange={(e) => handleCandidateChange(index, 'party', e.target.value)}
                  />
                  <textarea
                    placeholder="Description"
                    value={candidate.description}
                    onChange={(e) => handleCandidateChange(index, 'description', e.target.value)}
                    rows="2"
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </Card>
            ))}
          </div>

          <Button
            type="button"
            onClick={addCandidate}
            className="w-full mb-6 bg-slate-800 hover:bg-slate-700 flex items-center justify-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>Add Another Candidate</span>
          </Button>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
            <Button
              type="button"
              onClick={handleAddCandidates}
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-500"
            >
              {loading ? 'Adding Candidates...' : 'Create Election'}
            </Button>
          </div>
        </Card>
      </Container>
    );
  }

  // Step 3: Success
  return (
    <Container className="max-w-2xl mx-auto px-4 py-12">
      <Card className="p-8 text-center">
        <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Election Created Successfully!</h2>
        <p className="text-gray-400 mb-6">
          Your election has been created in DRAFT status. You can start it when ready from your dashboard.
        </p>
        <Button onClick={handleFinish} className="bg-indigo-600 hover:bg-indigo-500">
          Go to Dashboard
        </Button>
      </Card>
    </Container>
  );
};

export default CreateElection;
