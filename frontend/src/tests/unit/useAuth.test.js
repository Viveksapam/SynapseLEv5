import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAuth } from '../../hooks/useAuth';

vi.mock('../../api/userApi', () => ({
  loginUser: vi.fn(),
  registerUser: vi.fn(),
  fetchUserProfile: vi.fn(),
}));

import { loginUser, registerUser, fetchUserProfile } from '../../api/userApi';

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
});

describe('useAuth', () => {
  it('starts logged out with no token', () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.boolIsLoggedInState).toBe(false);
    expect(result.current.strTokenState).toBeNull();
    expect(result.current.objUserState).toBeNull();
  });

  it('reads existing token from sessionStorage', () => {
    sessionStorage.setItem('access_token', 'existing_tok');
    fetchUserProfile.mockResolvedValueOnce({ username: 'alice' });

    const { result } = renderHook(() => useAuth());

    expect(result.current.strTokenState).toBe('existing_tok');
    expect(result.current.boolIsLoggedInState).toBe(true);
  });

  it('handleLogin sets token and fetches profile', async () => {
    loginUser.mockResolvedValueOnce({ access_token: 'new_tok' });
    fetchUserProfile.mockResolvedValueOnce({ username: 'bob' });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.handleLogin('bob', 'pass');
    });

    expect(loginUser).toHaveBeenCalledWith('bob', 'pass');
    expect(result.current.strTokenState).toBe('new_tok');
    expect(result.current.boolIsLoggedInState).toBe(true);

    await waitFor(() => {
      expect(result.current.objUserState).toEqual({ username: 'bob' });
    });
  });

  it('handleRegister calls registerUser API', async () => {
    registerUser.mockResolvedValueOnce({ id: 1 });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.handleRegister({ username: 'new', email: 'n@b.com', password: '123' });
    });

    expect(registerUser).toHaveBeenCalledWith({ username: 'new', email: 'n@b.com', password: '123' });
  });

  it('handleLogout clears token and user', async () => {
    loginUser.mockResolvedValueOnce({ access_token: 'tok' });
    fetchUserProfile.mockResolvedValueOnce({ username: 'alice' });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.handleLogin('alice', 'pass');
    });

    act(() => {
      result.current.handleLogout();
    });

    expect(result.current.strTokenState).toBeNull();
    expect(result.current.boolIsLoggedInState).toBe(false);
    expect(sessionStorage.getItem('access_token')).toBeNull();
  });

  it('auto-logouts when fetchUserProfile fails (expired token)', async () => {
    sessionStorage.setItem('access_token', 'expired_tok');
    fetchUserProfile.mockRejectedValueOnce(new Error('401'));

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.boolIsLoggedInState).toBe(false);
      expect(result.current.strTokenState).toBeNull();
    });
  });

  it('stores token in sessionStorage on login', async () => {
    loginUser.mockResolvedValueOnce({ access_token: 'stored_tok' });
    fetchUserProfile.mockResolvedValueOnce({ username: 'x' });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.handleLogin('x', 'p');
    });

    await waitFor(() => {
      expect(sessionStorage.getItem('access_token')).toBe('stored_tok');
    });
  });
});
