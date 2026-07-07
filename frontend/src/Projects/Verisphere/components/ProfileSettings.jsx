import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { changePassword, updateNotificationSettings, deactivateAccount } from '../../../api/userApi';
import { profileCardStyle, profileLabelStyle, profileInputStyle } from './ProfileStyles';

const toggleRowStyle = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderTop: '1px solid var(--cr-border)' };
const Toggle = ({ checked, onChange }) => (
  <button type="button" onClick={onChange} style={{
    width: '40px', height: '22px', borderRadius: '999px', border: '1px solid var(--cr-border)',
    background: checked ? 'var(--cr-text-main)' : 'var(--cr-surface-raised)', position: 'relative',
    cursor: 'pointer', flexShrink: 0, padding: 0,
  }}>
    <span style={{
      position: 'absolute', top: '2px', left: checked ? '20px' : '2px', width: '16px', height: '16px',
      borderRadius: '50%', background: 'var(--cr-surface)', transition: 'left 0.15s ease',
      boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
    }} />
  </button>
);
Toggle.propTypes = { checked: PropTypes.bool.isRequired, onChange: PropTypes.func.isRequired };

// Every control here is real - no fake toggles (platform ethos + settings-trust research).
const ProfileSettings = ({ user, strToken, onUserChanged, onDeactivated }) => {
  const [strCurrentState, setStrCurrentState] = useState('');
  const [strNewState, setStrNewState] = useState('');
  const [objPrefsState, setObjPrefsState] = useState({
    notify_replies: user.notify_replies !== false,
    notify_reactions: user.notify_reactions !== false,
    notify_analysis: user.notify_analysis !== false,
  });
  const [strConfirmState, setStrConfirmState] = useState('');
  const [strDeactivatePwState, setStrDeactivatePwState] = useState('');
  const [strMessageState, setStrMessageState] = useState('');

  const handlePassword = async (e) => {
    e.preventDefault();
    try {
      await changePassword(strCurrentState, strNewState, strToken);
      setStrCurrentState(''); setStrNewState('');
      setStrMessageState('Password updated.');
    } catch (objErr) {
      setStrMessageState(objErr.response?.data?.detail || 'Password change failed.');
    }
  };

  const handlePrefToggle = async (strField) => {
    const objNext = { ...objPrefsState, [strField]: !objPrefsState[strField] };
    setObjPrefsState(objNext);
    try {
      const objUser = await updateNotificationSettings(objNext, strToken);
      if (onUserChanged) onUserChanged(objUser);
    } catch {
      setObjPrefsState(objPrefsState);
      setStrMessageState('Failed to save notification settings.');
    }
  };

  const handleDeactivate = async (e) => {
    e.preventDefault();
    if (strConfirmState !== user.username) {
      setStrMessageState('Type your username exactly to confirm deactivation.');
      return;
    }
    try {
      await deactivateAccount(strDeactivatePwState, strToken);
      if (onDeactivated) onDeactivated();
    } catch (objErr) {
      setStrMessageState(objErr.response?.data?.detail || 'Deactivation failed.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {strMessageState && <p style={{ margin: 0, fontSize: '13px', color: 'var(--cr-text-main)' }}>{strMessageState}</p>}

      <div style={profileCardStyle}>
        <p style={{ ...profileLabelStyle, margin: '0 0 14px' }}>Change Password</p>
        <form onSubmit={handlePassword} style={{ display: 'grid', gap: '10px', maxWidth: '360px' }}>
          <input type="password" placeholder="Current password" value={strCurrentState} required
            onChange={(e) => setStrCurrentState(e.target.value)} style={profileInputStyle} />
          <input type="password" placeholder="New password (8+ characters)" value={strNewState} required minLength={8}
            onChange={(e) => setStrNewState(e.target.value)} style={profileInputStyle} />
          <button type="submit" className="verisphere-btn-primary" style={{ padding: '8px' }}>Update password</button>
        </form>
      </div>

      <div style={profileCardStyle}>
        <p style={{ ...profileLabelStyle, margin: '0 0 4px' }}>Notifications</p>
        <div style={toggleRowStyle}>
          <div style={{ fontSize: '13.5px', color: 'var(--cr-text-main)' }}>Comments and replies on my posts</div>
          <Toggle checked={objPrefsState.notify_replies} onChange={() => handlePrefToggle('notify_replies')} />
        </div>
        <div style={toggleRowStyle}>
          <div style={{ fontSize: '13.5px', color: 'var(--cr-text-main)' }}>Reactions on my posts</div>
          <Toggle checked={objPrefsState.notify_reactions} onChange={() => handlePrefToggle('notify_reactions')} />
        </div>
        <div style={toggleRowStyle}>
          <div style={{ fontSize: '13.5px', color: 'var(--cr-text-main)' }}>AI analyses requested on my posts</div>
          <Toggle checked={objPrefsState.notify_analysis} onChange={() => handlePrefToggle('notify_analysis')} />
        </div>
      </div>

      <div style={{ ...profileCardStyle, border: '1px solid var(--cr-danger)' }}>
        <p style={{ ...profileLabelStyle, margin: '0 0 4px', color: 'var(--cr-danger)' }}>Danger Zone</p>
        <p style={{ margin: '0 0 14px', fontSize: '12.5px', color: 'var(--cr-text-muted)' }}>
          Deactivating signs you out everywhere and disables login. Your posts and comments remain visible.
        </p>
        <form onSubmit={handleDeactivate} style={{ display: 'grid', gap: '10px', maxWidth: '360px' }}>
          <input type="text" placeholder={`Type "${user.username}" to confirm`} value={strConfirmState}
            onChange={(e) => setStrConfirmState(e.target.value)} style={profileInputStyle} />
          <input type="password" placeholder="Your password" value={strDeactivatePwState} required
            onChange={(e) => setStrDeactivatePwState(e.target.value)} style={profileInputStyle} />
          <button type="submit" style={{
            padding: '7px 18px', fontSize: '13px', fontWeight: 600, fontFamily: 'var(--cr-font-heading)',
            background: 'transparent', border: '1px solid var(--cr-danger)', borderRadius: 'var(--cr-radius-input)',
            color: 'var(--cr-danger)', cursor: 'pointer', display: 'inline-block',
          }}>
            Deactivate account
          </button>
        </form>
      </div>
    </div>
  );
};

ProfileSettings.propTypes = {
  user: PropTypes.object.isRequired,
  strToken: PropTypes.string,
  onUserChanged: PropTypes.func,
  onDeactivated: PropTypes.func,
};

export default ProfileSettings;
