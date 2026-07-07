import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import './AuthModal.css';

const AuthModal = ({ onClose, useAuthHook }) => {
  const {
    handleLogin, handleRegister, handleVerify, handleResendCode,
    handleForgotPassword, handleResetPassword,
  } = useAuthHook;
  const [viewState, setViewState] = useState('login'); // 'login', 'register', 'verify', 'forgot', 'reset'

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validateRegistration = () => {
    if (username.trim().length < 3) return 'Username must be at least 3 characters';
    if (!/^[a-zA-Z0-9_-]+$/.test(username.trim())) return 'Username may only contain letters, numbers, - and _';
    if (!firstName.trim()) return 'First name cannot be blank';
    if (!lastName.trim()) return 'Last name cannot be blank';
    if (password.length < 8) return 'Password must be at least 8 characters';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (viewState === 'register') {
      const validationError = validateRegistration();
      if (validationError) {
        setError(validationError);
        return;
      }
    }
    if (viewState === 'reset' && newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);
    try {
      if (viewState === 'login') {
        await handleLogin(username, password);
        onClose();
      } else if (viewState === 'register') {
        await handleRegister({
          username: username.trim(),
          email,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          password,
        });
        setSuccess('Check your email for a 6-digit verification code.');
        setViewState('verify');
      } else if (viewState === 'verify') {
        await handleVerify(username, otp);
        onClose();
      } else if (viewState === 'forgot') {
        await handleForgotPassword(username.trim());
        setSuccess('If that account exists, a reset code has been sent.');
        setOtp('');
        setViewState('reset');
      } else if (viewState === 'reset') {
        await handleResetPassword(username.trim(), otp, newPassword);
        setPassword(''); setOtp(''); setNewPassword('');
        setSuccess('Password reset. You can now log in.');
        setViewState('login');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setSuccess('');
    try {
      if (viewState === 'reset') {
        await handleForgotPassword(username.trim());
      } else {
        await handleResendCode(username);
      }
      setSuccess('A new code has been sent.');
    } catch (err) {
      setError(err.message);
    }
  };

  const getTitle = () => {
    if (viewState === 'login') return 'Welcome Back';
    if (viewState === 'register') return 'Create Account';
    if (viewState === 'verify') return 'Verify Email';
    if (viewState === 'forgot') return 'Reset Password';
    return 'Enter Reset Code';
  };

  const getButtonText = () => {
    if (isLoading) return 'Processing...';
    if (viewState === 'login') return 'Login';
    if (viewState === 'register') return 'Register';
    if (viewState === 'verify') return 'Verify Code';
    if (viewState === 'forgot') return 'Send Reset Code';
    return 'Reset Password';
  };

  return createPortal(
    <div className="auth-modal-overlay">
      <div className="auth-modal">
        <button className="auth-close" onClick={onClose}><X size={24} /></button>
        <h2>{getTitle()}</h2>

        {error && <div className="auth-error">{error}</div>}
        {success && <div className="auth-error" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', borderColor: 'rgba(16, 185, 129, 0.3)' }}>{success}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          {(viewState === 'login' || viewState === 'register' || viewState === 'forgot') && (
            <input
              type="text"
              name="username"
              id="username"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              spellCheck={false}
              autoCorrect="off"
              autoCapitalize="off"
              required
            />
          )}
          {viewState === 'register' && (
            <input
              type="email"
              name="email"
              id="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              spellCheck={false}
              autoCorrect="off"
              autoCapitalize="off"
              required
            />
          )}
          {viewState === 'register' && (
            <input
              type="text"
              name="firstName"
              id="firstName"
              placeholder="First name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              autoComplete="given-name"
              required
            />
          )}
          {viewState === 'register' && (
            <input
              type="text"
              name="lastName"
              id="lastName"
              placeholder="Last name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              autoComplete="family-name"
              required
            />
          )}
          {(viewState === 'login' || viewState === 'register') && (
            <input
              type="password"
              name="password"
              id="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          )}
          {viewState === 'verify' && (
            <input
              type="text"
              name="otp"
              id="otp"
              placeholder="6-Digit Code"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              maxLength={6}
              style={{ letterSpacing: '0.5em', textAlign: 'center', fontSize: '20px' }}
            />
          )}
          {viewState === 'reset' && (
            <>
              <input
                type="text"
                name="resetCode"
                id="resetCode"
                placeholder="6-Digit Code"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                maxLength={6}
                style={{ letterSpacing: '0.5em', textAlign: 'center', fontSize: '20px' }}
              />
              <input
                type="password"
                name="newPassword"
                id="newPassword"
                placeholder="New password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </>
          )}
          <button type="submit" disabled={isLoading}>
            {getButtonText()}
          </button>
        </form>

        {viewState === 'register' && (
          <p style={{ fontSize: '11px', color: 'var(--cr-text-muted, #8a8a94)', textAlign: 'center', margin: '10px 0 0' }}>
            By registering, you agree to the{' '}
            <Link to="/terms" style={{ color: 'inherit' }}>Terms</Link> and{' '}
            <Link to="/privacy" style={{ color: 'inherit' }}>Privacy Policy</Link>.
          </p>
        )}

        {viewState === 'login' && (
          <p className="auth-toggle" onClick={() => { setViewState('forgot'); setError(''); setSuccess(''); }}>
            Forgot password?
          </p>
        )}
        {(viewState === 'login' || viewState === 'register') && (
          <p className="auth-toggle" onClick={() => {
            setViewState(viewState === 'login' ? 'register' : 'login');
            setError('');
            setSuccess('');
          }}>
            {viewState === 'login' ? "Don't have an account? Register" : "Already have an account? Login"}
          </p>
        )}
        {viewState === 'verify' && (
          <p className="auth-toggle" onClick={handleResend}>
            Didn't get a code? Resend
          </p>
        )}
        {viewState === 'reset' && (
          <p className="auth-toggle" onClick={handleResend}>
            Didn't get a code? Resend
          </p>
        )}
        {(viewState === 'forgot' || viewState === 'reset') && (
          <p className="auth-toggle" onClick={() => { setViewState('login'); setError(''); setSuccess(''); }}>
            Back to login
          </p>
        )}
      </div>
    </div>,
    document.body
  );
};

export default AuthModal;
