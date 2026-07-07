import { useState, useEffect, useCallback } from 'react';
import { loginUser, registerUser, fetchUserProfile, verifyEmail, resendVerificationCode, forgotPassword, resetPassword } from '../api/userApi';

const TOKEN_KEY = 'access_token';

// Exported for API modules that attach the session token outside React
// (single source of truth for the storage key).
export const readToken = () => {
  try { return sessionStorage.getItem(TOKEN_KEY); }
  catch { return null; }
};

const writeToken = (strToken) => {
  try { strToken ? sessionStorage.setItem(TOKEN_KEY, strToken) : sessionStorage.removeItem(TOKEN_KEY); }
  catch { /* storage unavailable */ }
};

export const useAuth = () => {
  const [strTokenState, setStrTokenState] = useState(() => readToken());
  const [boolIsLoggedInState, setBoolIsLoggedInState] = useState(!!readToken());
  const [objUserState, setObjUserState] = useState(null);

  const handleLogout = useCallback(() => {
    setStrTokenState(null);
    setObjUserState(null);
    writeToken(null);
    setBoolIsLoggedInState(false);
  }, []);

  useEffect(() => {
    const boolHasToken = !!strTokenState;
    setBoolIsLoggedInState(boolHasToken);
    writeToken(strTokenState);
    if (!boolHasToken) { setObjUserState(null); return; }
    fetchUserProfile(strTokenState)
      .then(setObjUserState)
      .catch(handleLogout);
  }, [strTokenState, handleLogout]);

  const handleLogin = async (strUsername, strPassword) => {
    const data = await loginUser(strUsername, strPassword);
    setStrTokenState(data.access_token);
    return data;
  };

  const handleRegister = async (objUserData) => {
    return await registerUser(objUserData);
  };

  const handleVerify = async (strUsername, strCode) => {
    const data = await verifyEmail(strUsername, strCode);
    setStrTokenState(data.access_token);
    return data;
  };

  const handleResendCode = async (strUsername) => {
    return await resendVerificationCode(strUsername);
  };

  const handleForgotPassword = async (strUsername) => {
    return await forgotPassword(strUsername);
  };

  const handleResetPassword = async (strUsername, strCode, strNewPassword) => {
    return await resetPassword(strUsername, strCode, strNewPassword);
  };

  return {
    strTokenState, boolIsLoggedInState, objUserState,
    setObjUserState, handleLogin, handleRegister, handleVerify, handleResendCode, handleLogout,
    handleForgotPassword, handleResetPassword,
  };
};
