import { API_BASE } from '../../../api/config';
import { readToken } from '../../../hooks/useAuth';
import { mapBlogToPost } from './verisphereMocks';

// Bearer header for the given token, falling back to the session token for
// callers that don't thread one through. Empty when logged out - the backend
// decides what requires auth.
const authHeaders = (strToken) => {
  const strAuth = strToken || readToken();
  return strAuth ? { Authorization: `Bearer ${strAuth}` } : {};
};

const blogIdFromString = (idOrString) => {
  const strId = String(idOrString);
  return strId.startsWith('blog_') ? parseInt(strId.replace('blog_', ''), 10) : parseInt(strId, 10);
};

const noCacheHeaders = { 'Cache-Control': 'no-cache', Pragma: 'no-cache' };

// Real LLM analysis calls can legitimately take 20-30s+; the backend itself
// caps its Gemini call at 45s (see llm_audit.py), so give the request a bit of
// headroom beyond that rather than no timeout at all - fetch() never times
// out on its own, so a hung connection would otherwise freeze the loading
// overlay indefinitely.
const ANALYSIS_TIMEOUT_MS = 60000;

const fetchWithTimeout = async (url, options = {}, timeoutMs = ANALYSIS_TIMEOUT_MS) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (objErr) {
    if (objErr.name === 'AbortError') {
      throw new Error(`Request timed out after ${Math.round(timeoutMs / 1000)}s. The server may be slow or unresponsive - try again.`);
    }
    throw objErr;
  } finally {
    clearTimeout(timer);
  }
};

// Community and post-creation APIs live in communityApi.js / postApi.js.

export const fetchPosts = async (numCommunityId = null) => {
  try {
    const objResponse = await fetch(`${API_BASE}/verisphere/blogs/`, { headers: noCacheHeaders });
    if (!objResponse.ok) return [];
    const arrBlogs = await objResponse.json();
    let arrPosts = arrBlogs.map(mapBlogToPost);

    // comments_count from API already includes all comments + replies
    arrPosts.sort((a, b) => b.numUpvotes - a.numUpvotes);
    if (numCommunityId) {
      arrPosts = arrPosts.filter(
        (p) => p.objCommunity === parseInt(numCommunityId, 10) || p.objCommunity === String(numCommunityId)
      );
    }
    return arrPosts;
  } catch (objErr) {
    console.error('Failed to fetch blogs for verisphere', objErr);
    return [];
  }
};

export const postToggleFeatured = async (numPostId, boolCurrentlyFeatured, strToken) => {
  const numBlogId = blogIdFromString(numPostId);
  try {
    const objResponse = await fetch(`${API_BASE}/verisphere/blogs/featured/${numBlogId}`, {
      method: boolCurrentlyFeatured ? 'DELETE' : 'POST',
      headers: { Authorization: `Bearer ${strToken}` },
    });
    return objResponse.ok;
  } catch (objErr) {
    console.error('Failed to toggle featured status', objErr);
    return false;
  }
};

const loadRepliesRecursively = async (numBlogId, numCommentId) => {
  try {
    const repliesResponse = await fetch(`${API_BASE}/verisphere/blogs/${numBlogId}/comments/${numCommentId}/replies/`, { headers: noCacheHeaders });
    const arrReplies = repliesResponse.ok ? await repliesResponse.json() : [];

    // Recursively load replies for each reply (deep nesting like Reddit)
    return await Promise.all(arrReplies.map(async (reply) => {
      const nestedReplies = await loadRepliesRecursively(numBlogId, reply.id);
      return { ...reply, replies: nestedReplies };
    }));
  } catch {
    return [];
  }
};

export const fetchPostDetail = async (idOrString) => {
  const numBlogId = blogIdFromString(idOrString);
  const objResponse = await fetch(`${API_BASE}/verisphere/blogs/`, { headers: noCacheHeaders });
  if (!objResponse.ok) throw new Error('Post not found');
  const arrBlogs = await objResponse.json();
  const objBlog = arrBlogs.find((b) => b.id === numBlogId);
  if (!objBlog) throw new Error('Post not found');
  try {
    const commentsResponse = await fetch(`${API_BASE}/verisphere/blogs/${numBlogId}/comments/`, { headers: noCacheHeaders });
    let arrComments = commentsResponse.ok ? await commentsResponse.json() : [];

    // Load replies recursively for each top-level comment
    arrComments = await Promise.all(arrComments.map(async (comment) => {
      const nestedReplies = await loadRepliesRecursively(numBlogId, comment.id);
      return { ...comment, replies: nestedReplies };
    }));

    const objPost = mapBlogToPost(objBlog);
    objPost.comments = arrComments;
    objPost.comments_count = arrComments.length;

    // Load only approved sources for this post (Community Sources shows the verified list)
    try {
      const sourcesResponse = await fetch(`${API_BASE}/verisphere/blogs/${numBlogId}/sources/?status=approved`, { headers: noCacheHeaders });
      objPost.sources = sourcesResponse.ok ? await sourcesResponse.json() : [];
    } catch {
      objPost.sources = [];
    }

    return objPost;
  } catch {
    const objPost = mapBlogToPost(objBlog);
    objPost.comments = [];
    objPost.comments_count = 0;
    objPost.sources = [];
    return objPost;
  }
};

