import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import web3Service from '../services/web3';
import { authAPI } from '../services/api';
import {
  UserPlus,
  AlertCircle,
  CheckCircle2,
  Wallet,
  Shield,
  User,
  Mail,
  Phone,
  CreditCard,
  Lock,
  RefreshCw,
  Sparkles,
  Fingerprint,
  Camera,
  ArrowRight,
  ArrowLeft,
  Check
} from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import Container from '../components/ui/Container';
import FaceCapture from '../components/FaceCapture';
import FingerprintCapture from '../components/FingerprintCapture';

const Register = () => {
  // Registration steps: 1 = Details & Unique ID, 2 = Biometric Authorization (Face OR Fingerprint)
  const [step, setStep] = useState(1);

  // Selected biometric method: 'FINGERPRINT' | 'FACE'
  const [biometricMethod, setBiometricMethod] = useState('FINGERPRINT');

  const [formData, setFormData] = useState({
    name: '',
    voterId: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    walletAddress: '',
  });

  const [autoVoterIdLoading, setAutoVoterIdLoading] = useState(false);
  const [faceData, setFaceData] = useState(null);
  const [fingerprintData, setFingerprintData] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [loading, setLoading] = useState(false);
  const [connectingWallet, setConnectingWallet] = useState(false);
  const [walletStatus, setWalletStatus] = useState({
    connected: false,
    address: '',
    chainId: null,
  });

  const { register } = useAuth();
  const navigate = useNavigate();

  // Fetch unique auto-generated Voter ID on load
  const fetchAutoVoterId = async () => {
    setAutoVoterIdLoading(true);
    try {
      const res = await authAPI.generateVoterId();
      if (res.data?.data?.voterId) {
        setFormData((prev) => ({ ...prev, voterId: res.data.data.voterId }));
      }
    } catch (err) {
      console.error('Failed to generate voter ID:', err);
      // Fallback local generator if server fetch fails
      const fallbackId = `VTR-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
      setFormData((prev) => ({ ...prev, voterId: fallbackId }));
    } finally {
      setAutoVoterIdLoading(false);
    }
  };

  useEffect(() => {
    fetchAutoVoterId();

    // Check if wallet is already connected via Web3Service
    const existingAccount = web3Service.getAccount();
    if (existingAccount) {
      setWalletStatus({
        connected: true,
        address: existingAccount,
        chainId: null,
      });
      setFormData((prev) => ({ ...prev, walletAddress: existingAccount }));
    }

    // Listen for accounts change
    web3Service.onAccountsChanged((accounts) => {
      if (accounts.length > 0) {
        setWalletStatus({
          connected: true,
          address: accounts[0],
          chainId: null,
        });
        setFormData((prev) => ({ ...prev, walletAddress: accounts[0] }));
      } else {
        setWalletStatus({
          connected: false,
          address: '',
          chainId: null,
        });
      }
    });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (generalError) {
      setGeneralError('');
    }
  };

  const validateStep1 = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = 'Full name is required';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }

    if (!formData.voterId.trim()) {
      errors.voterId = 'Voter ID is required';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = 'Please enter a valid email address';
    }

    if (formData.phone && !/^\+?[0-9\s-]{7,15}$/.test(formData.phone.trim())) {
      errors.phone = 'Please enter a valid phone number';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters long';
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Confirm password is required';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (formData.walletAddress && !/^0x[a-fA-F0-9]{40}$/.test(formData.walletAddress.trim())) {
      errors.walletAddress = 'Please enter a valid Ethereum address (0x...)';
    }

    return errors;
  };

  const handleNextToBiometrics = (e) => {
    e.preventDefault();
    setGeneralError('');
    const validationErrors = validateStep1();
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      return;
    }
    setStep(2);
  };

  const handleConnectWallet = async () => {
    setConnectingWallet(true);
    setGeneralError('');

    try {
      if (!web3Service.isMetaMaskInstalled()) {
        throw new Error('MetaMask is not installed in your browser. Please install MetaMask to connect.');
      }

      const result = await web3Service.connectWallet();
      setWalletStatus({
        connected: true,
        address: result.account,
        chainId: result.chainId,
      });
      setFormData((prev) => ({ ...prev, walletAddress: result.account }));
      if (fieldErrors.walletAddress) {
        setFieldErrors((prev) => ({ ...prev, walletAddress: '' }));
      }
    } catch (err) {
      console.error('MetaMask connection error:', err);
      setGeneralError(err.message || 'Failed to connect MetaMask wallet.');
    } finally {
      setConnectingWallet(false);
    }
  };

  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  // Either face capture OR fingerprint qualifies as verified biometric
  const isBiometricVerified = !!(faceData || fingerprintData);

  const handleFinalRegistration = async () => {
    if (!isBiometricVerified) {
      setGeneralError('Please authenticate with either your Fingerprint Sensor or Face Capture to complete registration.');
      return;
    }

    setGeneralError('');
    setLoading(true);

    try {
      const { confirmPassword, ...registerData } = formData;
      registerData.name = (registerData.name || '').trim();
      registerData.voterId = (registerData.voterId || '').trim();
      registerData.email = (registerData.email || '').trim();

      if (registerData.phone && registerData.phone.trim()) {
        registerData.phone = registerData.phone.trim();
      } else {
        delete registerData.phone;
      }

      if (registerData.walletAddress && registerData.walletAddress.trim()) {
        registerData.walletAddress = registerData.walletAddress.trim();
      } else {
        delete registerData.walletAddress;
      }

      if (faceData) registerData.faceData = faceData;
      if (fingerprintData) registerData.fingerprintData = fingerprintData;

      await register(registerData);
      navigate('/dashboard');
    } catch (err) {
      console.error('Registration error:', err);
      const errorMsg =
        err.response?.data?.errors?.[0]?.message ||
        err.response?.data?.error ||
        'Registration failed. Please check your information and try again.';
      setGeneralError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-8 sm:py-12">
      <Container size="sm" className="max-w-[620px]">
        {/* Registration Card */}
        <Card className="bg-slate-900/95 border-slate-800 shadow-2xl p-6 sm:p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="mx-auto h-12 w-12 bg-indigo-950/60 text-indigo-400 flex items-center justify-center rounded-xl mb-3 border border-indigo-800/50 shadow-inner">
              <UserPlus className="h-6 w-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Voter Account Registration
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Automatic Unique ID & Biometric Authorization
            </p>

            {/* Registration Progress Indicator (2 Steps) */}
            <div className="flex items-center justify-center gap-3 mt-6">
              <div
                onClick={() => setStep(1)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-all ${
                  step === 1
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'bg-slate-800 text-emerald-400 hover:bg-slate-700'
                }`}
              >
                {step > 1 ? <CheckCircle2 className="w-3.5 h-3.5" /> : '1'}
                <span>Account Info</span>
              </div>
              <div className="w-8 h-0.5 bg-slate-800" />
              <div
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  step === 2
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : isBiometricVerified
                    ? 'bg-slate-800 text-emerald-400'
                    : 'bg-slate-800/60 text-slate-500'
                }`}
              >
                {isBiometricVerified ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : '2'}
                <span>Biometric Auth</span>
              </div>
            </div>
          </div>

          {/* General Error Banner */}
          {generalError && (
            <div className="mb-6 bg-red-950/40 border border-red-800/60 rounded-xl p-4 flex items-start space-x-3 text-red-300 text-sm">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5 text-red-400" />
              <span>{generalError}</span>
            </div>
          )}

          {/* STEP 1: Account Info & Auto-Generated Unique Voter ID */}
          {step === 1 && (
            <form onSubmit={handleNextToBiometrics} noValidate className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-indigo-400" />
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Personal Information
                    </h2>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-indigo-950/80 text-indigo-300 border border-indigo-800/50">
                    <Sparkles className="w-3 h-3 text-indigo-400" /> Auto Unique ID Enabled
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Full Name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. John Doe"
                    error={fieldErrors.name}
                    leftIcon={User}
                  />

                  {/* Auto-Generated Unique Voter ID */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-medium text-slate-300">
                        Automatic Unique Voter ID <span className="text-red-400">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={fetchAutoVoterId}
                        disabled={autoVoterIdLoading}
                        className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium transition-colors"
                      >
                        <RefreshCw className={`w-3 h-3 ${autoVoterIdLoading ? 'animate-spin' : ''}`} />
                        <span>Regenerate ID</span>
                      </button>
                    </div>

                    <div className="relative">
                      <Input
                        name="voterId"
                        required
                        value={formData.voterId}
                        onChange={handleChange}
                        placeholder="Generating Unique ID..."
                        error={fieldErrors.voterId}
                        leftIcon={CreditCard}
                        className="font-mono text-xs tracking-wider bg-slate-950/80 border-indigo-900/50 text-indigo-200"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Email Address"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="voter@example.com"
                    error={fieldErrors.email}
                    leftIcon={Mail}
                  />

                  <Input
                    label="Phone Number"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+1 (555) 000-0000"
                    error={fieldErrors.phone}
                    leftIcon={Phone}
                  />
                </div>
              </div>

              {/* Blockchain Identity */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center space-x-2 pb-2 border-b border-slate-800">
                  <Shield className="h-4 w-4 text-indigo-400" />
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Blockchain Identity
                  </h2>
                </div>

                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-slate-300 block">
                        Ethereum Wallet
                      </span>
                      <span className="text-xs text-slate-500">
                        Connect MetaMask wallet for voting verification
                      </span>
                    </div>

                    {walletStatus.connected ? (
                      <div className="flex items-center space-x-1.5 px-3 py-1 bg-emerald-950/50 border border-emerald-800/60 rounded-lg text-emerald-400 text-xs font-medium">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Connected</span>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        loading={connectingWallet}
                        onClick={handleConnectWallet}
                        leftIcon={Wallet}
                      >
                        Connect Wallet
                      </Button>
                    )}
                  </div>

                  {walletStatus.connected ? (
                    <div className="flex items-center justify-between bg-slate-900/80 px-3 py-2 rounded-lg border border-slate-800 text-xs">
                      <span className="text-slate-400 font-medium">Wallet Address:</span>
                      <span className="font-mono text-slate-200">{formatAddress(walletStatus.address)}</span>
                    </div>
                  ) : (
                    <Input
                      name="walletAddress"
                      value={formData.walletAddress}
                      onChange={handleChange}
                      placeholder="0x... (Optional, or connect with MetaMask above)"
                      error={fieldErrors.walletAddress}
                      className="font-mono text-xs"
                    />
                  )}
                </div>
              </div>

              {/* Account Security */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center space-x-2 pb-2 border-b border-slate-800">
                  <Lock className="h-4 w-4 text-indigo-400" />
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Account Security
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Password"
                    name="password"
                    required
                    showPasswordToggle
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Min 6 characters"
                    error={fieldErrors.password}
                  />

                  <Input
                    label="Confirm Password"
                    name="confirmPassword"
                    required
                    showPasswordToggle
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Re-enter password"
                    error={fieldErrors.confirmPassword}
                  />
                </div>
              </div>

              {/* Next Step Button */}
              <div className="pt-2">
                <Button
                  type="submit"
                  size="lg"
                  className="w-full flex items-center justify-center gap-2 shadow-indigo-900/40"
                >
                  <span>Continue to Biometric Authorization</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </form>
          )}

          {/* STEP 2: Biometric Authorization (Either Fingerprint OR Face) */}
          {step === 2 && (
            <div className="space-y-6">
              {/* Method Selector Tabs: Fingerprint vs Face */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Select Biometric Authorization Method:
                  </span>
                  <span className="text-[11px] text-indigo-300 font-medium">
                    (Either method qualifies)
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-950/80 border border-slate-800 rounded-xl">
                  {/* Fingerprint Tab */}
                  <button
                    type="button"
                    onClick={() => setBiometricMethod('FINGERPRINT')}
                    className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-semibold transition-all ${
                      biometricMethod === 'FINGERPRINT'
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    <Fingerprint className="w-4 h-4" />
                    <span>Fingerprint Sensor</span>
                    {fingerprintData && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                  </button>

                  {/* Face Auth Tab */}
                  <button
                    type="button"
                    onClick={() => setBiometricMethod('FACE')}
                    className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-semibold transition-all ${
                      biometricMethod === 'FACE'
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    <Camera className="w-4 h-4" />
                    <span>Face Authentication</span>
                    {faceData && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* Active Biometric Component */}
              {biometricMethod === 'FINGERPRINT' ? (
                <FingerprintCapture
                  initialFingerprintData={fingerprintData}
                  userName={formData.name}
                  userEmail={formData.email}
                  onFingerprintCaptured={(fp) => {
                    setFingerprintData(fp);
                    if (generalError) setGeneralError('');
                  }}
                />
              ) : (
                <FaceCapture
                  initialFaceData={faceData}
                  onFaceCaptured={(face) => {
                    setFaceData(face);
                    if (generalError) setGeneralError('');
                  }}
                />
              )}

              {/* Biometric Status Summary */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">Assigned Unique Voter ID:</span>
                  <span className="font-mono font-semibold text-indigo-300">{formData.voterId}</span>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/60">
                  <span className="text-slate-400 font-medium">Biometric Authorization Status:</span>
                  {isBiometricVerified ? (
                    <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {fingerprintData && faceData
                        ? 'Both Fingerprint & Face Verified'
                        : fingerprintData
                        ? 'Fingerprint Sensor Verified'
                        : 'Face Authentication Verified'}
                    </span>
                  ) : (
                    <span className="text-amber-400 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Verification Required (Scan Fingerprint or Face)
                    </span>
                  )}
                </div>
              </div>

              {/* Navigation & Submit Controls */}
              <div className="flex items-center gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  disabled={loading}
                  className="w-1/3 text-slate-300 border-slate-700"
                  leftIcon={ArrowLeft}
                >
                  Back
                </Button>

                <Button
                  type="button"
                  size="lg"
                  loading={loading}
                  disabled={!isBiometricVerified}
                  onClick={handleFinalRegistration}
                  className={`w-2/3 ${
                    isBiometricVerified
                      ? 'shadow-indigo-900/40 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600'
                      : 'opacity-50 cursor-not-allowed'
                  }`}
                  leftIcon={isBiometricVerified ? Check : undefined}
                >
                  {loading
                    ? 'Registering Account...'
                    : !isBiometricVerified
                    ? 'Verify Biometric to Complete'
                    : 'Complete Voter Registration'}
                </Button>
              </div>
            </div>
          )}

          {/* Footer Link */}
          <div className="mt-8 pt-6 border-t border-slate-800 text-center text-sm text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
              Sign in
            </Link>
          </div>
        </Card>
      </Container>
    </div>
  );
};

export default Register;
