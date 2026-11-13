const express = require('express');
const { body } = require('express-validator');
const webauthnController = require('../controllers/webauthnController');
const { authenticate, authenticatePreAuth } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// ────────────────────────────────────────────────────────────────────
// Registration endpoints (accept both full tokens and pre-auth tokens)
// ────────────────────────────────────────────────────────────────────

/**
 * @route   POST /api/auth/webauthn/register/options
 * @desc    Generate WebAuthn registration options (challenge)
 * @access  Private / Pre-Auth (authenticated user or user setting up initial passkey)
 */
router.post('/register/options', authenticatePreAuth, webauthnController.getRegistrationOptions);

/**
 * @route   POST /api/auth/webauthn/register/verify
 * @desc    Verify WebAuthn registration response and store credential
 * @access  Private / Pre-Auth
 */
router.post(
  '/register/verify',
  authenticatePreAuth,
  [
    body('credential').notEmpty().withMessage('Credential response is required'),
  ],
  validate,
  webauthnController.verifyRegistration
);

// ────────────────────────────────────────────────────────────────────
// Authentication endpoints (public — used during login flow)
// ────────────────────────────────────────────────────────────────────

/**
 * @route   POST /api/auth/webauthn/authenticate/options
 * @desc    Generate WebAuthn authentication options (challenge)
 * @access  Public (called after password verification, before final session)
 */
router.post(
  '/authenticate/options',
  [
    body('userId').notEmpty().withMessage('userId is required'),
  ],
  validate,
  webauthnController.getAuthenticationOptions
);

/**
 * @route   POST /api/auth/webauthn/authenticate/verify
 * @desc    Verify WebAuthn authentication assertion
 * @access  Public (called during login flow)
 */
router.post(
  '/authenticate/verify',
  [
    body('userId').notEmpty().withMessage('userId is required'),
    body('credential').notEmpty().withMessage('Credential assertion is required'),
  ],
  validate,
  webauthnController.verifyAuthentication
);

// ────────────────────────────────────────────────────────────────────
// Credential management (require authenticated session)
// ────────────────────────────────────────────────────────────────────

/**
 * @route   GET /api/auth/webauthn/credentials
 * @desc    List registered authenticators for the current user
 * @access  Private
 */
router.get('/credentials', authenticate, webauthnController.listCredentials);

/**
 * @route   PATCH /api/auth/webauthn/credentials/:id
 * @desc    Rename a registered authenticator
 * @access  Private
 */
router.patch(
  '/credentials/:id',
  authenticate,
  [
    body('deviceName').trim().notEmpty().withMessage('Device name is required'),
  ],
  validate,
  webauthnController.renameCredential
);

/**
 * @route   DELETE /api/auth/webauthn/credentials/:id
 * @desc    Remove a registered authenticator
 * @access  Private
 */
router.delete('/credentials/:id', authenticate, webauthnController.removeCredential);

/**
 * @route   GET /api/auth/webauthn/credentials/check/:userId
 * @desc    Check if a user has any registered biometric credentials
 * @access  Public (needed during login flow before final auth)
 */
router.get('/credentials/check/:userId', webauthnController.hasCredentials);

module.exports = router;
