/**
 * Get the current WorkOS user from the session
 * @param {any} session 
 * @returns {Object|null} The user object or null if not authenticated
 */
export function getWorkOSUser(session) {
  return session.get('workos_user');
}

/**
 * Check if a user is authenticated with WorkOS
 * @param {any} session 
 * @returns {boolean} True if user is authenticated
 */
export function isWorkOSAuthenticated(session) {
  return Boolean(session.get('workos_user'));
}

/**
 * Require WorkOS authentication - throws if not authenticated
 * @param {any} session
 * @returns {Object} The user object
 */
export function requireWorkOSAuth(session) {
  const user = getWorkOSUser(session);
  if (!user) {
    throw new Response('Authentication required', { status: 401 });
  }
  return user;
}