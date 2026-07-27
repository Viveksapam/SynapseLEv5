import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../Projects/Verisphere/api/reportApi', () => ({
  createReport: vi.fn(() => Promise.resolve({ message: 'Report submitted. A moderator will review it.' })),
  fetchOpenReports: vi.fn(() => Promise.resolve([
    { id: 1, content_type: 'post', content_id: 1005, reason: 'spam', reporter_username: 'alice', content_preview: 'Some post title' },
  ])),
  resolveReport: vi.fn(() => Promise.resolve({ message: 'Report resolved' })),
}));

import ReportButton from '../../Projects/Verisphere/components/ReportButton';
import AdminReportsPage from '../../Projects/Verisphere/pages/AdminReportsPage';
import { createReport, resolveReport } from '../../Projects/Verisphere/api/reportApi';

describe('Report button', () => {
  it('opens login modal instead of the composer when logged out', () => {
    render(<ReportButton contentType="post" contentId={1} boolIsLoggedIn={false} />);
    const spy = vi.fn();
    window.addEventListener('open-login', spy);
    fireEvent.click(screen.getByText('Report'));
    expect(spy).toHaveBeenCalled();
    expect(screen.queryByPlaceholderText('Why are you reporting this?')).toBeNull();
  });

  it('submits a report when logged in', async () => {
    render(<ReportButton contentType="comment" contentId={42} boolIsLoggedIn />);
    fireEvent.click(screen.getByText('Report'));
    fireEvent.change(screen.getByPlaceholderText('Why are you reporting this?'), { target: { value: 'harassment' } });
    fireEvent.click(screen.getByText('Submit'));

    await waitFor(() => {
      expect(createReport).toHaveBeenCalledWith('comment', 42, 'harassment');
      expect(screen.getByText('Report submitted. A moderator will review it.')).toBeTruthy();
    });
  });
});

describe('AdminReportsPage', () => {
  it('blocks non-admins', () => {
    render(<MemoryRouter><AdminReportsPage boolIsAdmin={false} /></MemoryRouter>);
    expect(screen.getByText("You don't have access to this page.")).toBeTruthy();
  });

  it('lists open reports and resolves them for admins', async () => {
    render(<MemoryRouter><AdminReportsPage boolIsAdmin /></MemoryRouter>);
    await waitFor(() => expect(screen.getByText('"Some post title"')).toBeTruthy());
    fireEvent.click(screen.getByText('Dismiss'));
    await waitFor(() => {
      expect(resolveReport).toHaveBeenCalledWith(1, 'dismiss');
    });
  });
});
