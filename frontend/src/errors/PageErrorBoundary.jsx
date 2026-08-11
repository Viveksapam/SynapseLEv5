import React from 'react';
import PropTypes from 'prop-types';

class PageErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { boolHasErrorState: false };
  }

  static getDerivedStateFromError() {
    return { boolHasErrorState: true };
  }

  componentDidCatch(error, info) {
    console.error("Caught error:", error, info);
  }

  render() {
    if (this.state.boolHasErrorState) {
      return (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--ath-text-main)' }}>
          <h2>Something went wrong.</h2>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              background: '#fca5a5',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '16px',
              cursor: 'pointer',
              marginTop: '16px',
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

PageErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired
};

export default PageErrorBoundary;
