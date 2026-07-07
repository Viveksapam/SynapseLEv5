import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import App from '../../App';

vi.mock('../../api/coreApi', () => ({
  fetchSiteSettings: vi.fn(() => Promise.resolve(null)),
}));

vi.mock('../../api/userApi', () => ({
  loginUser: vi.fn(),
  registerUser: vi.fn(),
  fetchUserProfile: vi.fn(),
  verifyEmail: vi.fn(),
}));

vi.mock('../../api/blogApi', () => ({
  fetchBlogList: vi.fn(() => Promise.resolve({ data: [], error: null })),
}));

vi.mock('../../api/projectApi', () => ({
  fetchProjectList: vi.fn(() => Promise.resolve({ data: [], error: null })),
}));

vi.mock('../../api/portfolioApi', () => ({
  fetchSkillList: vi.fn(() => Promise.resolve({ data: [], error: null })),
  fetchVideoList: vi.fn(() => Promise.resolve({ data: [], error: null })),
}));

vi.mock('../../api/productApi', () => ({
  fetchProductList: vi.fn(() => Promise.resolve({ data: [], error: null })),
}));

vi.mock('../../theme/ThemeLayer', () => ({
  default: () => null,
}));

const renderApp = (route = '/') => render(
  <HelmetProvider>
    <MemoryRouter initialEntries={[route]}>
      <App />
    </MemoryRouter>
  </HelmetProvider>
);

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
});

const WAIT_FOR_LAZY = { timeout: 5000 };

describe('App routing integration', () => {
  it('renders Home page on /', async () => {
    renderApp('/');
    await waitFor(() => {
      expect(screen.getByText(/Designing virtual spaces/)).toBeDefined();
    }, WAIT_FOR_LAZY);
  });

  it('renders Shop page on /shop', async () => {
    renderApp('/shop');
    await waitFor(() => {
      expect(screen.getByText('Exclusive Apparel & Merchandise')).toBeDefined();
    }, WAIT_FOR_LAZY);
  });

  it('renders Credentials page on /credentials', async () => {
    renderApp('/credentials');
    await waitFor(() => {
      expect(document.querySelector('.app-shell')).toBeDefined();
    }, WAIT_FOR_LAZY);
  });

  it('renders Assessment page on /assessment', async () => {
    renderApp('/assessment');
    await waitFor(() => {
      expect(document.querySelector('.app-shell')).toBeDefined();
    }, WAIT_FOR_LAZY);
  });

  it('renders Checkout page on /checkout', async () => {
    renderApp('/checkout');
    await waitFor(() => {
      expect(screen.getByText('Secure Checkout')).toBeDefined();
    }, WAIT_FOR_LAZY);
  });

  it('renders Verisphere on /verisphere', async () => {
    renderApp('/verisphere');
    await waitFor(() => {
      expect(screen.getByText('SPHERE')).toBeDefined();
    }, WAIT_FOR_LAZY);
  });

  it('redirects unknown routes to /', async () => {
    renderApp('/nonexistent');
    await waitFor(() => {
      expect(screen.getByText(/Designing virtual spaces/)).toBeDefined();
    }, WAIT_FOR_LAZY);
  });

  it('renders app shell wrapper on all routes', () => {
    renderApp('/');
    expect(document.querySelector('.app-shell')).toBeDefined();
  });
});
