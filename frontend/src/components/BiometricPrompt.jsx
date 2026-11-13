import React, { useState, useEffect } from 'react';
import { Fingerprint, Shield, AlertCircle, CheckCircle2, RefreshCw, ArrowLeft, Smartphone, Key } from 'lucide-react';
import Button from './ui/Button';
import Card from './ui/Card';
import { useAuth } from '../context/AuthContext';
import {
  isWebAuthnSupported,
  prepareAuthenticationOptions,
  serializeAuthenticationCredential,
} from '../utils/webauthnUtils';

const BiometricPrompt = ({
  isAdmin = false,
  userEmail,
  onSuccess,
  onCancel,
}) => {
  const { getBiometricOptions, verifyBiometric } = useAuth();

  const [status, setStatus] = useState('idle'); // 'idle' | 'prompting' | 'verifying' | 'success' | 'error' | 'unsupported'
  const [errorMessage, setErrorMessage] = useState('');
  const [supported, setSupported] = useState(true);

  // Check WebAuthn support on mount
  useEffect(() => {
    async function checkSupport() {
      const isSupported = await isWebAuthnSupported();
      setSupported(isSupported);
      if (!isSupported) {
        setStatus('unsupported');
        setErrorMessage('Your device/browser does not currently provide a supported biometric authenticator.');
      } else {
        // Automatically start biometric challenge on component mount
        handleAuthenticate();
      }
    }
    checkSupport();
  }, []);

  const handleAuthenticate = async () => {
    setStatus('prompting');
    setErrorMessage('');

    try {
      // 1. Get authentication options from backend
      const options = await getBiometricOptions();

      // 2. Prepare PublicKeyCredentialRequestOptions
      const credentialRequestOptions = prepareAuthenticationOptions(options);

      // 3. Trigger native browser WebAuthn prompt
      setStatus('prompting');
      let assertion;
      try {
        assertion = await navigator.credentials.get({
          publicKey: credentialRequestOptions,
        });
      } catch (browserError) {
        if (browserError.name === 'NotAllowedError') {
          setStatus('error');
          setErrorMessage('Biometric verification was cancelled or timed out.');
          return;
        }
        throw browserError;
      }

      if (!assertion) {
        setStatus('error');
        setErrorMessage('Biometric verification was cancelled.');
        return;
      }

      // 4. Serialize assertion and verify with backend
      setStatus('verifying');
      const serializedCredential = serializeAuthenticationCredential(assertion);
      const authenticatedUser = await verifyBiometric(serializedCredential);

      // 5. Success state
      setStatus('success');
      setTimeout(() => {
        if (onSuccess) {
          onSuccess(authenticatedUser);
        }
      }, 1000);
    } catch (err) {
      console.error('Biometric authentication error:', err);
      setStatus('error');
      const serverMsg = err.response?.data?.error || err.message;
      if (serverMsg.includes('cancel') || serverMsg.includes('Cancel') || serverMsg.includes('abort')) {
        setErrorMessage('Biometric verification was cancelled.');
      } else if (serverMsg.includes('not supported') || serverMsg.includes('unsupported')) {
        setErrorMessage('Your device/browser does not currently provide a supported biometric authenticator.');
      } else {
        setErrorMessage(serverMsg || 'Biometric authentication failed. Please try again.');
      }
    }
  };

  return (
    <Card className={`p-6 sm:p-8 backdrop-blur-xl shadow-2xl ${
      isAdmin ? 'bg-slate-900/90 border-red-500/30' : 'bg-slate-900/95 border-slate-800'
    }`}>
      {/* Header */}
      <div className="text-center mb-6">
        <div className={`mx-auto h-16 w-16 flex items-center justify-center rounded-2xl mb-4 border shadow-inner ${
          isAdmin
            ? 'bg-red-950/60 text-red-400 border-red-800/50'
            : 'bg-indigo-950/60 text-indigo-400 border-indigo-800/50'
        }`}>
          {status === 'success' ? (
            <CheckCircle2 className="h-8 w-8 text-emerald-400 animate-bounce" />
          ) : (
            <Fingerprint className={`h-8 w-8 ${status === 'prompting' || status === 'verifying' ? 'animate-pulse text-indigo-300' : ''}`} />
          )}
        </div>

        <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase mb-2 ${
          isAdmin ? 'bg-red-950/60 border border-red-800/60 text-red-300' : 'bg-indigo-950/60 border border-indigo-800/60 text-indigo-300'
        }`}>
          Step 2 of 2: Biometric Factor
        </div>

        <h2 className="text-2xl font-bold text-white tracking-tight">
          {isAdmin ? 'VERIFY ADMIN IDENTITY' : 'VERIFY YOUR IDENTITY'}
        </h2>

        <p className="text-sm text-slate-400 mt-2">
          Use your device's biometric authentication (Touch ID, Face ID, Windows Hello, or Security Key) to complete sign-in.
        </p>

        {userEmail && (
          <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-800/80 rounded-lg text-xs font-mono text-slate-300 border border-slate-700">
            <span className="text-slate-500">Signing in as:</span>
            <span className="text-slate-200 font-semibold">{userEmail}</span>
          </div>
        )}
      </div>

      {/* Dynamic Status Display */}
      <div className="my-6">
        {status === 'prompting' && (
          <div className="bg-indigo-950/40 border border-indigo-800/60 rounded-xl p-5 text-center space-y-3">
            <div className="flex justify-center">
              <div className="relative">
                <Fingerprint className="h-10 w-10 text-indigo-400 animate-pulse" />
                <div className="absolute inset-0 rounded-full bg-indigo-500/20 animate-ping" />
              </div>
            </div>
            <div>
              <p className="text-indigo-200 font-medium text-sm">
                Waiting for biometric verification...
              </p>
              <p className="text-xs text-indigo-300/70 mt-1">
                Touch your fingerprint sensor, look at your camera, or interact with your security key.
              </p>
            </div>
          </div>
        )}

        {status === 'verifying' && (
          <div className="bg-indigo-950/40 border border-indigo-800/60 rounded-xl p-5 text-center space-y-3">
            <div className="flex justify-center">
              <div className="w-8 h-8 border-3 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="text-indigo-200 font-medium text-sm">
              Cryptographically verifying assertion...
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="bg-emerald-950/40 border border-emerald-800/60 rounded-xl p-5 text-center space-y-2">
            <div className="flex justify-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-400" />
            </div>
            <p className="text-emerald-200 font-semibold text-base">
              Identity verified
            </p>
            <p className="text-xs text-emerald-300/80">
              Signing you in to your secure session...
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="bg-red-950/40 border border-red-800/60 rounded-xl p-4 flex items-start space-x-3 text-red-300 text-sm">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5 text-red-400" />
            <div className="space-y-1">
              <p className="font-medium text-red-200">{errorMessage}</p>
              <p className="text-xs text-red-400/80">
                You can retry biometric authentication or return to password login.
              </p>
            </div>
          </div>
        )}

        {status === 'unsupported' && (
          <div className="bg-amber-950/40 border border-amber-800/60 rounded-xl p-4 flex items-start space-x-3 text-amber-300 text-sm">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5 text-amber-400" />
            <div>
              <p className="font-medium text-amber-200">Biometrics Not Supported</p>
              <p className="text-xs text-amber-300/80 mt-1">
                Your device/browser does not currently provide a supported biometric authenticator.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        {(status === 'error' || status === 'idle') && supported && (
          <Button
            type="button"
            size="lg"
            onClick={handleAuthenticate}
            className={`w-full flex items-center justify-center gap-2 ${
              isAdmin
                ? 'bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600'
                : 'shadow-indigo-900/40'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry Biometric Authentication</span>
          </Button>
        )}

        <button
          type="button"
          onClick={onCancel}
          className="w-full py-2.5 px-4 bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 border border-slate-700/50"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Cancel and Return to Password Login</span>
        </button>
      </div>

      {/* Security Footnote */}
      <div className="mt-6 pt-4 border-t border-slate-800 text-center">
        <p className="text-xs text-slate-500 flex items-center justify-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-slate-400" />
          <span>FIDO2 / WebAuthn standard: biometric data never leaves your device</span>
        </p>
      </div>
    </Card>
  );
};

export default BiometricPrompt;
