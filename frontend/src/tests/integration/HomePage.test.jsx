import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import Home from '../../Home/Home';

vi.mock('../../api/blogApi', () => ({
  fetchBlogList: vi.fn(),
}));

vi.mock('../../api/projectApi', () => ({
  fetchProjectList: vi.fn(),
}));

vi.mock('../../api/portfolioApi', () => ({
  fetchSkillList: vi.fn(),
  fetchVideoList: vi.fn(),
}));

import { fetchBlogList } from '../../api/blogApi';
import { fetchProjectList } from '../../api/projectApi';
import { fetchSkillList, fetchVideoList } from '../../api/portfolioApi';

const mockAuthHook = {
  boolIsLoggedInState: false,
  handleLogout: vi.fn(),
  handleLogin: vi.fn(),
  handleRegister: vi.fn(),
  strTokenState: null,
  objUserState: null,
};

const renderHome = (props = {}) => render(
  <HelmetProvider>
    <MemoryRouter>
      <Home
        onOpenContact={vi.fn()}
        onOpenLogin={vi.fn()}
        authHook={mockAuthHook}
        settings={null}
        {...props}
      />
    </MemoryRouter>
  </HelmetProvider>
);

beforeEach(() => {
  vi.clearAllMocks();
  fetchBlogList.mockResolvedValue({ data: [], error: null });
  fetchProjectList.mockResolvedValue({ data: [], error: null });
  fetchSkillList.mockResolvedValue({ data: [], error: null });
  fetchVideoList.mockResolvedValue({ data: [], error: null });
});

describe('Home page integration', () => {
  it('renders welcome overlay initially', () => {
    renderHome();
    expect(document.querySelector('.ath-wrapper')).toBeDefined();
  });

  it('renders hero section', () => {
    renderHome();
    expect(screen.getByText(/Designing virtual spaces/)).toBeDefined();
  });

  it('renders nav bar with LOG IN when not authenticated', () => {
    renderHome();
    expect(screen.getByText('LOG IN')).toBeDefined();
  });

  it('renders nav bar with LOG OUT when authenticated', () => {
    renderHome({
      authHook: { ...mockAuthHook, boolIsLoggedInState: true },
    });
    expect(screen.getByText('LOG OUT')).toBeDefined();
  });

  it('fetches blogs, projects, and skills on mount', async () => {
    renderHome();

    await waitFor(() => {
      expect(fetchBlogList).toHaveBeenCalledOnce();
      expect(fetchProjectList).toHaveBeenCalledOnce();
      expect(fetchSkillList).toHaveBeenCalledOnce();
    });
  });

  it('renders blog cards when API returns data', async () => {
    fetchBlogList.mockResolvedValueOnce({
      data: [
        { id: 1, strTitle: 'Trust in Discourse', strSummary: 'About trust', strThemeColor: '#10b981', strMediaUrl: null },
        { id: 2, strTitle: 'Verifiable Claims', strSummary: 'About claims', strThemeColor: '#3b82f6', strMediaUrl: null },
        { id: 3, strTitle: 'Source Attachment', strSummary: 'About sources', strThemeColor: '#10b981', strMediaUrl: null },
      ],
      error: null,
    });

    renderHome();

    await waitFor(() => {
      expect(screen.getByText('Trust in Discourse')).toBeDefined();
      expect(screen.getByText('Verifiable Claims')).toBeDefined();
      expect(screen.getByText('Source Attachment')).toBeDefined();
    });
  });

  it('renders skills in carousel when API returns data', async () => {
    fetchSkillList.mockResolvedValueOnce({
      data: [
        { id: 1, strTitle: 'React', strIconSvg: '<svg></svg>' },
        { id: 2, strTitle: 'Python', strIconSvg: null },
      ],
      error: null,
    });

    renderHome();

    await waitFor(() => {
      expect(screen.getAllByText('React').length).toBeGreaterThan(0);
    });
  });

  it('shows loading carousel when skills are empty', () => {
    renderHome();
    expect(screen.getAllByText('Loading Capabilities...').length).toBe(12);
  });

  it('renders merchandise section with local products', () => {
    renderHome();
    expect(screen.getByText(/Recent Contributions/)).toBeDefined();
  });

  it('renders all major sections', () => {
    renderHome();
    const main = document.querySelector('main');
    expect(main).toBeDefined();
    expect(main.children.length).toBeGreaterThanOrEqual(5);
  });

  it('handles API errors gracefully without crashing', async () => {
    fetchBlogList.mockResolvedValueOnce({ data: null, error: 'Failed' });
    fetchProjectList.mockResolvedValueOnce({ data: null, error: 'Failed' });
    fetchSkillList.mockResolvedValueOnce({ data: null, error: 'Failed' });

    renderHome();

    await waitFor(() => {
      expect(screen.getByText(/Designing virtual spaces/)).toBeDefined();
    });
  });
});
