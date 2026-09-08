import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import web3Service from '../services/web3';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState(null);

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

  const login = async (credentials) => {
    const response = await authAPI.login(credentials);
    const { token, user: userData } = response.data.data;

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);

    return userData;
  };

  const register = async (userData) => {
    const response = await authAPI.register(userData);
    const { token, user: newUser } = response.data.data;

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(newUser));
    setUser(newUser);

    return newUser;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
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
    refreshUser: fetchUserProfile,
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
