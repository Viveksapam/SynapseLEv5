import React, { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import '../components/AuthModal.css';

const ActivateAccountPage = ({ authHook, onOpenLogin }) => {
  const { uid, token } = useParams();
  const { handleActivate } = authHook;
  const [status, setStatus] = useState('activating');
  const [error, setError] = useState('');
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;
    handleActivate(uid, token)
      .then(() => setStatus('success'))
      .catch((err) => {
        setError(err.message);
        setStatus('error');
      });
  }, [uid, token, handleActivate]);

  return (
    <div className="auth-modal-overlay" style={{ position: 'fixed' }}>
      <div className="auth-modal" style={{ textAlign: 'center' }}>
        <h2>Account Activation</h2>
        {status === 'activating' && <p>Activating your account...</p>}
        {status === 'success' && (
          <>
            <div className="auth-error" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
              Account activated. You can now log in.
            </div>
            <button className="auth-btn" onClick={onOpenLogin}>Log in</button>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="auth-error">{error || 'This activation link is invalid or has expired.'}</div>
            <p className="auth-toggle"><Link to="/" style={{ color: 'inherit' }}>Back to home</Link></p>
          </>
        )}
      </div>
    </div>
  );
};

export default ActivateAccountPage;
