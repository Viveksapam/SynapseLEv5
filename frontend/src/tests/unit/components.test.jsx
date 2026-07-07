import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';

import SEO from '../../components/SEO';
import HomeHero from '../../Home/components/HomeHero';
import TopNavBar from '../../Home/components/TopNavBar';
import CapabilitiesCarousel from '../../Home/components/CapabilitiesCarousel';
import ContributionsSection from '../../Home/components/ContributionsSection';
import ProductGrid from '../../Projects/Merchandise/ProductGrid';
import CartDrawer from '../../Projects/Merchandise/CartDrawer';
import PageErrorBoundary from '../../errors/PageErrorBoundary';

const wrap = (ui) => render(
  <HelmetProvider>
    <MemoryRouter>{ui}</MemoryRouter>
  </HelmetProvider>
);

// ── SEO ─────────────────────────────────────────────────────────────────────

describe('SEO', () => {
  it('renders without crashing', () => {
    const { container } = wrap(<SEO />);
    expect(container).toBeDefined();
  });

  it('renders with custom props without crashing', () => {
    const { container } = wrap(<SEO title="Shop" description="Buy stuff" />);
    expect(container).toBeDefined();
  });
});

// ── HomeHero ────────────────────────────────────────────────────────────────

describe('HomeHero', () => {
  it('renders hero heading text', () => {
    wrap(<HomeHero boolAnimationsReadyState={false} />);
    expect(screen.getByText(/Designing virtual spaces/)).toBeDefined();
  });

  it('renders volume badge', () => {
    wrap(<HomeHero boolAnimationsReadyState={true} />);
    expect(screen.getByText(/V4\.02/)).toBeDefined();
  });

  it('applies pre-animate class when animations not ready', () => {
    const { container } = wrap(<HomeHero boolAnimationsReadyState={false} />);
    const title = container.querySelector('.ath-hero-title');
    expect(title.classList.contains('ath-pre-animate')).toBe(true);
  });

  it('applies fade-in class when animations ready', () => {
    const { container } = wrap(<HomeHero boolAnimationsReadyState={true} />);
    const title = container.querySelector('.ath-hero-title');
    expect(title.classList.contains('ath-fade-in-up')).toBe(true);
  });
});

// ── TopNavBar ───────────────────────────────────────────────────────────────

describe('TopNavBar', () => {
  const defaultProps = {
    boolIsLoggedInState: false,
    onOpenLogin: vi.fn(),
    handleLogout: vi.fn(),
  };

  it('renders brand name', () => {
    wrap(<TopNavBar {...defaultProps} />);
    expect(screen.getByText('Synapse LE')).toBeDefined();
  });

  it('shows LOG IN button when not logged in', () => {
    wrap(<TopNavBar {...defaultProps} />);
    expect(screen.getByText('LOG IN')).toBeDefined();
  });

  it('shows LOG OUT button when logged in', () => {
    wrap(<TopNavBar {...defaultProps} boolIsLoggedInState={true} />);
    expect(screen.getByText('LOG OUT')).toBeDefined();
  });

  it('calls onOpenLogin when LOG IN clicked', () => {
    const fn = vi.fn();
    wrap(<TopNavBar {...defaultProps} onOpenLogin={fn} />);
    fireEvent.click(screen.getByText('LOG IN'));
    expect(fn).toHaveBeenCalledOnce();
  });

  it('calls handleLogout when LOG OUT clicked', () => {
    const fn = vi.fn();
    wrap(<TopNavBar {...defaultProps} boolIsLoggedInState={true} handleLogout={fn} />);
    fireEvent.click(screen.getByText('LOG OUT'));
    expect(fn).toHaveBeenCalledOnce();
  });

  it('renders navigation links', () => {
    wrap(<TopNavBar {...defaultProps} />);
    const navLinks = document.querySelectorAll('.ath-nav-link');
    expect(navLinks.length).toBeGreaterThanOrEqual(3);
  });
});

// ── CapabilitiesCarousel ────────────────────────────────────────────────────

