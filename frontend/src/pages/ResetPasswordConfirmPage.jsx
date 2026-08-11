import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import '../components/AuthModal.css';

const ResetPasswordConfirmPage = ({ authHook }) => {
  const { uid, token } = useParams();
  const navigate = useNavigate();
  const { handleResetPassword } = authHook;

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      await handleResetPassword(uid, token, newPassword);
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-modal-overlay" style={{ position: 'fixed' }}>
      <div className="auth-modal">
        <h2>Reset Password</h2>

        {error && <div className="auth-error">{error}</div>}

        {success ? (
          <>
            <div className="auth-error" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
              Password reset. You can now log in.
            </div>
            <button onClick={() => navigate('/')}>Go to home</button>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            <input
              type="password"
              placeholder="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <button type="submit" disabled={isLoading}>
              {isLoading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}

        {!success && (
          <p className="auth-toggle"><Link to="/" style={{ color: 'inherit' }}>Back to home</Link></p>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordConfirmPage;
