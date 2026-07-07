import { API_BASE } from '../../../api/config';
import { readToken } from '../../../hooks/useAuth';

// All engagement endpoints require auth; identity comes from the session token.
const authHeaders = () => {
  const strToken = readToken();
  return strToken ? { Authorization: `Bearer ${strToken}` } : {};
};

export const fetchNotifications = async () => {
  try {
    const objResponse = await fetch(`${API_BASE}/engagement/notifications/`, { headers: authHeaders() });
    if (objResponse.ok) return await objResponse.json();
  } catch (objErr) {
    console.error('Failed to fetch notifications', objErr);
  }
  return [];
};

export const fetchUnreadCount = async () => {
  try {
    const objResponse = await fetch(`${API_BASE}/engagement/notifications/unread-count/`, { headers: authHeaders() });
    if (objResponse.ok) return (await objResponse.json()).count || 0;
  } catch {
    // Poll target - stay quiet on transient failures.
  }
  return 0;
};

export const postMarkAllRead = async () => {
  try {
    const objResponse = await fetch(`${API_BASE}/engagement/notifications/mark-all-read/`, {
      method: 'POST',
      headers: authHeaders(),
    });
    return objResponse.ok;
  } catch (objErr) {
    console.error('Failed to mark notifications read', objErr);
    return false;
  }
};

export const fetchMyBadges = async () => {
  try {
    const objResponse = await fetch(`${API_BASE}/engagement/badges/me/`, { headers: authHeaders() });
    if (objResponse.ok) return await objResponse.json();
  } catch (objErr) {
    console.error('Failed to fetch badges', objErr);
  }
  return [];
};

export const fetchMyRecap = async () => {
  try {
    const objResponse = await fetch(`${API_BASE}/engagement/recap/me/`, { headers: authHeaders() });
    if (objResponse.ok) return await objResponse.json();
  } catch (objErr) {
    console.error('Failed to fetch recap', objErr);
  }
  return null;
};

export const fetchMyReputation = async () => {
  try {
    const objResponse = await fetch(`${API_BASE}/engagement/reputation/me/`, { headers: authHeaders() });
    if (objResponse.ok) return await objResponse.json();
  } catch (objErr) {
    console.error('Failed to fetch reputation', objErr);
  }
  return { total: 0, by_type: {} };
};
