import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { profileCardStyle, profileLabelStyle, profileInputStyle } from './ProfileStyles';
import { fetchMyReputation } from '../api/engagementApi';
import ProfileBadges from './ProfileBadges';

const useMyReputation = () => {
  const [numReputationState, setNumReputationState] = useState(null);
  useEffect(() => {
    let boolCancelled = false;
    fetchMyReputation().then((data) => {
      if (!boolCancelled) setNumReputationState(data.total);
    });
    return () => { boolCancelled = true; };
  }, []);
  return numReputationState;
};

const ProfileOverview = ({ user, isEditing, editForm, setEditForm, postCount, isLoadingPosts }) => {
  const numReputationState = useMyReputation();
  return (
  <div className="vs-profile-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 240px', gap: '20px' }}>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={profileCardStyle}>
        <p style={{ ...profileLabelStyle, margin: '0 0 12px' }}>About Me</p>
        {isEditing ? (
          <textarea
            value={editForm.strBio}
            onChange={(e) => setEditForm({ ...editForm, strBio: e.target.value })}
            placeholder="Tell the community about your expertise…"
            style={{ ...profileInputStyle, width: '100%', minHeight: '90px', resize: 'vertical', boxSizing: 'border-box', flex: 'none' }}
          />
        ) : (
          <p style={{ color: 'var(--cr-text-muted)', lineHeight: '1.6', margin: 0, fontSize: '0.9rem' }}>
            {user.strBio || 'No biography provided yet.'}
          </p>
        )}
      </div>

      <div style={profileCardStyle}>
        <p style={{ ...profileLabelStyle, margin: '0 0 12px' }}>Account Details</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--cr-border)' }}>
          <span style={{ color: 'var(--cr-text-muted)', fontSize: '0.88rem' }}>Email</span>
          <span style={{ color: 'var(--cr-text-main)', fontSize: '0.88rem' }}>{user.email}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0' }}>
          <span style={{ color: 'var(--cr-text-muted)', fontSize: '0.88rem' }}>Status</span>
          <span style={{ color: 'var(--cr-text-main)', fontSize: '0.88rem', fontWeight: 600 }}>
            {user.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>
    </div>

    <div>
      <div style={profileCardStyle}>
        <p style={{ ...profileLabelStyle, margin: '0 0 12px' }}>Statistics</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 0 10px', borderBottom: '1px solid var(--cr-border)' }}>
          <span style={{ color: 'var(--cr-text-muted)', fontSize: '0.88rem' }}>Posts</span>
          <span style={{ color: 'var(--cr-text-main)', fontSize: '1.1rem', fontWeight: 700 }}>
            {isLoadingPosts ? '—' : postCount}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0 0' }}>
          <span style={{ color: 'var(--cr-text-muted)', fontSize: '0.88rem' }}>Contributions</span>
          <span style={{ color: 'var(--cr-text-main)', fontSize: '1.1rem', fontWeight: 700 }}>
            {numReputationState === null ? '—' : numReputationState}
          </span>
        </div>
      </div>
      <ProfileBadges />
    </div>
  </div>
  );
};

ProfileOverview.propTypes = {
  user: PropTypes.object.isRequired,
  isEditing: PropTypes.bool.isRequired,
  editForm: PropTypes.object.isRequired,
  setEditForm: PropTypes.func.isRequired,
  postCount: PropTypes.number.isRequired,
  isLoadingPosts: PropTypes.bool.isRequired,
};

export default ProfileOverview;
