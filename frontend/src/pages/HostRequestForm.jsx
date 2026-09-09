import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { hostRequestsAPI } from '../services/api';
import { Container } from '../components/ui/Container';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { ArrowLeft, Send, AlertCircle, CheckCircle } from 'lucide-react';

const HostRequestForm = () => {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    electionTitle: '',
    electionDescription: '',
    purpose: '',
    expectedVoters: '',
    proposedStartDate: '',
    proposedEndDate: '',
    electionType: 'General Election',
    additionalInformation: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate dates
      const start = new Date(formData.proposedStartDate);
      const end = new Date(formData.proposedEndDate);

      if (start >= end) {
        throw new Error('Start date must be before end date');
      }

      if (start < new Date()) {
        throw new Error('Start date must be in the future');
      }

      // Submit request
      await hostRequestsAPI.submit(formData);
      await refreshUser();
      setSuccess(true);

      // Redirect after 2 seconds
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Container className="max-w-2xl mx-auto px-4 py-12">
        <Card className="p-8 text-center">
          <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Request Submitted Successfully!</h2>
          <p className="text-gray-400 mb-4">
            Your election hosting request has been submitted and is now pending administrator review.
          </p>
          <p className="text-sm text-gray-500">Redirecting to dashboard...</p>
        </Card>
      </Container>
    );
  }

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
            Request Permission to Host an Election
          </h1>
          <p className="text-gray-400">
            Please provide details about the election you wish to host. An administrator will review your request.
          </p>
        </div>

        {error && (
          <div className="bg-red-950/50 border border-red-500/50 rounded-xl p-4 mb-6 flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-300">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Election Title */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Election Title <span className="text-red-400">*</span>
            </label>
            <Input
              type="text"
              name="electionTitle"
              value={formData.electionTitle}
              onChange={handleChange}
              placeholder="e.g., Student Council Election 2026"
              required
              maxLength={255}
            />
          </div>

          {/* Election Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Election Description
            </label>
            <textarea
              name="electionDescription"
              value={formData.electionDescription}
              onChange={handleChange}
              placeholder="Brief description of the election"
              rows="3"
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Purpose */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Election Purpose <span className="text-red-400">*</span>
            </label>
            <textarea
              name="purpose"
              value={formData.purpose}
              onChange={handleChange}
              placeholder="Explain the purpose and goals of this election"
              rows="4"
              required
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Expected Voters and Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Expected Number of Voters <span className="text-red-400">*</span>
              </label>
              <Input
                type="number"
                name="expectedVoters"
                value={formData.expectedVoters}
                onChange={handleChange}
                placeholder="e.g., 500"
                required
                min="1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Election Type
              </label>
              <select
                name="electionType"
                value={formData.electionType}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option>General Election</option>
                <option>Student Council</option>
                <option>Board Election</option>
                <option>Committee Election</option>
                <option>Referendum</option>
                <option>Poll</option>
                <option>Other</option>
              </select>
            </div>
          </div>

          {/* Proposed Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Proposed Start Date <span className="text-red-400">*</span>
              </label>
              <Input
                type="datetime-local"
                name="proposedStartDate"
                value={formData.proposedStartDate}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Proposed End Date <span className="text-red-400">*</span>
              </label>
              <Input
                type="datetime-local"
                name="proposedEndDate"
                value={formData.proposedEndDate}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Additional Information */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Additional Information
            </label>
            <textarea
              name="additionalInformation"
              value={formData.additionalInformation}
              onChange={handleChange}
              placeholder="Any other relevant information for the administrator"
              rows="4"
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Submit Button */}
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
              className="bg-indigo-600 hover:bg-indigo-500 flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <span className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></span>
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Submit Request</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>
    </Container>
  );
};

export default HostRequestForm;
