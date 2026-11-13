const {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} = require('@simplewebauthn/server');
const jwt = require('jsonwebtoken');
const { User, WebAuthnCredential } = require('../models');
const config = require('../config/config');
const AuditService = require('../services/auditService');

const challengeStore = new Map();

function storeChallenge(userId, purpose, challenge) {
  const key = `${userId}:${purpose}`;
  const expiresAt = Date.now() + config.webauthn.challengeTTL;
  challengeStore.set(key, { challenge, expiresAt });
}

function consumeChallenge(userId, purpose) {
  const key = `${userId}:${purpose}`;
  const entry = challengeStore.get(key);
  if (!entry) return null;

  challengeStore.delete(key);

  if (Date.now() > entry.expiresAt) return null;
  return entry.challenge;
}

const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of challengeStore) {
    if (now > entry.expiresAt) challengeStore.delete(key);
  }
}, 60_000);
if (cleanupTimer.unref) cleanupTimer.unref();

function uint8ToBase64url(buf) {
  return Buffer.from(buf).toString('base64url');
}

function base64urlToUint8(b64url) {
  return new Uint8Array(Buffer.from(b64url, 'base64url'));
}

function serializeUser(user) {
  return {
    id: user.id,
    voterId: user.voterId,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    hostPermissionStatus: user.hostPermissionStatus,
    walletAddress: user.walletAddress,
    isEligible: user.isEligible,
    hasVoted: user.hasVoted,
  };
}

function signAccessToken(user) {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role, type: 'access' },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
}

const getRegistrationOptions = async (req, res, next) => {
  try {
    const user = req.user;

    const existingCredentials = await WebAuthnCredential.find({
      userId: user._id || user.id,
    }).select('credentialId transports');

    const excludeCredentials = existingCredentials.map((cred) => ({
      id: cred.credentialId,
      transports: cred.transports || undefined,
    }));

    const options = await generateRegistrationOptions({
      rpName: config.webauthn.rpName,
      rpID: config.webauthn.rpID,
      userName: user.email,
      userDisplayName: user.name,
      userID: Buffer.from(String(user._id || user.id)),
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        residentKey: 'preferred',
        userVerification: 'required',
      },
      excludeCredentials,
      attestationType: 'none',
    });

    storeChallenge(user.id, 'register', options.challenge);

    AuditService.logAuth('WEBAUTHN_REGISTER_STARTED', user, req, {});

    return res.status(200).json({
      success: true,
      data: options,
    });
  } catch (error) {
    next(error);
  }
};

const verifyRegistration = async (req, res, next) => {
  try {
    const user = req.user;
    const { credential, deviceName } = req.body;

    if (!credential) {
      return res.status(400).json({
        success: false,
        error: 'Missing credential in request body',
      });
    }

    const expectedChallenge = consumeChallenge(user.id, 'register');
    if (!expectedChallenge) {
      AuditService.logAuth('WEBAUTHN_REGISTER_FAILED', user, req, { reason: 'Challenge expired or missing' }, 'FAILURE');
      return res.status(400).json({
        success: false,
        error: 'Registration challenge has expired or was already used. Please try again.',
      });
    }

    let verification;
    try {
      verification = await verifyRegistrationResponse({
        response: credential,
        expectedChallenge,
        expectedOrigin: config.webauthn.expectedOrigins,
        expectedRPID: config.webauthn.rpID,
        requireUserVerification: true,
      });
    } catch (verifyError) {
      AuditService.logAuth('WEBAUTHN_REGISTER_FAILED', user, req, { reason: verifyError.message }, 'FAILURE');
      return res.status(400).json({
        success: false,
        error: 'Biometric registration verification failed: ' + verifyError.message,
      });
    }

    if (!verification.verified || !verification.registrationInfo) {
      AuditService.logAuth('WEBAUTHN_REGISTER_FAILED', user, req, { reason: 'Verification returned false' }, 'FAILURE');
      return res.status(400).json({
        success: false,
        error: 'Biometric registration verification failed.',
      });
    }

    const { credential: regCredential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;

    const existingCred = await WebAuthnCredential.findOne({
      credentialId: regCredential.id,
    });
    if (existingCred) {
      return res.status(409).json({
        success: false,
        error: 'This authenticator is already registered.',
      });
    }

    const stored = await WebAuthnCredential.create({
      userId: user._id || user.id,
      credentialId: regCredential.id,
      publicKey: uint8ToBase64url(regCredential.publicKey),
      counter: regCredential.counter,
      transports: credential.response?.transports || null,
      deviceName: deviceName || 'My device',
    });

    AuditService.logAuth('WEBAUTHN_REGISTER_SUCCESS', user, req, {
      credentialId: stored.id,
      deviceName: stored.deviceName,
      deviceType: credentialDeviceType,
      backedUp: credentialBackedUp,
    });

    const token = signAccessToken(user);

    return res.status(201).json({
      success: true,
      message: 'Biometric authenticator registered successfully.',
      data: {
        id: stored.id,
        deviceName: stored.deviceName,
        createdAt: stored.createdAt,
        token,
        user: serializeUser(user),
      },
    });
  } catch (error) {
    next(error);
  }
};

const getAuthenticationOptions = async (req, res, next) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required',
      });
    }

    const credentials = await WebAuthnCredential.find({
      userId,
    }).select('credentialId transports');

    if (credentials.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No biometric authenticators registered. Please set up biometric login first.',
        code: 'NO_CREDENTIALS',
      });
    }

    const allowCredentials = credentials.map((cred) => ({
      id: cred.credentialId,
      transports: cred.transports || undefined,
    }));

    const options = await generateAuthenticationOptions({
      rpID: config.webauthn.rpID,
      allowCredentials,
      userVerification: 'required',
    });

    storeChallenge(userId, 'authenticate', options.challenge);

    AuditService.logAuth('WEBAUTHN_AUTH_STARTED', null, req, { userId });

    return res.status(200).json({
      success: true,
      data: options,
    });
  } catch (error) {
    next(error);
  }
};

