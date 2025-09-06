import { useState } from 'react';
import { useAuth, useRequireAuth, useUserProfile } from '~/hooks/useUser';

export const meta = () => {
  return [
    { title: 'Profile | Good Neighbor Music' },
    { description: 'Manage your account settings and preferences' },
  ];
};

export default function Profile() {
  const user = useRequireAuth('/profile');
  const userProfile = useUserProfile();
  const { logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);

  if (!userProfile) {
    return (
        <div className="profile-loading">
          <div className="loading-spinner"></div>
          <p>Loading profile...</p>
        </div>
    );
  }

  return (
      <div className="profile-container">
        <div className="profile-header">
          <div className="profile-avatar">
            {userProfile.avatarUrl ? (
              <img src={userProfile.avatarUrl} alt={userProfile.getDisplayName()} />
            ) : (
              <div className="avatar-placeholder">
                {userProfile.initials}
              </div>
            )}
          </div>
          <div className="profile-info">
            <h1>{userProfile.getDisplayName()}</h1>
            <p className="profile-email">{userProfile.email}</p>
            <div className="profile-badges">
              <span className="badge verified">✓ Verified Account</span>
            </div>
          </div>
          <div className="profile-actions">
            <button 
              className="btn-secondary"
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </button>
            <button 
              className="btn-outline"
              onClick={logout}
            >
              Sign Out
            </button>
          </div>
        </div>

        <div className="profile-content">
          <div className="profile-section">
            <h2>Account Information</h2>
            <div className="profile-grid">
              <div className="profile-field">
                <label>User ID</label>
                <p>{userProfile.id}</p>
              </div>
              <div className="profile-field">
                <label>Email Address</label>
                <p>{userProfile.email}</p>
              </div>
              <div className="profile-field">
                <label>First Name</label>
                <p>{userProfile.firstName || 'Not provided'}</p>
              </div>
              <div className="profile-field">
                <label>Last Name</label>
                <p>{userProfile.lastName || 'Not provided'}</p>
              </div>
            </div>
          </div>

          <div className="profile-section">
            <h2>Account Activity</h2>
            <div className="activity-summary">
              <div className="activity-item">
                <span className="activity-icon">🎵</span>
                <div className="activity-details">
                  <h3>Music Preferences</h3>
                  <p>Track your favorite genres and artists</p>
                </div>
              </div>
              <div className="activity-item">
                <span className="activity-icon">🛒</span>
                <div className="activity-details">
                  <h3>Purchase History</h3>
                  <p>View your vinyl and merch orders</p>
                </div>
              </div>
              <div className="activity-item">
                <span className="activity-icon">💬</span>
                <div className="activity-details">
                  <h3>Agent Interactions</h3>
                  <p>Chat history with Groovy and Globby</p>
                </div>
              </div>
            </div>
          </div>

          <div className="profile-section">
            <h2>Preferences</h2>
            <div className="preferences-grid">
              <div className="preference-item">
                <input type="checkbox" id="newsletter" defaultChecked />
                <label htmlFor="newsletter">Newsletter Updates</label>
                <p>Receive updates about new releases and events</p>
              </div>
              <div className="preference-item">
                <input type="checkbox" id="notifications" defaultChecked />
                <label htmlFor="notifications">Push Notifications</label>
                <p>Get notified about agent messages and activities</p>
              </div>
              <div className="preference-item">
                <input type="checkbox" id="analytics" />
                <label htmlFor="analytics">Usage Analytics</label>
                <p>Help us improve by sharing anonymous usage data</p>
              </div>
            </div>
          </div>

          {isEditing && (
            <div className="profile-section editing">
              <h2>Edit Profile</h2>
              <form className="edit-form">
                <div className="form-row">
                  <div className="form-field">
                    <label htmlFor="firstName">First Name</label>
                    <input 
                      type="text" 
                      id="firstName" 
                      defaultValue={userProfile.firstName} 
                    />
                  </div>
                  <div className="form-field">
                    <label htmlFor="lastName">Last Name</label>
                    <input 
                      type="text" 
                      id="lastName" 
                      defaultValue={userProfile.lastName} 
                    />
                  </div>
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn-primary">
                    Save Changes
                  </button>
                  <button 
                    type="button" 
                    className="btn-secondary"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
  );
}