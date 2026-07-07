import React, { useState, useEffect } from 'react';
import { fetchMyBadges, fetchMyRecap } from '../api/engagementApi';
import { profileCardStyle, profileLabelStyle } from './ProfileStyles';

// Positive-only recognition: badges signal, they never empower.
const BADGE_DEFINITIONS = {
  first_post: { name: 'First Post', description: 'Published a first post' },
  well_sourced: { name: 'Well-Sourced', description: 'A post held up under an AI analysis' },
  curious_mind: { name: 'Curious Mind', description: 'Requested a first analysis' },
};

const recapItemStyle = { fontFamily: 'var(--cr-font-mono)' };

const ProfileBadges = () => {
  const [arrBadgesState, setArrBadgesState] = useState([]);
  const [objRecapState, setObjRecapState] = useState(null);

  useEffect(() => {
    let boolCancelled = false;
    Promise.all([fetchMyBadges(), fetchMyRecap()]).then(([arrBadges, objRecap]) => {
      if (boolCancelled) return;
      setArrBadgesState(arrBadges);
      setObjRecapState(objRecap);
    });
    return () => { boolCancelled = true; };
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
      <div style={profileCardStyle}>
        <p style={{ ...profileLabelStyle, margin: '0 0 12px' }}>Badges</p>
        {arrBadgesState.length === 0 ? (
          <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--cr-text-muted)' }}>
            None yet. Post, request an analysis, or let your work speak.
          </p>
        ) : (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {arrBadgesState.map((objBadge) => {
              const objDef = BADGE_DEFINITIONS[objBadge.badge_slug] || { name: objBadge.badge_slug, description: '' };
              return (
                <span key={objBadge.badge_slug} title={objDef.description} style={{
                  fontSize: '12.5px', color: 'var(--cr-text-main)',
                  border: '1px solid var(--cr-border)', borderRadius: 'var(--cr-radius-chip)', padding: '6px 14px',
                }}>
                  {objDef.name}
                </span>
              );
            })}
          </div>
        )}
      </div>

      {objRecapState && (
        <div style={profileCardStyle}>
          <p style={{ ...profileLabelStyle, margin: '0 0 14px' }}>Last 30 days</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px 12px' }}>
            <div style={recapItemStyle}>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--cr-text-main)' }}>{objRecapState.reputation_earned}</div>
              <div style={{ fontSize: '11px', color: 'var(--cr-text-muted)', marginTop: '2px', whiteSpace: 'nowrap' }}>Contributions</div>
            </div>
            <div style={recapItemStyle}>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--cr-text-main)' }}>{objRecapState.posts}</div>
              <div style={{ fontSize: '11px', color: 'var(--cr-text-muted)', marginTop: '2px', whiteSpace: 'nowrap' }}>Posts</div>
            </div>
            <div style={recapItemStyle}>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--cr-text-main)' }}>{objRecapState.comments}</div>
              <div style={{ fontSize: '11px', color: 'var(--cr-text-muted)', marginTop: '2px', whiteSpace: 'nowrap' }}>Comments</div>
            </div>
            <div style={recapItemStyle}>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--cr-text-main)' }}>{objRecapState.analyses_requested}</div>
              <div style={{ fontSize: '11px', color: 'var(--cr-text-muted)', marginTop: '2px', whiteSpace: 'nowrap' }}>Analyses</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileBadges;