const verifyAuthentication = async (req, res, next) => {
  try {
    const { userId, credential } = req.body;

    if (!userId || !credential) {
      return res.status(400).json({
        success: false,
        error: 'userId and credential are required',
      });
    }

    const expectedChallenge = consumeChallenge(userId, 'authenticate');
    if (!expectedChallenge) {
      AuditService.logAuth('WEBAUTHN_AUTH_FAILED', null, req, { userId, reason: 'Challenge expired or missing' }, 'FAILURE');
      return res.status(400).json({
        success: false,
        error: 'Authentication challenge has expired or was already used. Please try again.',
      });
    }

    const storedCredential = await WebAuthnCredential.findOne({
      credentialId: credential.id,
    });

    if (!storedCredential) {
      AuditService.logAuth('WEBAUTHN_AUTH_FAILED', null, req, { userId, reason: 'Unknown credential' }, 'FAILURE');
      return res.status(400).json({
        success: false,
        error: 'Unknown authenticator. The credential is not registered.',
      });
    }

    if (String(storedCredential.userId) !== String(userId)) {
      AuditService.logAuth('WEBAUTHN_AUTH_FAILED', null, req, { userId, reason: 'Credential/user mismatch' }, 'FAILURE');
      return res.status(400).json({
        success: false,
        error: 'Authentication failed. Credential does not match user.',
      });
    }

    let verification;
    try {
      verification = await verifyAuthenticationResponse({
        response: credential,
        expectedChallenge,
        expectedOrigin: config.webauthn.expectedOrigins,
        expectedRPID: config.webauthn.rpID,
        requireUserVerification: true,
        credential: {
          id: storedCredential.credentialId,
          publicKey: base64urlToUint8(storedCredential.publicKey),
          counter: storedCredential.counter,
          transports: storedCredential.transports || undefined,
        },
      });
    } catch (verifyError) {
      AuditService.logAuth('WEBAUTHN_AUTH_FAILED', null, req, { userId, reason: verifyError.message }, 'FAILURE');
      return res.status(400).json({
        success: false,
        error: 'Biometric verification failed: ' + verifyError.message,
      });
    }

    if (!verification.verified) {
      AuditService.logAuth('WEBAUTHN_AUTH_FAILED', null, req, { userId, reason: 'Verification returned false' }, 'FAILURE');
      return res.status(400).json({
        success: false,
        error: 'Biometric verification failed.',
      });
    }

    storedCredential.counter = verification.authenticationInfo.newCounter;
    storedCredential.lastUsedAt = new Date();
    await storedCredential.save();

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    AuditService.logAuth('WEBAUTHN_AUTH_SUCCESS', user, req, {
      credentialId: storedCredential.id,
      deviceName: storedCredential.deviceName,
    });

    const token = signAccessToken(user);

    return res.status(200).json({
      success: true,
      message: 'Biometric authentication successful.',
      data: {
        verified: true,
        token,
        user: serializeUser(user),
      },
    });
  } catch (error) {
    next(error);
  }
};

const listCredentials = async (req, res, next) => {
  try {
    const credentials = await WebAuthnCredential.find({
      userId: req.user._id || req.user.id,
    })
      .select('id deviceName createdAt lastUsedAt')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: credentials,
    });
  } catch (error) {
    next(error);
  }
};

const renameCredential = async (req, res, next) => {
  try {
    const { deviceName } = req.body;
    const credId = req.params.id;

    if (!deviceName || !deviceName.trim()) {
      return res.status(400).json({
        success: false,
        error: 'deviceName is required',
      });
    }

    const cred = await WebAuthnCredential.findOne({
      _id: credId,
      userId: req.user._id || req.user.id,
    });

    if (!cred) {
      return res.status(404).json({
        success: false,
        error: 'Credential not found',
      });
    }

    cred.deviceName = deviceName.trim().substring(0, 200);
    await cred.save();

    return res.status(200).json({
      success: true,
      message: 'Authenticator renamed successfully.',
      data: { id: cred.id, deviceName: cred.deviceName },
    });
  } catch (error) {
    next(error);
  }
};

const removeCredential = async (req, res, next) => {
  try {
    const credId = req.params.id;

    const cred = await WebAuthnCredential.findOne({
      _id: credId,
      userId: req.user._id || req.user.id,
    });

    if (!cred) {
      return res.status(404).json({
        success: false,
        error: 'Credential not found',
      });
    }

    const deviceName = cred.deviceName;
    await WebAuthnCredential.deleteOne({ _id: cred._id });

    AuditService.logAuth('WEBAUTHN_CREDENTIAL_REMOVED', req.user, req, {
      credentialDbId: credId,
      deviceName,
    });

    return res.status(200).json({
      success: true,
      message: 'Authenticator removed successfully.',
    });
  } catch (error) {
    next(error);
  }
};

const hasCredentials = async (req, res, next) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ success: false, error: 'Invalid userId' });
    }

    const count = await WebAuthnCredential.countDocuments({ userId });

    return res.status(200).json({
      success: true,
      data: { hasCredentials: count > 0, count },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRegistrationOptions,
  verifyRegistration,
  getAuthenticationOptions,
  verifyAuthentication,
  listCredentials,
  renameCredential,
  removeCredential,
  hasCredentials,
  storeChallenge,
  consumeChallenge,
};
