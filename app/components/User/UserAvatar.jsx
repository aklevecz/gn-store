import { useUser } from '~/hooks/useUser';

/**
 * UserAvatar component that displays user initials or image
 * @param {Object} props
 * @param {number} props.size - Size of the avatar in pixels (default: 40)
 * @param {string} props.className - Additional CSS classes
 */
export function UserAvatar({ size = 40, className = '' }) {
  const { user, initials } = useUser();
  
  if (!user) return null;
  
  // Generate background color based on user ID for consistency
  const getBackgroundColor = (id) => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#6C5CE7', '#A8E6CF', '#FFD3B6'
    ];
    const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };
  
  const backgroundColor = getBackgroundColor(user.id);
  
  return (
    <div 
      className={`user-avatar ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontWeight: 'bold',
        fontSize: size * 0.4,
        textTransform: 'uppercase',
        userSelect: 'none',
        cursor: 'default'
      }}
      title={`${user.firstName} ${user.lastName}`.trim() || user.email}
    >
      {initials || user.email[0].toUpperCase()}
    </div>
  );
}