describe('CapabilitiesCarousel', () => {
  it('renders loading placeholders when skills empty', () => {
    const { container } = wrap(
      <CapabilitiesCarousel boolAnimationsReadyState={false} arrSkillsState={[]} onSelectSkill={vi.fn()} />
    );
    const items = container.querySelectorAll('.ath-carousel-item');
    expect(items.length).toBe(12);
    expect(screen.getAllByText('Loading Capabilities...').length).toBe(12);
  });

  it('renders skill items when data provided', () => {
    const skills = [
      { id: 1, strTitle: 'React', strIconSvg: '<svg></svg>' },
      { id: 2, strTitle: 'Python', strIconSvg: null },
    ];
    wrap(
      <CapabilitiesCarousel boolAnimationsReadyState={true} arrSkillsState={skills} onSelectSkill={vi.fn()} />
    );
    expect(screen.getAllByText('React').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Python').length).toBeGreaterThan(0);
  });

  it('calls onSelectSkill when skill clicked', () => {
    const fn = vi.fn();
    const skills = [{ id: 1, strTitle: 'React', strIconSvg: null }];
    wrap(
      <CapabilitiesCarousel boolAnimationsReadyState={true} arrSkillsState={skills} onSelectSkill={fn} />
    );
    fireEvent.click(screen.getAllByText('React')[0]);
    expect(fn).toHaveBeenCalledWith(skills[0]);
  });
});

// ── ContributionsSection ────────────────────────────────────────────────────

describe('ContributionsSection', () => {
  const blogs = [
    { id: 1, strTitle: 'Blog One', strSummary: 'Summary one', strCategory: 'Ethics', numReadTime: 8, strMediaUrl: null },
    { id: 2, strTitle: 'Blog Two', strSummary: 'Summary two', strCategory: 'Discovery', numReadTime: 12, strMediaUrl: '/test.jpg' },
    { id: 3, strTitle: 'Blog Three', strSummary: 'Summary three', strCategory: 'Ethics', numReadTime: 8, strMediaUrl: null },
    { id: 4, strTitle: 'Blog Four', strSummary: 'Should not show', strCategory: 'Ethics', numReadTime: 8, strMediaUrl: null },
  ];

  it('renders section heading', () => {
    wrap(<ContributionsSection arrBlogsState={blogs} />);
    expect(screen.getByText('Recent Contributions')).toBeDefined();
    expect(screen.getByText('Selected writing from Verisphere community')).toBeDefined();
  });

  it('renders only 3 blog cards', () => {
    const { container } = wrap(<ContributionsSection arrBlogsState={blogs} />);
    const cards = container.querySelectorAll('.ath-blog-card');
    expect(cards.length).toBe(3);
  });

  it('does not render 4th blog', () => {
    wrap(<ContributionsSection arrBlogsState={blogs} />);
    expect(screen.queryByText('Blog Four')).toBeNull();
  });

  it('shows featured articles label in footer', () => {
    wrap(<ContributionsSection arrBlogsState={blogs} />);
    expect(screen.getByText('featured articles')).toBeDefined();
  });

  it('renders no image for posts without strMediaUrl', () => {
    const { container } = wrap(<ContributionsSection arrBlogsState={blogs} />);
    const images = container.querySelectorAll('.ath-blog-img');
    expect(images.length).toBe(1);
  });

  it('uses provided strMediaUrl when available', () => {
    const { container } = wrap(<ContributionsSection arrBlogsState={blogs} />);
    const images = container.querySelectorAll('.ath-blog-img');
    expect(images[0].src).toContain('/test.jpg');
  });

  it('renders category and read time from the post data', () => {
    wrap(<ContributionsSection arrBlogsState={blogs} />);
    expect(screen.getAllByText(/Ethics/).length).toBe(2);
    expect(screen.getAllByText(/Discovery/).length).toBe(1);
    expect(screen.getAllByText(/08 Min Read/).length).toBe(2);
    expect(screen.getByText(/12 Min Read/)).toBeDefined();
  });

  it('falls back to Discovery / 12 min when category or read time is missing', () => {
    const post = { id: 9, strTitle: 'No Category Post', strSummary: 'Summary', strMediaUrl: null };
    wrap(<ContributionsSection arrBlogsState={[post]} />);
    expect(screen.getByText(/Discovery/)).toBeDefined();
    expect(screen.getByText(/12 Min Read/)).toBeDefined();
  });
});

// ── ProductGrid ─────────────────────────────────────────────────────────────

describe('ProductGrid', () => {
  const products = [
    { id: 1, strName: 'Hoodie', strCategory: 'Apparel', strDescription: 'Warm', numPrice: 45, strImage: '/h.jpg' },
    { id: 2, strName: 'Mug', strCategory: 'Accessories', strDescription: 'Ceramic', numPrice: 15, strImage: '/m.jpg' },
  ];

  it('renders all products when category is All', () => {
    wrap(<ProductGrid arrProducts={products} strSelectedCategory="All" handleAddToCart={vi.fn()} />);
    expect(screen.getByText('Hoodie')).toBeDefined();
    expect(screen.getByText('Mug')).toBeDefined();
  });

  it('filters by category', () => {
    wrap(<ProductGrid arrProducts={products} strSelectedCategory="Apparel" handleAddToCart={vi.fn()} />);
    expect(screen.getByText('Hoodie')).toBeDefined();
    expect(screen.queryByText('Mug')).toBeNull();
  });

  it('calls handleAddToCart when Add to Cart clicked', () => {
    const fn = vi.fn();
    wrap(<ProductGrid arrProducts={products} strSelectedCategory="All" handleAddToCart={fn} />);
    fireEvent.click(screen.getAllByText('Add to Cart')[0]);
    expect(fn).toHaveBeenCalledWith(products[0]);
  });

  it('displays prices', () => {
    wrap(<ProductGrid arrProducts={products} strSelectedCategory="All" handleAddToCart={vi.fn()} />);
    expect(screen.getByText('₹45')).toBeDefined();
    expect(screen.getByText('₹15')).toBeDefined();
  });
});

// ── CartDrawer ──────────────────────────────────────────────────────────────

describe('CartDrawer', () => {
  const defaultCartProps = {
    arrCart: [],
    boolIsOpen: true,
    handleClose: vi.fn(),
    handleUpdateQty: vi.fn(),
    handleRemove: vi.fn(),
    handleCheckout: vi.fn(),
  };

  it('returns null when closed', () => {
    const { container } = wrap(<CartDrawer {...defaultCartProps} boolIsOpen={false} />);
    expect(container.innerHTML).toBe('');
  });

  it('shows empty cart message when no items', () => {
    wrap(<CartDrawer {...defaultCartProps} />);
    expect(screen.getByText('Your cart is empty.')).toBeDefined();
  });

  it('renders cart items with details', () => {
    const cart = [{ id: 1, strName: 'Hoodie', numPrice: 45, numQuantity: 2, strImage: '/h.jpg' }];
    wrap(<CartDrawer {...defaultCartProps} arrCart={cart} />);
    expect(screen.getByText('Hoodie')).toBeDefined();
    expect(screen.getByText('₹45')).toBeDefined();
    expect(screen.getByText('2')).toBeDefined();
  });

  it('computes total correctly', () => {
    const cart = [
      { id: 1, strName: 'A', numPrice: 10, numQuantity: 3, strImage: '/a.jpg' },
      { id: 2, strName: 'B', numPrice: 20, numQuantity: 1, strImage: '/b.jpg' },
    ];
    wrap(<CartDrawer {...defaultCartProps} arrCart={cart} />);
    expect(screen.getByText('₹50')).toBeDefined();
  });

  it('calls handleClose when close button clicked', () => {
    const fn = vi.fn();
    wrap(<CartDrawer {...defaultCartProps} handleClose={fn} />);
    const closeBtn = screen.getByRole('button', { name: '' });
    fireEvent.click(closeBtn);
    expect(fn).toHaveBeenCalled();
  });

  it('calls handleCheckout when checkout button clicked', () => {
    const fn = vi.fn();
    const cart = [{ id: 1, strName: 'A', numPrice: 10, numQuantity: 1, strImage: '/a.jpg' }];
    wrap(<CartDrawer {...defaultCartProps} arrCart={cart} handleCheckout={fn} />);
    fireEvent.click(screen.getByText('Proceed to Checkout'));
    expect(fn).toHaveBeenCalledOnce();
  });
});

// ── PageErrorBoundary ───────────────────────────────────────────────────────

describe('PageErrorBoundary', () => {
  const ThrowError = () => {
    throw new Error('Test error');
  };

  it('renders children when no error', () => {
    wrap(
      <PageErrorBoundary>
        <p>Safe content</p>
      </PageErrorBoundary>
    );
    expect(screen.getByText('Safe content')).toBeDefined();
  });

  it('renders fallback UI when child throws', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    wrap(
      <PageErrorBoundary>
        <ThrowError />
      </PageErrorBoundary>
    );
    expect(screen.getByText('Something went wrong.')).toBeDefined();
    spy.mockRestore();
  });
});
