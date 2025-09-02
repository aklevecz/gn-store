import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { useUserContext } from '~/contexts/UserContext';

/**
 * Hook to get the current user and authentication status
 * @returns {Object} User object with authentication status
 */
export function useUser() {
  const { user, isAuthenticated, isLoading } = useUserContext();
  
  return {
    user,
    isAuthenticated,
    isLoading,
    // Computed properties for convenience
    displayName: user ? `${user.firstName} ${user.lastName}`.trim() : null,
    initials: user ? 
      `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() : 
      null,
  };
}

/**
 * Hook to get authentication methods
 * @returns {Object} Authentication methods
 */
export function useAuth() {
  const { login, logout, refreshSession } = useUserContext();
  
  return {
    login,
    logout,
    refreshSession,
  };
}

/**
 * Hook that requires authentication and redirects if not authenticated
 * @param {string} redirectTo - Path to redirect to after login (defaults to current path)
 * @returns {Object} User object if authenticated
 */
export function useRequireAuth(redirectTo) {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, login } = useUserContext();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      login(redirectTo);
    }
  }, [isLoading, isAuthenticated, login, redirectTo]);

  return user;
}

/**
 * Hook to get formatted user profile data
 * @returns {Object} Formatted user profile
 */
export function useUserProfile() {
  const { user } = useUserContext();
  
  return useMemo(() => {
    if (!user) return null;
    
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: `${user.firstName} ${user.lastName}`.trim(),
      initials: `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase(),
      // Avatar URL - you can customize this based on your needs
      avatarUrl: null, // Could integrate with Gravatar or other avatar service
      // Helper methods
      hasName: Boolean(user.firstName || user.lastName),
      getDisplayName: () => {
        if (user.firstName || user.lastName) {
          return `${user.firstName} ${user.lastName}`.trim();
        }
        return user.email;
      },
    };
  }, [user]);
}

/**
 * Hook to check if user has specific permissions
 * @param {string|string[]} permissions - Permission(s) to check
 * @returns {boolean} Whether user has the permission(s)
 */
export function usePermissions(permissions) {
  const { user } = useUserContext();
  
  return useMemo(() => {
    if (!user) return false;
    
    // For now, just check if user is authenticated
    // You can extend this to check specific permissions from user object
    // For example, if WorkOS provides roles/permissions:
    // return user.permissions?.includes(permission);
    
    return true; // All authenticated users have access for now
  }, [user]);
}