import { useState, useEffect, useCallback, useRef } from 'react';
import {
  loginUser, registerUser, fetchUserProfile, activateAccount, resendActivation,
  forgotPassword, resetPassword, refreshAccessToken,
} from '../api/userApi';

const TOKEN_KEY = 'access_token';
const REFRESH_KEY = 'refresh_token';

// SIMPLE_JWT.ACCESS_TOKEN_LIFETIME is 30 minutes server-side; refresh a few minutes early.
const REFRESH_MARGIN_MS = 5 * 60 * 1000;
const ACCESS_TOKEN_LIFETIME_MS = 30 * 60 * 1000;

export const readToken = () => {
  try { return sessionStorage.getItem(TOKEN_KEY); }
  catch { return null; }
};

const writeToken = (strToken) => {
  try { strToken ? sessionStorage.setItem(TOKEN_KEY, strToken) : sessionStorage.removeItem(TOKEN_KEY); }
  catch (e) { void e; }
};

const readRefreshToken = () => {
  try { return sessionStorage.getItem(REFRESH_KEY); }
  catch { return null; }
};

const writeRefreshToken = (strToken) => {
  try { strToken ? sessionStorage.setItem(REFRESH_KEY, strToken) : sessionStorage.removeItem(REFRESH_KEY); }
  catch (e) { void e; }
};

export const useAuth = () => {
  const [strTokenState, setStrTokenState] = useState(() => readToken());
  const [boolIsLoggedInState, setBoolIsLoggedInState] = useState(!!readToken());
  const [objUserState, setObjUserState] = useState(null);
  const refreshTimerRef = useRef(null);

  const clearRefreshTimer = useCallback(() => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  }, []);

  const handleLogout = useCallback(() => {
    clearRefreshTimer();
    setStrTokenState(null);
    setObjUserState(null);
    writeToken(null);
    writeRefreshToken(null);
    setBoolIsLoggedInState(false);
  }, [clearRefreshTimer]);

  const scheduleRefresh = useCallback(() => {
    clearRefreshTimer();
    const delay = Math.max(ACCESS_TOKEN_LIFETIME_MS - REFRESH_MARGIN_MS, 30 * 1000);
    refreshTimerRef.current = setTimeout(async () => {
      const refresh = readRefreshToken();
      if (!refresh) return;
      try {
        const data = await refreshAccessToken(refresh);
        writeToken(data.access);
        if (data.refresh) writeRefreshToken(data.refresh);
        setStrTokenState(data.access);
      } catch {
        handleLogout();
      }
    }, delay);
  }, [clearRefreshTimer, handleLogout]);

  useEffect(() => {
    const boolHasToken = !!strTokenState;
    setBoolIsLoggedInState(boolHasToken);
    writeToken(strTokenState);
    if (!boolHasToken) { setObjUserState(null); return; }
    fetchUserProfile(strTokenState)
      .then(setObjUserState)
      .catch(handleLogout);
    scheduleRefresh();
    return clearRefreshTimer;
  }, [strTokenState, handleLogout, scheduleRefresh, clearRefreshTimer]);

  const handleLogin = async (strUsername, strPassword) => {
    const data = await loginUser(strUsername, strPassword);
    writeRefreshToken(data.refresh);
    setStrTokenState(data.access);
    return data;
  };

  const handleRegister = async (objUserData) => {
    return await registerUser(objUserData);
  };

  const handleActivate = async (strUid, strToken) => {
    return await activateAccount(strUid, strToken);
  };

  const handleResendActivation = async (strEmail) => {
    return await resendActivation(strEmail);
  };

  const handleForgotPassword = async (strEmail) => {
    return await forgotPassword(strEmail);
  };

  const handleResetPassword = async (strUid, strToken, strNewPassword) => {
    return await resetPassword(strUid, strToken, strNewPassword);
  };

  return {
    strTokenState, boolIsLoggedInState, objUserState,
    setObjUserState, handleLogin, handleRegister, handleActivate, handleResendActivation,
    handleLogout, handleForgotPassword, handleResetPassword,
  };
};