export const postCreateSource = async (numPostId, objSourceData) => {
  const numBlogId = blogIdFromString(numPostId);
  const objResponse = await fetch(`${API_BASE}/verisphere/blogs/${numBlogId}/sources/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(objSourceData),
  });
  if (!objResponse.ok) {
    const strDetail = await objResponse.text().catch(() => '');
    throw new Error(`Failed to submit source (${objResponse.status}): ${strDetail}`);
  }
  return objResponse.json();
};

export const fetchApprovedSources = async (numPostId) => {
  const numBlogId = blogIdFromString(numPostId);
  try {
    const objResponse = await fetch(`${API_BASE}/verisphere/blogs/${numBlogId}/sources/?status=approved`, { headers: noCacheHeaders });
    return objResponse.ok ? await objResponse.json() : [];
  } catch {
    return [];
  }
};

export const fetchPendingSources = async (numPostId) => {
  const numBlogId = blogIdFromString(numPostId);
  try {
    const objResponse = await fetch(`${API_BASE}/verisphere/blogs/${numBlogId}/sources/?status=pending`, { headers: noCacheHeaders });
    return objResponse.ok ? await objResponse.json() : [];
  } catch {
    return [];
  }
};

export const postApproveSource = async (numSourceId, strToken) => {
  try {
    const objResponse = await fetch(`${API_BASE}/verisphere/sources/${numSourceId}/approve/`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${strToken}` },
    });
    return objResponse.ok ? await objResponse.json() : null;
  } catch {
    return null;
  }
};

export const postCreateComment = async (numPostId, objCommentData, strToken) => {
  const numBlogId = blogIdFromString(numPostId);
  // The server attributes the comment to the authenticated user; no author in the body.
  const strUrl = objCommentData.objParent
    ? `${API_BASE}/verisphere/blogs/${numBlogId}/comments/${objCommentData.objParent}/replies/`
    : `${API_BASE}/verisphere/blogs/${numBlogId}/comments/`;
  try {
    const objResponse = await fetch(strUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders(strToken) },
      body: JSON.stringify({ strContent: objCommentData.strContent }),
    });
    if (objResponse.ok) return await objResponse.json();
  } catch (objErr) {
    console.error('Failed to create comment:', objErr);
  }
  return null;
};

export const fetchPostReactions = async (numPostId) => {
  const numBlogId = blogIdFromString(numPostId);
  try {
    const objResponse = await fetch(`${API_BASE}/verisphere/blogs/${numBlogId}/reactions`, { headers: authHeaders() });
    if (objResponse.ok) return await objResponse.json();
  } catch (objErr) {
    console.error('Failed to fetch reactions', objErr);
  }
  return { reactions: {}, user_reacted: {} };
};

export const postToggleReaction = async (numPostId, strEmoji) => {
  const numBlogId = blogIdFromString(numPostId);
  try {
    const objResponse = await fetch(`${API_BASE}/verisphere/blogs/${numBlogId}/react`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ emoji: strEmoji }),
    });
    if (objResponse.ok) return await objResponse.json();
  } catch (objErr) {
    console.error('Failed to toggle reaction', objErr);
  }
  return { status: 'error' };
};

export const postAnalyzePost = async (numPostId, strToken) => {
  const numBlogId = blogIdFromString(numPostId);
  const objResponse = await fetchWithTimeout(`${API_BASE}/verisphere/blogs/${numBlogId}/analysis/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(strToken && { Authorization: `Bearer ${strToken}` }) },
  });
  if (!objResponse.ok) {
    const objDetail = await objResponse.json().catch(() => ({}));
    throw new Error(objDetail.detail || `Failed to analyze post (${objResponse.status}).`);
  }
  return objResponse.json();
};

export const postAnalyzeComment = async (numCommentId, strToken) => {
  const objResponse = await fetchWithTimeout(`${API_BASE}/verisphere/comments/${numCommentId}/analyze/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(strToken && { Authorization: `Bearer ${strToken}` }) },
  });
  if (!objResponse.ok) {
    const objDetail = await objResponse.json().catch(() => ({}));
    throw new Error(objDetail.detail || `Failed to analyze comment (${objResponse.status}).`);
  }
  return objResponse.json();
};

export const postUpdatePost = async (numPostId, objUpdates, strToken) => {
  const numBlogId = blogIdFromString(numPostId);
  const objResponse = await fetch(`${API_BASE}/verisphere/blogs/${numBlogId}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders(strToken) },
    body: JSON.stringify(objUpdates),
  });
  if (!objResponse.ok) {
    const strDetail = await objResponse.text().catch(() => '');
    throw new Error(`Failed to update post (${objResponse.status}): ${strDetail}`);
  }
  return objResponse.json();
};

export const deleteComment = async (numPostId, numCommentId, strToken) => {
  const numBlogId = blogIdFromString(numPostId);
  const objResponse = await fetch(`${API_BASE}/verisphere/blogs/${numBlogId}/comments/${numCommentId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', ...authHeaders(strToken) },
  });
  if (!objResponse.ok) {
    const strDetail = await objResponse.text().catch(() => '');
    throw new Error(`Failed to delete comment (${objResponse.status}): ${strDetail}`);
  }
  return objResponse.json();
};
