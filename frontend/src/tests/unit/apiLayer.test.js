import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../api/apiClient', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
  }
}));

import apiClient from '../../api/apiClient';
import { fetchBlogList, fetchBlogComments, postBlogComment } from '../../api/blogApi';
import { fetchSkillList, fetchVideoList } from '../../api/portfolioApi';
import { fetchProjectList } from '../../api/projectApi';
import { fetchProductList } from '../../api/productApi';
import { postCreateRazorpayOrder, postVerifyRazorpaySignature } from '../../api/paymentApi';
import { registerUser, loginUser, fetchUserProfile, updateUserProfile, activateAccount, forgotPassword, resetPassword } from '../../api/userApi';
import { fetchSiteSettings } from '../../api/coreApi';

beforeEach(() => {
  vi.clearAllMocks();
});



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



describe('userApi', () => {
  it('registerUser posts user data', async () => {
    apiClient.post.mockResolvedValueOnce({ id: 1 });

    const result = await registerUser({ username: 'alice', email: 'a@b.com', password: '123' });

    expect(apiClient.post).toHaveBeenCalledWith('/auth/users/', {
      username: 'alice', email: 'a@b.com', password: '123',
    });
    expect(result).toEqual({ id: 1 });
  });

  it('loginUser sends JSON credentials to jwt/create', async () => {
    apiClient.post.mockResolvedValueOnce({ access: 'tok_xyz', refresh: 'ref_xyz' });

    const result = await loginUser('alice', 'pass123');

    expect(apiClient.post).toHaveBeenCalledWith('/auth/jwt/create/', {
      username: 'alice', password: 'pass123',
    });
    expect(result).toEqual({ access: 'tok_xyz', refresh: 'ref_xyz' });
  });

  it('fetchUserProfile sends bearer token', async () => {
    apiClient.get.mockResolvedValueOnce({ username: 'alice' });

    const result = await fetchUserProfile('tok_123');

    expect(apiClient.get).toHaveBeenCalledWith('/auth/users/me/', {
      headers: { Authorization: 'Bearer tok_123' },
    });
    expect(result).toEqual({ username: 'alice' });
  });

  it('updateUserProfile sends PATCH with token', async () => {
    apiClient.patch.mockResolvedValueOnce({ ok: true });

    const result = await updateUserProfile({ username: 'bob' }, 'tok_123');

    expect(apiClient.patch).toHaveBeenCalledWith('/auth/users/me/', { username: 'bob' }, {
      headers: { Authorization: 'Bearer tok_123', 'Content-Type': 'application/json' },
    });
    expect(result).toEqual({ ok: true });
  });

  it('activateAccount sends uid and token in body', async () => {
    apiClient.post.mockResolvedValueOnce('');

    const result = await activateAccount('uid123', 'token456');

    expect(apiClient.post).toHaveBeenCalledWith('/auth/users/activation/', { uid: 'uid123', token: 'token456' });
    expect(result).toEqual('');
  });

  it('forgotPassword sends email in body', async () => {
    apiClient.post.mockResolvedValueOnce('');

    const result = await forgotPassword('bob@example.com');

    expect(apiClient.post).toHaveBeenCalledWith('/auth/users/reset_password/', { email: 'bob@example.com' });
    expect(result).toEqual('');
  });

  it('resetPassword sends uid, token, and new_password in body', async () => {
    apiClient.post.mockResolvedValueOnce('');

    const result = await resetPassword('uid123', 'token456', 'newpass123');

    expect(apiClient.post).toHaveBeenCalledWith('/auth/users/reset_password_confirm/', {
      uid: 'uid123', token: 'token456', new_password: 'newpass123',
    });
    expect(result).toEqual('');
  });
});



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
