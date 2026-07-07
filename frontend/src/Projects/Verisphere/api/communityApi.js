import { API_BASE } from '../../../api/config';
import { readToken } from '../../../hooks/useAuth';

// Fired whenever community data changes (create/join/leave) so any mounted
// listener (e.g. the left sidebar) can refetch.
export const COMMUNITIES_UPDATED_EVENT = 'verisphere-communities-updated';
export const notifyCommunitiesUpdated = () =>
  window.dispatchEvent(new CustomEvent(COMMUNITIES_UPDATED_EVENT));

const authHeaders = () => {
  const strToken = readToken();
  return strToken ? { Authorization: `Bearer ${strToken}` } : {};
};

const getJson = async (strUrl) => {
  try {
    const objResponse = await fetch(strUrl, { headers: authHeaders() });
    if (objResponse.ok) return await objResponse.json();
  } catch (objErr) {
    console.error('Community fetch failed', objErr);
  }
  return null;
};

const postJson = async (strUrl, objBody) => {
  const objResponse = await fetch(strUrl, {
    method: objBody === undefined ? 'POST' : 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: objBody === undefined ? undefined : JSON.stringify(objBody),
  });
  const objData = await objResponse.json().catch(() => ({}));
  if (!objResponse.ok) throw new Error(objData.detail || `Request failed (${objResponse.status})`);
  return objData;
};

export const fetchCommunities = async () => (await getJson(`${API_BASE}/verisphere/communities/`)) || [];

export const fetchCommunityDetail = async (numId) => {
  const objCommunity = await getJson(`${API_BASE}/verisphere/communities/${numId}`);
  if (!objCommunity) throw new Error('Community not found');
  return objCommunity;
};

export const postCreateCommunity = async (objCommunityData) =>
  postJson(`${API_BASE}/verisphere/communities/`, objCommunityData);

export const postJoinCommunity = async (numId) =>
  postJson(`${API_BASE}/verisphere/communities/${numId}/join`);

export const postLeaveCommunity = async (numId) =>
  postJson(`${API_BASE}/verisphere/communities/${numId}/leave`);

export const putUpdateCommunity = async (numId, objFields) => {
  const objResponse = await fetch(`${API_BASE}/verisphere/communities/${numId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(objFields),
  });
  const objData = await objResponse.json().catch(() => ({}));
  if (!objResponse.ok) throw new Error(objData.detail || 'Update failed');
  return objData;
};

export const fetchCommunityMembers = async (numId) =>
  (await getJson(`${API_BASE}/verisphere/communities/${numId}/members/`)) || [];

export const postBanMember = async (numId, numUserId) =>
  postJson(`${API_BASE}/verisphere/communities/${numId}/ban/${numUserId}`);

export const postUnbanMember = async (numId, numUserId) =>
  postJson(`${API_BASE}/verisphere/communities/${numId}/unban/${numUserId}`);
