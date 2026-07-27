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
          <button onClick={() => window.location.reload()}>Reload Page</button>
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
