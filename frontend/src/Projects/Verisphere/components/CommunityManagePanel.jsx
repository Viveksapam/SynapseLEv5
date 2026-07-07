import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { putUpdateCommunity, fetchCommunityMembers, postBanMember, postUnbanMember } from '../api/communityApi';

const fieldStyle = {
  width: '100%', background: 'transparent', border: '1px solid var(--glass-border)',
  borderRadius: '6px', color: 'var(--v2-text-main)', padding: '6px 8px', fontSize: '0.8rem', boxSizing: 'border-box',
};

// Creator moderation tools: edit the community, manage member bans.
const CommunityManagePanel = ({ community, onUpdated }) => {
  const [boolOpenState, setBoolOpenState] = useState(false);
  const [strDescriptionState, setStrDescriptionState] = useState(community.strDescription || '');
  const [strRegisterState, setStrRegisterState] = useState(community.register);
  const [boolAnalysisState, setBoolAnalysisState] = useState(community.analysis_default);
  const [arrMembersState, setArrMembersState] = useState([]);
  const [boolSavingState, setBoolSavingState] = useState(false);

  useEffect(() => {
    if (boolOpenState) fetchCommunityMembers(community.id).then(setArrMembersState);
  }, [boolOpenState, community.id]);

  const handleSave = async () => {
    setBoolSavingState(true);
    try {
      await putUpdateCommunity(community.id, {
        strDescription: strDescriptionState, register: strRegisterState, analysis_default: boolAnalysisState,
      });
      if (onUpdated) onUpdated();
    } catch (objErr) {
      alert(objErr.message || 'Failed to save');
    } finally {
      setBoolSavingState(false);
    }
  };

  const handleBanToggle = async (objMember) => {
    try {
      if (objMember.status === 'banned') await postUnbanMember(community.id, objMember.user_id);
      else await postBanMember(community.id, objMember.user_id);
      setArrMembersState(await fetchCommunityMembers(community.id));
    } catch (objErr) {
      alert(objErr.message || 'Failed to update member');
    }
  };

  return (
    <div className="verisphere-sidebar-box" style={{ background: 'var(--glass-bg)' }}>
      <h3 onClick={() => setBoolOpenState(!boolOpenState)} style={{ cursor: 'pointer', margin: 0, fontSize: '0.95rem' }}>
        Manage community {boolOpenState ? '(hide)' : ''}
      </h3>
      {boolOpenState && (
        <div style={{ display: 'grid', gap: '10px', marginTop: '12px' }}>
          <textarea value={strDescriptionState} onChange={(e) => setStrDescriptionState(e.target.value)}
            placeholder="Description" style={{ ...fieldStyle, minHeight: '50px', resize: 'vertical' }} />
          <select value={strRegisterState} onChange={(e) => setStrRegisterState(e.target.value)} style={fieldStyle}>
            <option value="library">Library (rigor-first)</option>
            <option value="lounge">Lounge (casual)</option>
          </select>
          <label style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '0.8rem', color: 'var(--v2-text-main)', cursor: 'pointer' }}>
            <input type="checkbox" checked={boolAnalysisState} onChange={(e) => setBoolAnalysisState(e.target.checked)} />
            New posts default to analysis-open
          </label>
          <button onClick={handleSave} disabled={boolSavingState} className="verisphere-btn-primary" style={{ padding: '6px', fontSize: '0.8rem' }}>
            {boolSavingState ? 'Saving...' : 'Save changes'}
          </button>

          <p style={{ margin: '6px 0 0', fontSize: '0.75rem', letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--v2-text-muted)' }}>
            Members
          </p>
          {arrMembersState.map((objMember) => (
            <div key={objMember.user_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--v2-text-main)' }}>
              <span>
                {objMember.username || `user ${objMember.user_id}`}
                {objMember.role === 'creator' && <span style={{ color: 'var(--v2-text-muted)' }}> (creator)</span>}
                {objMember.status === 'banned' && <span style={{ color: '#ff7b72' }}> banned</span>}
              </span>
              {objMember.role !== 'creator' && (
                <button onClick={() => handleBanToggle(objMember)}
                  style={{ background: 'transparent', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--v2-text-muted)', cursor: 'pointer', fontSize: '0.7rem', padding: '2px 8px' }}>
                  {objMember.status === 'banned' ? 'Unban' : 'Ban'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

CommunityManagePanel.propTypes = {
  community: PropTypes.object.isRequired,
  onUpdated: PropTypes.func,
};

export default CommunityManagePanel;
