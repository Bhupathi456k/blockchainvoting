import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import web3Service from '../services/web3';
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
  Lock
} from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import Container from '../components/ui/Container';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    voterId: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    walletAddress: '',
  });

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

  // Check if wallet is already connected via Web3Service
  useEffect(() => {
    const existingAccount = web3Service.getAccount();
    if (existingAccount) {
      setWalletStatus({
        connected: true,
        address: existingAccount,
        chainId: null,
      });
      setFormData(prev => ({ ...prev, walletAddress: existingAccount }));
    }

    // Listen for accounts change
    web3Service.onAccountsChanged((accounts) => {
      if (accounts.length > 0) {
        setWalletStatus({
          connected: true,
          address: accounts[0],
          chainId: null,
        });
        setFormData(prev => ({ ...prev, walletAddress: accounts[0] }));
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
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear specific field error on change
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (generalError) {
      setGeneralError('');
    }
  };

  const validateForm = () => {
    const errors = {};

    // Name validation
    if (!formData.name.trim()) {
      errors.name = 'Full name is required';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }

    // Voter ID validation
    if (!formData.voterId.trim()) {
      errors.voterId = 'Voter ID is required';
    } else if (!/^[A-Za-z0-9_-]{4,20}$/.test(formData.voterId.trim())) {
      errors.voterId = 'Voter ID must be 4-20 alphanumeric characters';
    }

    // Email validation
    if (!formData.email.trim()) {
      errors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = 'Please enter a valid email address';
    }

    // Phone validation (optional)
    if (formData.phone && !/^\+?[0-9\s-]{7,15}$/.test(formData.phone.trim())) {
      errors.phone = 'Please enter a valid phone number';
    }

    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters long';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Confirm password is required';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    // Wallet address validation (if manually entered)
    if (formData.walletAddress && !/^0x[a-fA-F0-9]{40}$/.test(formData.walletAddress.trim())) {
      errors.walletAddress = 'Please enter a valid Ethereum address (0x...)';
    }

    return errors;
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
      setFormData(prev => ({ ...prev, walletAddress: result.account }));
      if (fieldErrors.walletAddress) {
        setFieldErrors(prev => ({ ...prev, walletAddress: '' }));
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError('');

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      return;
    }

    setLoading(true);

    try {
      const { confirmPassword, ...registerData } = formData;
      registerData.name = registerData.name.trim();
      registerData.voterId = registerData.voterId.trim();
      registerData.email = registerData.email.trim();
      if (registerData.phone) registerData.phone = registerData.phone.trim();
      if (registerData.walletAddress) registerData.walletAddress = registerData.walletAddress.trim();

      if (!registerData.walletAddress) delete registerData.walletAddress;
      if (!registerData.phone) delete registerData.phone;

      await register(registerData);
      navigate('/dashboard');
    } catch (err) {
      console.error('Registration error:', err);
      setGeneralError(
        err.response?.data?.error ||
        err.response?.data?.errors?.[0]?.message ||
        'Registration failed. Please check your information and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-8 sm:py-12">
      <Container size="sm" className="max-w-[560px]">
        {/* Registration Card */}
        <Card className="bg-slate-900/95 border-slate-800 shadow-2xl p-6 sm:p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto h-12 w-12 bg-indigo-950/60 text-indigo-400 flex items-center justify-center rounded-xl mb-4 border border-indigo-800/50 shadow-inner">
              <UserPlus className="h-6 w-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Create Voter Account
            </h1>
            <p className="text-sm text-slate-400 mt-2">
              Register to participate in secure blockchain elections
            </p>
          </div>

          {/* General Error Banner */}
          {generalError && (
            <div className="mb-6 bg-red-950/40 border border-red-800/60 rounded-xl p-4 flex items-start space-x-3 text-red-300 text-sm">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5 text-red-400" />
              <span>{generalError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-6">
            {/* SECTION 1: Personal Information */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 pb-2 border-b border-slate-800">
                <User className="h-4 w-4 text-indigo-400" />
                <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Personal Information
                </h2>
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

                <Input
                  label="Voter ID"
                  name="voterId"
                  required
                  value={formData.voterId}
                  onChange={handleChange}
                  placeholder="e.g. VOTER12345"
                  error={fieldErrors.voterId}
                  leftIcon={CreditCard}
                />
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

            {/* SECTION 2: Blockchain Identity */}
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
                      Connect your MetaMask wallet for decentralized verification
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
                      Connect MetaMask
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

            {/* SECTION 3: Security */}
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
                  hint="Must be at least 6 characters"
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

            {/* Submit Button */}
            <div className="pt-2">
              <Button
                type="submit"
                size="lg"
                loading={loading}
                className="w-full shadow-indigo-900/40"
              >
                {loading ? 'Creating account...' : 'Create Voter Account'}
              </Button>
            </div>
          </form>

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
