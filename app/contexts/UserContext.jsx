import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router';

/**
 * @typedef {Object} User
 * @property {string} id - User ID from WorkOS
 * @property {string} email - User email
 * @property {string} firstName - User first name
 * @property {string} lastName - User last name
 */

/**
 * @typedef {Object} UserContextValue
 * @property {User|null} user - Current user object
 * @property {boolean} isAuthenticated - Whether user is authenticated
 * @property {boolean} isLoading - Whether authentication state is loading
 * @property {Function} login - Navigate to login
 * @property {Function} logout - Logout user
 * @property {Function} updateUser - Update user data
 * @property {Function} refreshSession - Refresh user session
 */

const UserContext = createContext(null);

/**
 * UserProvider component that wraps the app and provides user authentication state
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components
 * @param {User|null} props.initialUser - Initial user data from server
 */
export function UserProvider({ children, initialUser = null }) {
  const [user, setUser] = useState(initialUser);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Check if user is authenticated
  const isAuthenticated = useMemo(() => Boolean(user), [user]);

  // Login function - navigates to WorkOS login
  const login = useCallback((redirectTo = location.pathname) => {
    // Store the redirect path in session storage for post-login redirect
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('authRedirect', redirectTo);
    }
    navigate('/auth/login');
  }, [navigate, location.pathname]);

  // Logout function
  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      // Navigate to logout endpoint
      window.location.href = '/auth/logout';
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoading(false);
    }
  }, []);

  // Update user data
  const updateUser = useCallback((userData) => {
    setUser(userData);
  }, []);

  // Refresh session from server
  const refreshSession = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/auth/session');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Session refresh error:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle post-login redirect
  useEffect(() => {
    if (isAuthenticated && typeof window !== 'undefined') {
      const redirectPath = sessionStorage.getItem('authRedirect');
      if (redirectPath) {
        sessionStorage.removeItem('authRedirect');
        navigate(redirectPath);
      }
    }
  }, [isAuthenticated, navigate]);

  // Create context value with memoization for performance
  const contextValue = useMemo(() => ({
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    updateUser,
    refreshSession,
  }), [user, isAuthenticated, isLoading, login, logout, updateUser, refreshSession]);

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
}

/**
 * Hook to access user context
 * @returns {UserContextValue} User context value
 * @throws {Error} If used outside of UserProvider
 */
export function useUserContext() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUserContext must be used within a UserProvider');
  }
  return context;
}