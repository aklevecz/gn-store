import { useState, useRef, useEffect } from 'react';
import { NavLink } from 'react-router';
import { useUser, useAuth } from '~/hooks/useUser';
import { UserAvatar } from './UserAvatar';

/**
 * UserMenu component with dropdown
 * @param {Object} props
 * @param {string} props.className - Additional CSS classes
 */
export function UserMenu({ className = '' }) {
  const { user, displayName } = useUser();
  const { logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  
  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);
  
  if (!user) {
    return (
      <NavLink 
        to="/auth/login" 
        className={`sign-in-link ${className}`}
        style={{ textDecoration: 'none' }}
      >
        Sign in
      </NavLink>
    );
  }
  
  return (
    <div className={`user-menu ${className}`} ref={menuRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '4px'
        }}
      >
        <UserAvatar size={32} />
        <span style={{ fontSize: '14px' }}>{displayName || user.email}</span>
        <svg 
          width="12" 
          height="12" 
          viewBox="0 0 12 12" 
          style={{ 
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s'
          }}
        >
          <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="2" fill="none" />
        </svg>
      </button>
      
      {isOpen && (
        <div 
          className="user-menu-dropdown"
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '8px',
            background: 'white',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            minWidth: '200px',
            zIndex: 1000
          }}
        >
          <div style={{ padding: '12px', borderBottom: '1px solid #e0e0e0' }}>
            <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
              {user.firstName && user.lastName ? 
                `${user.firstName} ${user.lastName}` : 
                user.email
              }
            </div>
            <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
              {user.email}
            </div>
          </div>
          
          <div style={{ padding: '8px 0' }}>
            <NavLink
              to="/account/profile"
              onClick={() => setIsOpen(false)}
              style={{
                display: 'block',
                padding: '8px 16px',
                textDecoration: 'none',
                color: '#333',
                fontSize: '14px',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.background = '#f5f5f5'}
              onMouseLeave={(e) => e.target.style.background = 'transparent'}
            >
              Profile Settings
            </NavLink>
            
            <NavLink
              to="/account/orders"
              onClick={() => setIsOpen(false)}
              style={{
                display: 'block',
                padding: '8px 16px',
                textDecoration: 'none',
                color: '#333',
                fontSize: '14px',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.background = '#f5f5f5'}
              onMouseLeave={(e) => e.target.style.background = 'transparent'}
            >
              Order History
            </NavLink>
            
            <hr style={{ margin: '8px 16px', border: 'none', borderTop: '1px solid #e0e0e0' }} />
            
            <button
              onClick={() => {
                setIsOpen(false);
                logout();
              }}
              style={{
                display: 'block',
                width: '100%',
                padding: '8px 16px',
                textAlign: 'left',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#333',
                fontSize: '14px',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.background = '#f5f5f5'}
              onMouseLeave={(e) => e.target.style.background = 'transparent'}
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}