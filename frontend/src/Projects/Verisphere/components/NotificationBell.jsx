import React from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';

const NOTIFICATION_TEXT = {
  comment_on_post: 'commented on your post',
  reply_to_comment: 'replied to your comment',
  reaction_received: 'reacted to your post',
};

const formatWhen = (strIso) => {
  const numMinutes = Math.round((Date.now() - new Date(`${strIso}Z`).getTime()) / 60000);
  if (numMinutes < 1) return 'just now';
  if (numMinutes < 60) return `${numMinutes}m ago`;
  if (numMinutes < 1440) return `${Math.round(numMinutes / 60)}h ago`;
  return `${Math.round(numMinutes / 1440)}d ago`;
};

const NotificationBell = ({ boolIsLoggedIn }) => {
  const navigate = useNavigate();
  const { numUnreadState, arrNotificationsState, boolPanelOpenState, togglePanel, closePanel } = useNotifications(boolIsLoggedIn);

  if (!boolIsLoggedIn) return null;

  const handleRowClick = (objNotification) => {
    closePanel();
    if (objNotification.blog_id) navigate(`/verisphere/post/${objNotification.blog_id}/comments`);
  };

  return (
    <div style={{ position: 'relative', display: 'flex' }}>
      <button
        onClick={togglePanel}
        className="v2-nav-btn secondary"
        style={{ padding: '8px', borderRadius: '50%', minWidth: 'auto', display: 'flex', position: 'relative' }}
        title="Notifications"
        aria-label={`Notifications${numUnreadState ? ` (${numUnreadState} unread)` : ''}`}
      >
        <Bell size={20} />
        {numUnreadState > 0 && (
          <span style={{
            position: 'absolute', top: '2px', right: '2px', minWidth: '16px', height: '16px',
            borderRadius: '8px', background: '#e5534b', color: '#fff', fontSize: '0.65rem',
            fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 4px', lineHeight: 1,
          }}>
            {numUnreadState > 9 ? '9+' : numUnreadState}
          </span>
        )}
      </button>

      {boolPanelOpenState && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 10px)', right: 0, width: '300px', maxHeight: '360px',
          overflowY: 'auto', zIndex: 70, background: 'var(--glass-bg, rgba(20,20,28,0.95))',
          border: '1px solid var(--glass-border, rgba(255,255,255,0.1))', borderRadius: '12px',
          backdropFilter: 'blur(20px)', padding: '0.5rem',
        }}>
          {arrNotificationsState.length === 0 ? (
            <p style={{ margin: 0, padding: '0.8rem', fontSize: '0.85rem', color: 'var(--v2-text-muted)' }}>
              Nothing yet. When someone responds to you, it shows up here.
            </p>
          ) : (
            arrNotificationsState.map((objNotification) => (
              <button
                key={objNotification.id}
                onClick={() => handleRowClick(objNotification)}
                style={{
                  display: 'block', width: '100%', textAlign: 'left', background: 'transparent',
                  border: 'none', borderRadius: '8px', padding: '0.6rem 0.7rem', cursor: 'pointer',
                  color: 'var(--v2-text-main)', fontSize: '0.85rem', lineHeight: 1.4,
                  opacity: objNotification.read_at ? 0.65 : 1,
                }}
              >
                <strong>{objNotification.actor_username || 'Someone'}</strong>{' '}
                {NOTIFICATION_TEXT[objNotification.type] || 'interacted with you'}
                <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--v2-text-muted)', marginTop: '2px' }}>
                  {formatWhen(objNotification.created_at)}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

NotificationBell.propTypes = {
  boolIsLoggedIn: PropTypes.bool,
};

export default NotificationBell;
