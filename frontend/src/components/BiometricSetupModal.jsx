import React, { useState } from 'react';
import { Fingerprint, Shield, CheckCircle2, AlertCircle, Sparkles, X, Plus } from 'lucide-react';
import Button from './ui/Button';
import Input from './ui/Input';
import Card from './ui/Card';
import { useAuth } from '../context/AuthContext';
import {
  prepareRegistrationOptions,
  serializeRegistrationCredential,
} from '../utils/webauthnUtils';
import { webauthnAPI } from '../services/api';

const BiometricSetupModal = ({ isOpen, onClose, onSuccess, initialDeviceName = '' }) => {
  const [deviceName, setDeviceName] = useState(initialDeviceName || 'My Authenticator');
  const [status, setStatus] = useState('idle'); // 'idle' | 'registering' | 'verifying' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!deviceName.trim()) {
      setErrorMessage('Please give your authenticator a nickname');
      return;
    }

    setStatus('registering');
    setErrorMessage('');

    try {
      // 1. Fetch registration options from server
      const res = await webauthnAPI.getRegistrationOptions();
      const options = res.data.data;

      // 2. Prepare PublicKeyCredentialCreationOptions
      const creationOptions = prepareRegistrationOptions(options);

      // 3. Trigger native browser passkey creation
      let credential;
      try {
        credential = await navigator.credentials.create({
          publicKey: creationOptions,
        });
      } catch (browserError) {
        if (browserError.name === 'NotAllowedError') {
          setStatus('error');
          setErrorMessage('Biometric setup was cancelled or timed out.');
          return;
        }
        throw browserError;
      }

      if (!credential) {
        setStatus('error');
        setErrorMessage('Biometric setup was cancelled.');
        return;
      }

      // 4. Verify registration on backend
      setStatus('verifying');
      const serializedCredential = serializeRegistrationCredential(credential);
      const verifyRes = await webauthnAPI.verifyRegistration({
        credential: serializedCredential,
        deviceName: deviceName.trim(),
      });

      setStatus('success');
      setTimeout(() => {
        if (onSuccess) onSuccess(verifyRes.data.data);
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Passkey registration error:', err);
      setStatus('error');
      setErrorMessage(
        err.response?.data?.error || err.message || 'Failed to register biometric authenticator'
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <Card className="w-full max-w-md bg-slate-900 border-slate-700 shadow-2xl p-6 sm:p-8 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={status === 'registering' || status === 'verifying'}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="mx-auto h-14 w-14 bg-indigo-950/60 text-indigo-400 flex items-center justify-center rounded-2xl mb-4 border border-indigo-800/50 shadow-inner">
            {status === 'success' ? (
              <CheckCircle2 className="h-7 w-7 text-emerald-400 animate-bounce" />
            ) : (
              <Fingerprint className="h-7 w-7" />
            )}
          </div>
          <h3 className="text-xl font-bold text-white tracking-tight">
            Register Biometric Authenticator
          </h3>
          <p className="text-xs text-slate-400 mt-1.5">
            Add Touch ID, Face ID, Windows Hello, or a FIDO2 hardware key to your account.
          </p>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="mb-4 bg-red-950/40 border border-red-800/60 rounded-xl p-3.5 flex items-start space-x-2.5 text-red-300 text-xs">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5 text-red-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Success Banner */}
        {status === 'success' && (
          <div className="mb-4 bg-emerald-950/40 border border-emerald-800/60 rounded-xl p-3.5 flex items-center space-x-2.5 text-emerald-300 text-sm">
            <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-emerald-400" />
            <span>Authenticator registered successfully!</span>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Device Name / Nickname
            </label>
            <Input
              type="text"
              required
              value={deviceName}
              onChange={(e) => setDeviceName(e.target.value)}
              placeholder="e.g. MacBook Touch ID, Work Laptop, iPhone"
              disabled={status === 'registering' || status === 'verifying' || status === 'success'}
              className="bg-slate-950/60 border-slate-700 text-sm"
            />
          </div>

          <div className="pt-2 space-y-2">
            <Button
              type="submit"
              size="lg"
              loading={status === 'registering' || status === 'verifying'}
              disabled={status === 'success'}
              className="w-full flex items-center justify-center gap-2 shadow-indigo-900/40"
            >
              {status === 'registering' ? (
                'Touch Biometric Sensor...'
              ) : status === 'verifying' ? (
                'Verifying Authenticator...'
              ) : status === 'success' ? (
                'Registered!'
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Register Device</span>
                </>
              )}
            </Button>

            <button
              type="button"
              onClick={onClose}
              disabled={status === 'registering' || status === 'verifying'}
              className="w-full py-2 text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>

        {/* Privacy Note */}
        <div className="mt-5 pt-4 border-t border-slate-800 text-center">
          <p className="text-xs text-slate-500 flex items-center justify-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-indigo-400" />
            <span>Raw biometric scans stay securely on your hardware chip.</span>
          </p>
        </div>
      </Card>
    </div>
  );
};

export default BiometricSetupModal;
