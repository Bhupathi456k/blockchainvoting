/**
 * WebAuthn Client Utilities
 * Handles ArrayBuffer <-> base64url conversions for @simplewebauthn / WebAuthn API
 */

// Helper to convert base64url string to ArrayBuffer
export function base64urlToBuffer(base64urlString) {
  // Replace standard URL-safe characters
  const base64 = base64urlString.replace(/-/g, '+').replace(/_/g, '/');
  // Add padding if needed
  const padLen = (4 - (base64.length % 4)) % 4;
  const padded = base64 + '='.repeat(padLen);
  const binaryString = atob(padded);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// Helper to convert ArrayBuffer to base64url string
export function bufferToBase64url(buffer) {
  const bytes = new Uint8Array(buffer);
  let binaryString = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binaryString += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binaryString);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * Check if the current browser and platform support WebAuthn and platform authenticators (Face ID, Touch ID, Windows Hello)
 */
export async function isWebAuthnSupported() {
  if (!window.PublicKeyCredential) {
    return false;
  }
  try {
    if (PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable) {
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      return available;
    }
    return true;
  } catch (err) {
    console.warn('Error checking WebAuthn platform authenticator:', err);
    return false;
  }
}

/**
 * Transform server-provided WebAuthn authentication options into standard PublicKeyCredentialRequestOptions
 */
export function prepareAuthenticationOptions(options) {
  return {
    ...options,
    challenge: base64urlToBuffer(options.challenge),
    allowCredentials: options.allowCredentials?.map((cred) => ({
      ...cred,
      id: base64urlToBuffer(cred.id),
    })),
  };
}

/**
 * Serialize a PublicKeyCredential assertion response to JSON format matching SimpleWebAuthn's verifyAuthenticationResponse
 */
export function serializeAuthenticationCredential(credential) {
  const response = credential.response;
  return {
    id: credential.id,
    rawId: bufferToBase64url(credential.rawId),
    type: credential.type,
    response: {
      authenticatorData: bufferToBase64url(response.authenticatorData),
      clientDataJSON: bufferToBase64url(response.clientDataJSON),
      signature: bufferToBase64url(response.signature),
      userHandle: response.userHandle ? bufferToBase64url(response.userHandle) : null,
    },
    clientExtensionResults: credential.getClientExtensionResults?.() || {},
    authenticatorAttachment: credential.authenticatorAttachment || null,
  };
}

/**
 * Transform server-provided WebAuthn registration options into standard PublicKeyCredentialCreationOptions
 */
export function prepareRegistrationOptions(options) {
  return {
    ...options,
    challenge: base64urlToBuffer(options.challenge),
    user: {
      ...options.user,
      id: base64urlToBuffer(options.user.id),
    },
    excludeCredentials: options.excludeCredentials?.map((cred) => ({
      ...cred,
      id: base64urlToBuffer(cred.id),
    })),
  };
}

/**
 * Serialize a PublicKeyCredential registration response to JSON format matching SimpleWebAuthn's verifyRegistrationResponse
 */
export function serializeRegistrationCredential(credential) {
  const response = credential.response;
  return {
    id: credential.id,
    rawId: bufferToBase64url(credential.rawId),
    type: credential.type,
    response: {
      attestationObject: bufferToBase64url(response.attestationObject),
      clientDataJSON: bufferToBase64url(response.clientDataJSON),
      transports: response.getTransports ? response.getTransports() : [],
    },
    clientExtensionResults: credential.getClientExtensionResults?.() || {},
    authenticatorAttachment: credential.authenticatorAttachment || null,
  };
}
