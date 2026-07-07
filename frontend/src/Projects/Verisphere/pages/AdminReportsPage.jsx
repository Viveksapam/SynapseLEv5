import React, { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { fetchOpenReports, resolveReport } from '../api/reportApi';

const cardStyle = {
  background: 'var(--cr-surface)', border: '1px solid var(--cr-border)', borderRadius: 'var(--cr-radius-card)',
  padding: '16px 18px', marginBottom: '14px',
};

const AdminReportsPage = ({ boolIsAdmin }) => {
  const [arrReportsState, setArrReportsState] = useState([]);
  const [boolIsLoadingState, setBoolIsLoadingState] = useState(true);
  const [strErrorState, setStrErrorState] = useState('');
  const [numResolvingIdState, setNumResolvingIdState] = useState(null);

  const loadReports = useCallback(async () => {
    setBoolIsLoadingState(true);
    try {
      setArrReportsState(await fetchOpenReports());
      setStrErrorState('');
    } catch (objErr) {
      setStrErrorState(objErr.message || 'Failed to load reports.');
    } finally {
      setBoolIsLoadingState(false);
    }
  }, []);

  useEffect(() => { if (boolIsAdmin) loadReports(); }, [boolIsAdmin, loadReports]);

  if (!boolIsAdmin) {
    return (
      <div className="verisphere-post-detail" style={{ maxWidth: '760px', margin: '20px auto', padding: '24px 28px' }}>
        <p>You don't have access to this page.</p>
        <Link to="/verisphere/feed">Back to feed</Link>
      </div>
    );
  }

  const handleResolve = async (numReportId, strAction) => {
    setNumResolvingIdState(numReportId);
    try {
      await resolveReport(numReportId, strAction);
      setArrReportsState((prev) => prev.filter((r) => r.id !== numReportId));
    } catch (objErr) {
      alert(objErr.message || 'Failed to resolve report.');
    } finally {
      setNumResolvingIdState(null);
    }
  };

  return (
    <div style={{ maxWidth: '760px', margin: '20px auto', padding: '0 20px' }}>
      <h1 style={{ fontFamily: 'var(--cr-font-heading)', fontSize: '1.6rem', color: 'var(--cr-text-main)' }}>
        Open reports
      </h1>

      {boolIsLoadingState && <p style={{ color: 'var(--cr-text-muted)' }}>Loading...</p>}
      {strErrorState && <p style={{ color: 'var(--cr-danger)' }}>{strErrorState}</p>}
      {!boolIsLoadingState && !strErrorState && arrReportsState.length === 0 && (
        <p style={{ color: 'var(--cr-text-muted)' }}>No open reports. All clear.</p>
      )}

      {arrReportsState.map((objReport) => (
        <div key={objReport.id} style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--cr-text-muted)', fontFamily: 'var(--cr-font-mono)' }}>
              {objReport.content_type} #{objReport.content_id}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--cr-text-muted)' }}>
              reported by {objReport.reporter_username || 'unknown'}
            </span>
          </div>
          <p style={{ margin: '0 0 0.6rem', color: 'var(--cr-text-main)', fontStyle: 'italic' }}>
            "{objReport.content_preview}"
          </p>
          <p style={{ margin: '0 0 0.8rem', color: 'var(--cr-text-main)', fontSize: '0.9rem' }}>
            <strong>Reason:</strong> {objReport.reason}
          </p>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => handleResolve(objReport.id, 'dismiss')}
              disabled={numResolvingIdState === objReport.id}
              className="verisphere-btn-outline"
              style={{ padding: '6px 14px', fontSize: '0.8rem' }}
            >
              Dismiss
            </button>
            <button
              onClick={() => {
                if (window.confirm('Permanently remove this content?')) handleResolve(objReport.id, 'remove_content');
              }}
              disabled={numResolvingIdState === objReport.id}
              className="verisphere-btn-outline"
              style={{ padding: '6px 14px', fontSize: '0.8rem', color: 'var(--cr-danger)', borderColor: 'var(--cr-danger)' }}
            >
              Remove content
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

AdminReportsPage.propTypes = {
  boolIsAdmin: PropTypes.bool,
};

export default AdminReportsPage;
