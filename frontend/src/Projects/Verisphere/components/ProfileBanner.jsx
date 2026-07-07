import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import { profileInputStyle, profileBtnBase, formatDate } from './ProfileStyles';

const ProfileBanner = ({ user, isEditing, editForm, setEditForm, isSaving, onSave, onCancel, onStartEdit }) => {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const objFile = e.target.files[0];
    if (!objFile) return;
    if (objFile.size > 2 * 1024 * 1024) { alert('Image too large – max 2 MB'); return; }
    const reader = new FileReader();
    reader.onloadend = () => setEditForm((prev) => ({ ...prev, strProfilePicUrl: reader.result }));
    reader.readAsDataURL(objFile);
  };

  const strAvatarUrl = isEditing ? editForm.strProfilePicUrl : user.strProfilePicUrl;
  const strDisplayName = (user.first_name || user.last_name)
    ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
    : user.username;
  const strRole = user.is_superuser ? 'Admin' : (user.is_staff ? 'Staff' : null);

  return (
    <div style={{
      background: 'var(--cr-surface)', border: '1px solid var(--cr-border)', borderRadius: 'var(--cr-radius-card)',
      boxShadow: 'var(--cr-shadow-card)', overflow: 'hidden', marginBottom: '20px',
    }} aria-label="Profile banner">
      <div style={{ height: '64px', background: 'linear-gradient(120deg, var(--cr-library-bg), var(--cr-lounge-bg))' }} />
      <div className="vs-profile-banner" style={{ padding: '0 24px 22px', position: 'relative' }}>
        <div style={{ position: 'absolute', top: '16px', right: '24px', display: 'flex', gap: '8px' }}>
          {isEditing ? (
            <>
              <button onClick={onCancel} style={{ ...profileBtnBase, border: '1px solid var(--cr-border)', background: 'transparent', color: 'var(--cr-text-muted)' }}>Cancel</button>
              <button onClick={onSave} disabled={isSaving} style={{ ...profileBtnBase, border: 'none', background: 'var(--cr-text-main)', color: 'var(--cr-bg)' }}>
                {isSaving ? 'Saving…' : 'Save'}
              </button>
            </>
          ) : (
            <button onClick={onStartEdit} style={{ ...profileBtnBase, border: '1px solid var(--cr-border)', background: 'transparent', color: 'var(--cr-text-main)' }}>Edit Profile</button>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', marginTop: '-30px', marginBottom: '14px' }}>
          <div
            onClick={() => isEditing && fileInputRef.current?.click()}
            style={{
              width: '76px', height: '76px', borderRadius: '50%', flexShrink: 0,
              background: strAvatarUrl ? `url(${strAvatarUrl}) center/cover` : 'var(--cr-surface-raised)',
              border: '3px solid var(--cr-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--cr-font-heading)', fontSize: '24px', fontWeight: 700, color: 'var(--cr-text-main)',
              cursor: isEditing ? 'pointer' : 'default', position: 'relative', userSelect: 'none',
            }}
          >
            {!strAvatarUrl && user.username.charAt(0).toUpperCase()}
            {isEditing && (
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', color: '#fff', letterSpacing: '0.06em' }}>
                UPLOAD
              </div>
            )}
          </div>
          <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleFileChange} />

          <div style={{ flex: 1, minWidth: 0, paddingBottom: '4px' }}>
            {isEditing ? (
              <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                <input type="text" value={editForm.first_name} placeholder="First name" onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })} style={profileInputStyle} />
                <input type="text" value={editForm.last_name} placeholder="Last name" onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })} style={profileInputStyle} />
              </div>
            ) : (
              <h2 style={{ margin: '0 0 3px', fontSize: '22px', fontFamily: 'var(--cr-font-heading)', color: 'var(--cr-text-main)', fontWeight: 700, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {strDisplayName}
              </h2>
            )}
            <p style={{ margin: 0, color: 'var(--cr-text-muted)', fontSize: '12.5px' }}>@{user.username}</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'nowrap' }}>
          {strRole && (
            <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 'var(--cr-radius-badge)', border: '1px solid var(--cr-border)', color: 'var(--cr-text-muted)', fontFamily: 'var(--cr-font-mono)', fontSize: '10.5px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
              {strRole}
            </span>
          )}
          <span style={{ color: 'var(--cr-text-muted)', fontFamily: 'var(--cr-font-mono)', fontSize: '11.5px', whiteSpace: 'nowrap' }}>
            Joined {formatDate(user.date_joined)}
          </span>
        </div>
      </div>
    </div>
  );
};

ProfileBanner.propTypes = {
  user: PropTypes.object.isRequired,
  isEditing: PropTypes.bool.isRequired,
  editForm: PropTypes.object.isRequired,
  setEditForm: PropTypes.func.isRequired,
  isSaving: PropTypes.bool.isRequired,
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  onStartEdit: PropTypes.func.isRequired,
};

export default ProfileBanner;
