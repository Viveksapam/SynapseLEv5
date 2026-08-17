import React from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';

const NotFoundPage = () => (
  <div style={{ minHeight: '100vh', background: '#0d0d10', color: '#f5f5f7', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
    <SEO title="Page not found | Synapse" robots="noindex, nofollow" />
    <div style={{ textAlign: 'center' }}>
      <h1 style={{ fontSize: '2rem', margin: '0 0 6px' }}>404 — Page not found</h1>
      <p style={{ color: '#8a8a94', fontSize: '0.95rem', marginBottom: '2rem' }}>
        The page you're looking for doesn't exist.
      </p>
      <Link to="/" style={{ color: '#fbbf24', fontSize: '0.95rem', textDecoration: 'none' }}>&larr; Back to Synapse LE</Link>
    </div>
  </div>
);

export default NotFoundPage;
