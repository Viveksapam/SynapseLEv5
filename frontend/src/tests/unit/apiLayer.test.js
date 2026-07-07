import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../api/apiClient', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  }
}));

import apiClient from '../../api/apiClient';
import { fetchBlogList, fetchBlogComments, postBlogComment } from '../../api/blogApi';
import { fetchSkillList, fetchVideoList } from '../../api/portfolioApi';
import { fetchProjectList } from '../../api/projectApi';
import { fetchProductList } from '../../api/productApi';
import { postCreateRazorpayOrder, postVerifyRazorpaySignature } from '../../api/paymentApi';
import { registerUser, loginUser, fetchUserProfile, updateUserProfile, verifyEmail, forgotPassword, resetPassword } from '../../api/userApi';
import { fetchSiteSettings } from '../../api/coreApi';

beforeEach(() => {
  vi.clearAllMocks();
});

// ── Blog API ────────────────────────────────────────────────────────────────

describe('blogApi', () => {
  it('fetchBlogList returns data on success', async () => {
    const mockBlogs = [{ id: 1, strTitle: 'Test Blog' }];
    apiClient.get.mockResolvedValueOnce(mockBlogs);

    const result = await fetchBlogList();

    expect(apiClient.get).toHaveBeenCalledWith('/verisphere/recent-contributions/');
    expect(result).toEqual({ data: mockBlogs, error: null });
  });

  it('fetchBlogList returns error on failure', async () => {
    apiClient.get.mockRejectedValueOnce(new Error('Network error'));

    const result = await fetchBlogList();

    expect(result.data).toBeNull();
    expect(result.error).toBe('Network error');
  });

  it('fetchBlogComments calls correct endpoint', async () => {
    apiClient.get.mockResolvedValueOnce([]);

    const result = await fetchBlogComments(42);

    expect(apiClient.get).toHaveBeenCalledWith('/verisphere/blogs/42/comments/');
    expect(result).toEqual({ data: [], error: null });
  });

  it('postBlogComment sends author and content', async () => {
    apiClient.post.mockResolvedValueOnce({ id: 1 });

    const result = await postBlogComment(5, 'Alice', 'Great post');

    expect(apiClient.post).toHaveBeenCalledWith('/verisphere/blogs/5/comments/', {
      strAuthor: 'Alice',
      strContent: 'Great post',
    });
    expect(result).toEqual({ data: { id: 1 }, error: null });
  });
});

// ── Portfolio API ───────────────────────────────────────────────────────────

describe('portfolioApi', () => {
  it('fetchSkillList returns data on success', async () => {
    const mockSkills = [{ id: 1, strTitle: 'React' }];
    apiClient.get.mockResolvedValueOnce(mockSkills);

    const result = await fetchSkillList();

    expect(apiClient.get).toHaveBeenCalledWith('/portfolio/skills/');
    expect(result).toEqual({ data: mockSkills, error: null });
  });

  it('fetchSkillList returns error on failure', async () => {
    apiClient.get.mockRejectedValueOnce(new Error('Timeout'));

    const result = await fetchSkillList();

    expect(result).toEqual({ data: null, error: 'Timeout' });
  });

  it('fetchVideoList returns data on success', async () => {
    apiClient.get.mockResolvedValueOnce([{ id: 1 }]);

    const result = await fetchVideoList();

    expect(apiClient.get).toHaveBeenCalledWith('/verisphere/videos/');
    expect(result).toEqual({ data: [{ id: 1 }], error: null });
  });
});

// ── Project API ─────────────────────────────────────────────────────────────

describe('projectApi', () => {
  it('fetchProjectList returns data on success', async () => {
    const mockProjects = [{ id: 1, strName: 'Verisphere' }];
    apiClient.get.mockResolvedValueOnce(mockProjects);

    const result = await fetchProjectList();

    expect(apiClient.get).toHaveBeenCalledWith('/project/');
    expect(result).toEqual({ data: mockProjects, error: null });
  });

  it('fetchProjectList returns error on failure', async () => {
    apiClient.get.mockRejectedValueOnce(new Error('Server down'));

    const result = await fetchProjectList();

    expect(result.data).toBeNull();
    expect(result.error).toBe('Server down');
  });
});

// ── Product API ─────────────────────────────────────────────────────────────

describe('productApi', () => {
  it('fetchProductList returns data on success', async () => {
    const mockProducts = [{ id: 1, strName: 'Hoodie' }];
    apiClient.get.mockResolvedValueOnce(mockProducts);

    const result = await fetchProductList();

    expect(apiClient.get).toHaveBeenCalledWith('/product/');
    expect(result).toEqual({ data: mockProducts, error: null });
  });

  it('fetchProductList returns error on failure', async () => {
    apiClient.get.mockRejectedValueOnce(new Error('Server down'));

    const result = await fetchProductList();

    expect(result.data).toBeNull();
    expect(result.error).toBe('Server down');
  });
});

// ── Payment API ─────────────────────────────────────────────────────────────

