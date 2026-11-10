import User from '../models/User.model.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { getFirebaseAuth } from '../config/firebase.js';
import { hasAllowedRole } from '../utils/roleAccess.js';

export const protect = asyncHandler(async (req, res, next) => {
  const authorization = req.headers.authorization;
  const token = authorization?.startsWith('Bearer ')
    ? authorization.slice(7)
    : null;

  if (!token) {
    throw new ApiError(401, 'Sign in to continue.');
  }

  let firebaseAuth;
  try {
    firebaseAuth = getFirebaseAuth();
  } catch {
    throw new ApiError(503, 'Firebase Authentication is not configured on the server.');
  }

  let identity;
  try {
    identity = await firebaseAuth.verifyIdToken(token, true);
  } catch {
    throw new ApiError(401, 'Your session is invalid or has expired. Please sign in again.');
  }

  let user = await User.findOne({ firebaseUid: identity.uid });

  // Existing staff accounts can be linked on first sign-in, but only after
  // Firebase confirms that the person controls the account's email address.
  if (!user && identity.email && identity.email_verified) {
    const matchingEmail = await User.findOne({ email: identity.email.toLowerCase() })
      .select('+firebaseUid');

    if (matchingEmail && !matchingEmail.firebaseUid) {
      matchingEmail.firebaseUid = identity.uid;
      await matchingEmail.save({ validateBeforeSave: false });
      user = matchingEmail;
    }
  }

  if (!user) {
    throw new ApiError(403, 'Your account has not been set up. Contact your HR team.');
  }

  if (user.status !== 'active') {
    throw new ApiError(403, 'Your account is inactive. Contact your HR team.');
  }

  req.firebaseUser = identity;
  req.user = user;
  next();
});

export const authorize = (...roles) => (req, res, next) => {
  if (!hasAllowedRole(req.user.role, roles)) {
    throw new ApiError(403, `Access denied. Required roles: ${roles.join(', ')}`);
  }
  next();
};
