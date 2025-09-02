import { useRequireAuth } from '~/hooks/useUser';

/**
 * AuthGuard component that protects routes requiring authentication
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components to render if authenticated
 * @param {string} props.redirectTo - Custom redirect path after login
 * @param {React.ReactNode} props.fallback - Fallback component to show while checking auth
 */
export function AuthGuard({ children, redirectTo, fallback = <LoadingSpinner /> }) {
  const user = useRequireAuth(redirectTo);
  
  if (!user) {
    return fallback;
  }
  
  return children;
}

/**
 * Simple loading spinner component
 */
function LoadingSpinner() {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '200px'
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        border: '4px solid #f3f3f3',
        borderTop: '4px solid #333',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }}>
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    </div>
  );
}