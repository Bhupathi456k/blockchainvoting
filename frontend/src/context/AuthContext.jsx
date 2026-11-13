import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI, webauthnAPI } from '../services/api';
import web3Service from '../services/web3';

const AuthContext = createContext(null);

// Login state constants
export const LOGIN_STATES = {
  PASSWORD_REQUIRED: 'PASSWORD_REQUIRED',
  PASSWORD_VERIFIED: 'PASSWORD_VERIFIED',
  BIOMETRIC_REQUIRED: 'BIOMETRIC_REQUIRED',
  BIOMETRIC_VERIFIED: 'BIOMETRIC_VERIFIED',
  AUTHENTICATED: 'AUTHENTICATED',
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState(null);

  // 2-step authentication flow state
  const [loginState, setLoginState] = useState(LOGIN_STATES.PASSWORD_REQUIRED);
  const [preAuthToken, setPreAuthToken] = useState(null);
  const [requiresBiometricSetup, setRequiresBiometricSetup] = useState(false);
  const [requiresBiometric, setRequiresBiometric] = useState(false);
  const [biometricError, setBiometricError] = useState(null);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [pendingUserId, setPendingUserId] = useState(null);

  useEffect(() => {
    // Check for saved auth token and user
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
      // Fetch fresh user data
      fetchUserProfile();
    } else {
      setLoading(false);
    }

    // Check if wallet was previously connected
    if (web3Service.getAccount()) {
      setWalletConnected(true);
      setWalletAddress(web3Service.getAccount());
    }

    // Listen for account changes
    web3Service.onAccountsChanged((accounts) => {
      if (accounts.length === 0) {
        setWalletConnected(false);
        setWalletAddress(null);
      } else {
        setWalletAddress(accounts[0]);
      }
    });
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await authAPI.getMe();
      setUser(response.data.data.user);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  // ────────────────────────────────────────────────────────────────────
  // Step 1: Password Login → Returns pre-auth token + biometric flags
  // ────────────────────────────────────────────────────────────────────
  const login = async (credentialsOrIdentifier, maybePassword) => {
    let payload = credentialsOrIdentifier;
    if (typeof credentialsOrIdentifier === 'string') {
      payload = {
        identifier: credentialsOrIdentifier,
        password: maybePassword,
      };
    }

    const response = await authAPI.login(payload);
    const { token, user: userData, requiresBiometric: needsBiometric, requiresBiometricSetup: needsBiometricSetup, preAuthToken: preToken } = response.data.data;

    // Direct Login: Store full access token & user in localStorage & React state
    localStorage.removeItem('preAuthToken');
    if (token) {
      localStorage.setItem('token', token);
    }
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    setLoginState(LOGIN_STATES.AUTHENTICATED);
    setRequiresBiometric(false);
    setRequiresBiometricSetup(false);
    return userData;
  };


  // ────────────────────────────────────────────────────────────────────
  // Step 2: WebAuthn Biometric Verification → Returns final access token
  // ────────────────────────────────────────────────────────────────────
  const verifyBiometric = async (credential) => {
    if (!pendingUserId) {
      throw new Error('No pending authentication session');
    }

    setBiometricLoading(true);
    setBiometricError(null);

    try {
      const response = await webauthnAPI.verifyAuthentication(pendingUserId, credential);
      const { token, user: userData } = response.data.data;

      // Success: Store final access token and user
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.removeItem('preAuthToken');
      setUser(userData);
      setPreAuthToken(null);
      setPendingUserId(null);
      setRequiresBiometric(false);
      setRequiresBiometricSetup(false);
      setLoginState(LOGIN_STATES.AUTHENTICATED);

      return userData;
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Biometric verification failed';
      setBiometricError(errorMsg);
      throw error;
    } finally {
      setBiometricLoading(false);
    }
  };

  // Get WebAuthn authentication options for biometric verification
  const getBiometricOptions = async () => {
    if (!pendingUserId) {
      throw new Error('No pending authentication session');
    }

    const response = await webauthnAPI.getAuthenticationOptions(pendingUserId);
    return response.data.data;
  };

  // Check if user has registered credentials
  const checkBiometricStatus = async (userId) => {
    try {
      const response = await webauthnAPI.hasCredentials(userId);
      return response.data.data;
    } catch (error) {
      return { hasCredentials: false, count: 0 };
    }
  };

  // Cancel biometric flow, go back to password step
  const cancelBiometric = () => {
    setPreAuthToken(null);
    setPendingUserId(null);
    setRequiresBiometric(false);
    setRequiresBiometricSetup(false);
    setBiometricError(null);
    setLoginState(LOGIN_STATES.PASSWORD_REQUIRED);
    localStorage.removeItem('preAuthToken');
  };

  // Retry biometric verification
  const retryBiometric = () => {
    setBiometricError(null);
    setLoginState(LOGIN_STATES.BIOMETRIC_REQUIRED);
  };

  const register = async (userData) => {
    const response = await authAPI.register(userData);
    const { token, preAuthToken: pToken, user: newUser } = response.data.data;

    if (token) {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(newUser));
      setUser(newUser);
      setLoginState(LOGIN_STATES.AUTHENTICATED);
    } else if (pToken) {
      localStorage.setItem('preAuthToken', pToken);
      setPreAuthToken(pToken);
      setPendingUserId(newUser.id);
      localStorage.setItem('user', JSON.stringify(newUser));
      setUser(newUser);
    }

    return response.data.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('preAuthToken');
    setUser(null);
    setLoginState(LOGIN_STATES.PASSWORD_REQUIRED);
    setPreAuthToken(null);
    setPendingUserId(null);
    setRequiresBiometric(false);
    setRequiresBiometricSetup(false);
    setBiometricError(null);
    web3Service.disconnect();
    setWalletConnected(false);
    setWalletAddress(null);
  };

  const connectWallet = async () => {
    try {
      const result = await web3Service.connectWallet();
      setWalletConnected(true);
      setWalletAddress(result.account);

      // Update wallet address in backend
      if (user && result.account !== user.walletAddress) {
        await authAPI.updateWallet({ walletAddress: result.account });
        await fetchUserProfile();
      }

      return result;
    } catch (error) {
      console.error('Wallet connection failed:', error);
      throw error;
    }
  };

  // WebAuthn Credential Management
  const listCredentials = async () => {
    const response = await webauthnAPI.listCredentials();
    return response.data.data;
  };

  const renameCredential = async (id, deviceName) => {
    const response = await webauthnAPI.renameCredential(id, deviceName);
    return response.data.data;
  };

  const removeCredential = async (id) => {
    const response = await webauthnAPI.removeCredential(id);
    return response.data;
  };

  // Register a new biometric authenticator (for settings page)
  const registerBiometric = async (deviceName) => {
    // Get registration options
    const optionsResponse = await webauthnAPI.getRegistrationOptions();
    const options = optionsResponse.data.data;

    // Call navigator.credentials.create()
    const credential = await navigator.credentials.create({
      publicKey: {
        ...options,
        challenge: new Uint8Array(Buffer.from(options.challenge, 'base64')),
        user: {
          ...options.user,
          id: new Uint8Array(Buffer.from(options.user.id, 'base64')),
        },
        excludeCredentials: options.excludeCredentials?.map((cred) => ({
          ...cred,
          id: new Uint8Array(Buffer.from(cred.id, 'base64')),
        })),
      },
    });

    // Verify registration
    const response = await webauthnAPI.verifyRegistration({
      credential,
      deviceName,
    });

    return response.data.data;
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    walletConnected,
    walletAddress,
    connectWallet,
    isAdmin: user?.role === 'ADMIN',
    isVoter: user?.role === 'VOTER',
    hostPermissionStatus: user?.hostPermissionStatus || 'NONE',
    canHostElections: user?.hostPermissionStatus === 'APPROVED' || user?.role === 'ADMIN',
    hasHostPermissionPending: user?.hostPermissionStatus === 'PENDING',
    hasHostPermissionRejected: user?.hostPermissionStatus === 'REJECTED',
    refreshUser: fetchUserProfile,
    // 2-step biometric auth
    loginState,
    preAuthToken,
    requiresBiometricSetup,
    requiresBiometric,
    biometricError,
    biometricLoading,
    pendingUserId,
    verifyBiometric,
    getBiometricOptions,
    checkBiometricStatus,
    cancelBiometric,
    retryBiometric,
    // Credential management
    listCredentials,
    renameCredential,
    removeCredential,
    registerBiometric,
    LOGIN_STATES,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};