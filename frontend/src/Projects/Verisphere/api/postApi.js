import { API_BASE } from '../../../api/config';
import { readToken } from '../../../hooks/useAuth';

const authHeaders = () => {
  const strToken = readToken();
  return strToken ? { Authorization: `Bearer ${strToken}` } : {};
};

// Creates a real post. objPostData: { strTitle, strContent, strMediaUrl,
// strReferences, community_id (null = profile/general feed), strPostType,
// strAnalysisMode, allowed_analysis_focus }.
export const createPost = async (objPostData) => {
  const objResponse = await fetch(`${API_BASE}/verisphere/blogs/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(objPostData),
  });
  const objData = await objResponse.json().catch(() => ({}));
  if (!objResponse.ok) throw new Error(objData.detail || `Failed to publish (${objResponse.status})`);
  return objData;
};

export const patchAnalysisSettings = async (numBlogId, objSettings) => {
  const objResponse = await fetch(`${API_BASE}/verisphere/blogs/${numBlogId}/analysis-settings/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(objSettings),
  });
  const objData = await objResponse.json().catch(() => ({}));
  if (!objResponse.ok) throw new Error(objData.detail || 'Failed to update analysis settings');
  return objData;
};

export const deletePost = async (numBlogId) => {
  const objResponse = await fetch(`${API_BASE}/verisphere/blogs/${numBlogId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  return objResponse.ok;
};