describe('paymentApi', () => {
  it('postCreateRazorpayOrder sends order with auth header', async () => {
    const mockResponse = { strOrderId: 'ord_123', numAmount: 500 };
    apiClient.post.mockResolvedValueOnce(mockResponse);

    const result = await postCreateRazorpayOrder(500, 'tok_abc');

    expect(apiClient.post).toHaveBeenCalledWith(
      '/payment/create-intent/',
      { order_id: 500 },
      { headers: { Authorization: 'Bearer tok_abc' } }
    );
    expect(result).toEqual(mockResponse);
  });

  it('postCreateRazorpayOrder returns null on error', async () => {
    apiClient.post.mockRejectedValueOnce(new Error('fail'));

    const result = await postCreateRazorpayOrder(500, 'tok_abc');

    expect(result).toBeNull();
  });

  it('postVerifyRazorpaySignature sends verification data', async () => {
    const payload = { razorpay_order_id: 'ord_1', razorpay_payment_id: 'pay_1', razorpay_signature: 'sig_1' };
    apiClient.post.mockResolvedValueOnce({ status: 'verified' });

    const result = await postVerifyRazorpaySignature(payload, 'tok_abc');

    expect(apiClient.post).toHaveBeenCalledWith(
      '/payment/verify-signature/',
      payload,
      { headers: { Authorization: 'Bearer tok_abc' } }
    );
    expect(result).toEqual({ status: 'verified' });
  });
});

// ── User API ────────────────────────────────────────────────────────────────

describe('userApi', () => {
  it('registerUser posts user data', async () => {
    apiClient.post.mockResolvedValueOnce({ id: 1 });

    const result = await registerUser({ username: 'alice', email: 'a@b.com', password: '123' });

    expect(apiClient.post).toHaveBeenCalledWith('/auth/register', {
      username: 'alice', email: 'a@b.com', password: '123',
    });
    expect(result).toEqual({ id: 1 });
  });

  it('loginUser sends form-urlencoded credentials', async () => {
    apiClient.post.mockResolvedValueOnce({ access_token: 'tok_xyz' });

    const result = await loginUser('alice', 'pass123');

    const [url, body, config] = apiClient.post.mock.calls[0];
    expect(url).toBe('/auth/token');
    expect(body.toString()).toContain('username=alice');
    expect(body.toString()).toContain('password=pass123');
    expect(config.headers['Content-Type']).toBe('application/x-www-form-urlencoded');
    expect(result).toEqual({ access_token: 'tok_xyz' });
  });

  it('fetchUserProfile sends bearer token', async () => {
    apiClient.get.mockResolvedValueOnce({ username: 'alice' });

    const result = await fetchUserProfile('tok_123');

    expect(apiClient.get).toHaveBeenCalledWith('/auth/me', {
      headers: { Authorization: 'Bearer tok_123' },
    });
    expect(result).toEqual({ username: 'alice' });
  });

  it('updateUserProfile sends PUT with token', async () => {
    apiClient.put.mockResolvedValueOnce({ ok: true });

    const result = await updateUserProfile({ username: 'bob' }, 'tok_123');

    expect(apiClient.put).toHaveBeenCalledWith('/auth/profile', { username: 'bob' }, {
      headers: { Authorization: 'Bearer tok_123', 'Content-Type': 'application/json' },
    });
    expect(result).toEqual({ ok: true });
  });

  it('verifyEmail sends username and code in body', async () => {
    apiClient.post.mockResolvedValueOnce({ verified: true });

    const result = await verifyEmail('bob123', '123456');

    expect(apiClient.post).toHaveBeenCalledWith('/auth/verify-email', { username: 'bob123', code: '123456' });
    expect(result).toEqual({ verified: true });
  });

  it('forgotPassword sends username in body', async () => {
    apiClient.post.mockResolvedValueOnce({ message: 'ok' });

    const result = await forgotPassword('bob123');

    expect(apiClient.post).toHaveBeenCalledWith('/auth/forgot-password', { username: 'bob123' });
    expect(result).toEqual({ message: 'ok' });
  });

  it('resetPassword sends username, code, and new_password in body', async () => {
    apiClient.post.mockResolvedValueOnce({ message: 'reset' });

    const result = await resetPassword('bob123', '654321', 'newpass123');

    expect(apiClient.post).toHaveBeenCalledWith('/auth/reset-password', {
      username: 'bob123', code: '654321', new_password: 'newpass123',
    });
    expect(result).toEqual({ message: 'reset' });
  });
});

// ── Core API ────────────────────────────────────────────────────────────────

describe('coreApi', () => {
  it('fetchSiteSettings returns data on success', async () => {
    apiClient.get.mockResolvedValueOnce({ strSiteName: 'Synapse' });

    const result = await fetchSiteSettings();

    expect(apiClient.get).toHaveBeenCalledWith('/core/settings/');
    expect(result).toEqual({ strSiteName: 'Synapse' });
  });

  it('fetchSiteSettings returns null on error', async () => {
    apiClient.get.mockRejectedValueOnce(new Error('fail'));

    const result = await fetchSiteSettings();

    expect(result).toBeNull();
  });
});
