import React from 'react';
import PropTypes from 'prop-types';
import PostCard from './PostCard';
import CreatePostForm from './CreatePostForm';
import { profileCardStyle, profileLabelStyle } from './ProfileStyles';

const ProfileActivity = ({ arrPosts, boolIsLoading, onPostCreated }) => (
  <div className="vs-profile-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 240px', gap: '20px' }}>
    <div>
      <CreatePostForm onPostCreated={onPostCreated} />
      <p style={{ ...profileLabelStyle, margin: '0 0 16px' }}>Your Posts</p>
      {boolIsLoading ? (
        <div className="verisphere-empty-state">Loading…</div>
      ) : arrPosts.length === 0 ? (
        <div className="verisphere-empty-state">
          <p>You haven&apos;t posted anything yet.</p>
        </div>
      ) : (
        <div className="verisphere-post-list">
          {arrPosts.map((objPost) => <PostCard key={objPost.id} objPost={objPost} />)}
        </div>
      )}
    </div>
    <div>
      <div style={profileCardStyle}>
        <p style={{ ...profileLabelStyle, margin: '0 0 12px' }}>Statistics</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: 'var(--cr-text-muted)', fontSize: '0.88rem' }}>Total Posts</span>
          <span style={{ color: 'var(--cr-text-main)', fontSize: '1.1rem', fontWeight: 700 }}>
            {boolIsLoading ? '—' : arrPosts.length}
          </span>
        </div>
      </div>
    </div>
  </div>
);

ProfileActivity.propTypes = {
  arrPosts: PropTypes.array.isRequired,
  boolIsLoading: PropTypes.bool.isRequired,
  onPostCreated: PropTypes.func,
};

export default ProfileActivity;
