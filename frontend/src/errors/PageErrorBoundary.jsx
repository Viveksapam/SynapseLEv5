import React from 'react';
import PropTypes from 'prop-types';

const CHUNK_ERROR_PATTERN = /dynamically imported module|Loading chunk|Importing a module script failed/i;
const CHUNK_RELOAD_FLAG = 'ath-chunk-reload-attempted';

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

    // Stale tab after a new deploy: the hashed chunk filename it's trying to
    // import no longer exists on the server. One forced reload fetches the
    // current index.html/chunks; the sessionStorage flag stops a retry loop
    // if the error turns out to be something else.
    if (CHUNK_ERROR_PATTERN.test(error?.message || '') && !sessionStorage.getItem(CHUNK_RELOAD_FLAG)) {
      sessionStorage.setItem(CHUNK_RELOAD_FLAG, '1');
      window.location.reload();
    }
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
