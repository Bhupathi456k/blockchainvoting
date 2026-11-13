import React, { useState } from 'react';
import { Fingerprint, CheckCircle2, Shield, Sparkles, RefreshCw, AlertCircle } from 'lucide-react';
import Button from './ui/Button';

const FingerprintCapture = ({
  onFingerprintCaptured,
  initialFingerprintData = null,
  userName = 'Voter',
  userEmail = 'voter@blockvote.local',
}) => {
  const [scanStatus, setScanStatus] = useState(initialFingerprintData ? 'VERIFIED' : 'IDLE'); // 'IDLE' | 'SCANNING' | 'VERIFIED' | 'ERROR'
  const [errorMessage, setErrorMessage] = useState('');
  const [fingerprintToken, setFingerprintToken] = useState(initialFingerprintData);
  const [statusMessage, setStatusMessage] = useState(
    initialFingerprintData
      ? 'Fingerprint biometric authorized and verified.'
      : 'Click "Start Fingerprint Scan" and touch your physical fingerprint sensor.'
  );

  // Trigger native platform biometric / physical fingerprint scanner
  const startScan = async () => {
    setErrorMessage('');
    setScanStatus('SCANNING');
    setStatusMessage('Waiting for sensor... Please place and hold your finger on your fingerprint scanner.');

    try {
      if (!window.PublicKeyCredential || !navigator.credentials?.create) {
        throw new Error('WebAuthn biometric authentication is not supported by this browser.');
      }

      // Check if platform authenticator (Windows Hello, Touch ID, hardware sensor) is available
      if (PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable) {
        const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        if (!available) {
          console.warn('Platform authenticator not reported available, attempting creation anyway...');
        }
      }

      // 32-byte cryptographic challenge
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);

      // Derive user ID buffer
      const userIdBuffer = new TextEncoder().encode(userEmail || 'voter');

      // Invoke native browser / OS fingerprint scanner dialog
      // This directly invokes Windows Hello / Touch ID and WAITS for the physical sensor touch
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: {
            name: 'BlockVote Platform',
            id: window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname,
          },
          user: {
            id: userIdBuffer,
            name: userEmail || 'voter@blockvote.local',
            displayName: userName || 'Voter',
          },
          pubKeyCredParams: [
            { alg: -7, type: 'public-key' },  // ES256
            { alg: -257, type: 'public-key' }, // RS256
          ],
          authenticatorSelection: {
            authenticatorAttachment: 'platform', // Physical hardware sensor (Windows Hello / Touch ID)
            userVerification: 'required',        // Requires physical fingerprint touch
            residentKey: 'preferred',
          },
          timeout: 60000,
          attestation: 'none',
        },
      });

      if (!credential) {
        throw new Error('No credential was returned by the fingerprint sensor.');
      }

      // Physical sensor was touched and verified successfully!
      const credId = credential.id || `FP-HW-${Date.now()}`;
      setFingerprintToken(credId);
      setScanStatus('VERIFIED');
      setStatusMessage('Physical fingerprint sensor authenticated successfully!');

      if (onFingerprintCaptured) {
        onFingerprintCaptured(credId);
      }
    } catch (err) {
      console.error('Physical fingerprint scanning error:', err);
      setScanStatus('ERROR');

      if (err.name === 'NotAllowedError') {
        setErrorMessage('Fingerprint scan was cancelled, timed out, or finger was removed too quickly. Please try again.');
        setStatusMessage('Sensor scan cancelled or timed out.');
      } else if (err.name === 'NotSupportedError') {
        setErrorMessage('Platform biometric sensor not recognized by browser. Please ensure Windows Hello or biometric sensor is configured.');
        setStatusMessage('Sensor not supported or not configured.');
      } else {
        setErrorMessage(err.message || 'Failed to capture fingerprint from sensor. Please try again.');
        setStatusMessage('Fingerprint scan failed.');
      }
    }
  };

  const handleReset = () => {
    setScanStatus('IDLE');
    setFingerprintToken(null);
    setErrorMessage('');
    setStatusMessage('Click "Start Fingerprint Scan" and touch your physical fingerprint sensor.');
    if (onFingerprintCaptured) {
      onFingerprintCaptured(null);
    }
  };

  return (
    <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden space-y-5">
      {/* Background ambient glow */}
      <div className="absolute -top-20 -left-20 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Fingerprint className="h-5 w-5 text-indigo-400" />
          <h3 className="text-sm font-semibold text-white tracking-wide">
            Physical Fingerprint Scanner
          </h3>
        </div>
        {scanStatus === 'VERIFIED' && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 animate-fade-in">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Sensor Verified
          </span>
        )}
      </div>

      {/* Error notification */}
      {errorMessage && (
        <div className="bg-red-950/40 border border-red-800/60 rounded-xl p-3.5 flex items-start space-x-2.5 text-red-300 text-xs">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5 text-red-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Biometric Scanner Visual Pad */}
      <div className="flex flex-col items-center justify-center py-4">
        <div
          onClick={scanStatus === 'IDLE' || scanStatus === 'ERROR' ? startScan : undefined}
          className={`relative p-6 rounded-3xl transition-all duration-500 ${
            scanStatus === 'VERIFIED'
              ? 'bg-emerald-950/40 border-2 border-emerald-500/70 shadow-[0_0_35px_rgba(16,185,129,0.3)]'
              : scanStatus === 'SCANNING'
              ? 'bg-indigo-950/50 border-2 border-indigo-500 shadow-[0_0_40px_rgba(99,102,241,0.4)] scale-105 animate-pulse'
              : scanStatus === 'ERROR'
              ? 'bg-red-950/20 border-2 border-red-500/50 cursor-pointer hover:border-red-400'
              : 'bg-slate-900 border-2 border-slate-700 hover:border-indigo-500 hover:shadow-[0_0_25px_rgba(99,102,241,0.25)] hover:scale-105 cursor-pointer'
          }`}
        >
          {/* Concentric Scanner Pulse Rings */}
          <div className="relative w-28 h-28 flex items-center justify-center">
            {scanStatus === 'SCANNING' && (
              <>
                <div className="absolute inset-0 rounded-2xl border-2 border-indigo-400/40 animate-ping" />
                <div className="absolute inset-[-8px] rounded-3xl border border-indigo-400/20 animate-pulse" />
              </>
            )}

            {/* Glowing Laser Bar Animation during scanning */}
            {scanStatus === 'SCANNING' && (
              <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_12px_rgba(34,211,238,0.9)] animate-scanline z-20" />
            )}

            {/* Main Fingerprint Icon */}
            <Fingerprint
              className={`w-20 h-20 transition-all duration-300 ${
                scanStatus === 'VERIFIED'
                  ? 'text-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,0.6)]'
                  : scanStatus === 'SCANNING'
                  ? 'text-cyan-300 animate-pulse'
                  : scanStatus === 'ERROR'
                  ? 'text-red-400'
                  : 'text-slate-400'
              }`}
            />
          </div>

          {/* Subtext on pad */}
          <span className="block mt-3 text-center text-[11px] font-mono tracking-wider font-semibold uppercase text-slate-300">
            {scanStatus === 'VERIFIED'
              ? 'Sensor Verified'
              : scanStatus === 'SCANNING'
              ? 'Touch Sensor Now...'
              : scanStatus === 'ERROR'
              ? 'Scan Failed'
              : 'Click to Scan'}
          </span>
        </div>

        {/* Status Message */}
        <p className="mt-4 text-xs font-medium text-slate-300 text-center max-w-sm">
          {statusMessage}
        </p>

        {/* Display Encrypted Credential Token once verified */}
        {scanStatus === 'VERIFIED' && fingerprintToken && (
          <div className="mt-4 w-full bg-slate-900/90 border border-emerald-900/50 rounded-xl p-3 text-left">
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
              <span className="flex items-center gap-1">
                <Shield className="w-3 h-3 text-emerald-400" />
                <span>Hardware Authenticator Credential ID</span>
              </span>
              <span className="text-emerald-400 font-medium">Verified</span>
            </div>
            <div className="font-mono text-xs text-emerald-300 tracking-wider truncate">
              {fingerprintToken}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="mt-4 flex items-center justify-center gap-3">
          {(scanStatus === 'IDLE' || scanStatus === 'ERROR') && (
            <Button
              type="button"
              onClick={startScan}
              className="shadow-indigo-900/40"
              leftIcon={Fingerprint}
            >
              Start Fingerprint Scan
            </Button>
          )}

          {scanStatus === 'SCANNING' && (
            <div className="flex items-center gap-2 text-xs text-indigo-300 font-medium">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
              <span>Touch your physical sensor to authorize...</span>
            </div>
          )}

          {scanStatus === 'VERIFIED' && (
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              className="text-slate-300 border-slate-700 text-xs"
              leftIcon={RefreshCw}
            >
              Re-Scan Fingerprint
            </Button>
          )}
        </div>
      </div>

      {/* Security notice footer */}
      <div className="pt-3 border-t border-slate-800/80 text-center">
        <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
          <Sparkles className="w-3 h-3 text-indigo-400" />
          <span>Communicates with your physical fingerprint sensor / Windows Hello via standard FIDO2 WebAuthn.</span>
        </p>
      </div>
    </div>
  );
};

export default FingerprintCapture;
