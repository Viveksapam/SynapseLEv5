import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import ShopPage from '../../Projects/Merchandise/ShopPage';

vi.mock('../../api/productApi', () => ({
  fetchProductList: vi.fn(),
}));

vi.mock('../../api/paymentApi', () => ({
  postCreateRazorpayOrder: vi.fn(),
  postVerifyRazorpaySignature: vi.fn(),
}));

vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    boolIsLoggedInState: true,
    strTokenState: 'test_token',
    objUserState: { username: 'tester', email: 'test@test.com' },
  })),
}));

import { fetchProductList } from '../../api/productApi';

const mockProducts = [
  { id: 1, strName: 'Dev Hoodie', strCategory: 'Apparel', strDescription: 'Warm hoodie', numPrice: 45, strImage: '/h.jpg', strImageUrl: '/h.jpg', boolInStock: true },
  { id: 2, strName: 'Code Mug', strCategory: 'Accessories', strDescription: 'Ceramic mug', numPrice: 15, strImage: '/m.jpg', strImageUrl: '/m.jpg', boolInStock: true },
  { id: 3, strName: 'Sticker Pack', strCategory: 'Memes', strDescription: 'Vinyl stickers', numPrice: 10, strImage: '/s.jpg', strImageUrl: '/s.jpg', boolInStock: true },
];

const renderShop = () => render(
  <HelmetProvider>
    <MemoryRouter>
      <ShopPage />
    </MemoryRouter>
  </HelmetProvider>
);

beforeEach(() => {
  vi.clearAllMocks();
  fetchProductList.mockResolvedValue({ data: mockProducts, error: null });
});

describe('ShopPage integration', () => {
  it('shows loading state initially then renders products', async () => {
    renderShop();
    expect(screen.getByText(/Loading latest merchandise/)).toBeDefined();

    await waitFor(() => {
      expect(screen.getByText('Dev Hoodie')).toBeDefined();
      expect(screen.getByText('Code Mug')).toBeDefined();
      expect(screen.getByText('Sticker Pack')).toBeDefined();
    });
  });

  it('filters products by category', async () => {
    renderShop();

    await waitFor(() => {
      expect(screen.getByText('Dev Hoodie')).toBeDefined();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Accessories' }));

    expect(screen.getByText('Code Mug')).toBeDefined();
    expect(screen.queryByText('Dev Hoodie')).toBeNull();
    expect(screen.queryByText('Sticker Pack')).toBeNull();
  });

  it('shows All products when All filter clicked', async () => {
    renderShop();

    await waitFor(() => {
      expect(screen.getByText('Dev Hoodie')).toBeDefined();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Accessories' }));
    expect(screen.queryByText('Dev Hoodie')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'All' }));
    expect(screen.getByText('Dev Hoodie')).toBeDefined();
    expect(screen.getByText('Code Mug')).toBeDefined();
  });

  it('adds item to cart and opens cart drawer', async () => {
    renderShop();

    await waitFor(() => {
      expect(screen.getByText('Dev Hoodie')).toBeDefined();
    });

    fireEvent.click(screen.getAllByText('Add to Cart')[0]);

    await waitFor(() => {
      expect(screen.getByText('Shopping Cart (1)')).toBeDefined();
    });

    const cartDrawer = document.querySelector('.cart-drawer');
    expect(cartDrawer).toBeDefined();
  });

  it('increments quantity when same item added twice', async () => {
    renderShop();

    await waitFor(() => {
      expect(screen.getByText('Dev Hoodie')).toBeDefined();
    });

    fireEvent.click(screen.getAllByText('Add to Cart')[0]);

    const closeBtn = document.querySelector('.btn-close-cart');
    if (closeBtn) fireEvent.click(closeBtn);

    fireEvent.click(screen.getAllByText('Add to Cart')[0]);

    await waitFor(() => {
      expect(screen.getByText('Shopping Cart (1)')).toBeDefined();
    });

    const qtySpan = document.querySelector('.cart-item-qty-actions span');
    expect(qtySpan.textContent).toBe('2');
  });

  it('renders page title and subtitle', async () => {
    renderShop();
    expect(screen.getByText('Exclusive Apparel & Merchandise')).toBeDefined();
    expect(screen.getByText(/Premium quality developer gear/)).toBeDefined();
  });

  it('renders category filter buttons', async () => {
    renderShop();
    expect(screen.getByText('All')).toBeDefined();
    expect(screen.getByText('Apparel')).toBeDefined();
    expect(screen.getByText('Accessories')).toBeDefined();
    expect(screen.getByText('Memes')).toBeDefined();
  });
});
