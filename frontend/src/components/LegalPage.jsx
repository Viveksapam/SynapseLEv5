import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

const LegalPage = ({ title, updatedDate, children }) => (
  <div style={{ minHeight: '100vh', background: '#0d0d10', color: '#f5f5f7', padding: '48px 20px' }}>
    <div style={{ maxWidth: '720px', margin: '0 auto' }}>
      <Link to="/" style={{ color: '#8a8a94', fontSize: '13px', textDecoration: 'none' }}>&larr; Back to Synapse LE</Link>
      <h1 style={{ fontSize: '2rem', margin: '20px 0 6px' }}>{title}</h1>
      <p style={{ color: '#8a8a94', fontSize: '13px', marginBottom: '2.5rem' }}>Last updated {updatedDate}</p>
      <div style={{ fontSize: '0.95rem', lineHeight: '1.7', color: '#c2c2c9' }}>
        {children}
      </div>
    </div>
  </div>
);

LegalPage.propTypes = {
  title: PropTypes.string.isRequired,
  updatedDate: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};

export default LegalPage;
