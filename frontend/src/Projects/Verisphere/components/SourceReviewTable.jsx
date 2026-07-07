import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { fetchPendingSources, postApproveSource } from '../api/verisphereApi';

const SourceReviewTable = ({ postId, boolIsAdmin, strToken, onApproved }) => {
  const [arrPendingSourcesState, setArrPendingSourcesState] = useState([]);
  const [boolIsLoadingState, setBoolIsLoadingState] = useState(true);
  const [numApprovingIdState, setNumApprovingIdState] = useState(null);

  const loadPending = useCallback(async () => {
    setBoolIsLoadingState(true);
    const arrPending = await fetchPendingSources(postId);
    setArrPendingSourcesState(arrPending);
    setBoolIsLoadingState(false);
  }, [postId]);

  useEffect(() => { loadPending(); }, [loadPending]);

  const handleApprove = async (numSourceId) => {
    setNumApprovingIdState(numSourceId);
    const objResult = await postApproveSource(numSourceId, strToken);
    if (objResult) {
      await loadPending();
      if (onApproved) onApproved();
    } else {
      alert('Failed to approve source.');
    }
    setNumApprovingIdState(null);
  };

  if (boolIsLoadingState) {
    return <p style={{ fontSize: '0.85rem', color: 'var(--cr-text-muted)', margin: 0 }}>Loading sources in review...</p>;
  }

  if (arrPendingSourcesState.length === 0) {
    return <p style={{ fontSize: '0.85rem', color: 'var(--cr-text-muted)', fontStyle: 'italic', margin: 0 }}>No sources currently in review.</p>;
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--cr-border)' }}>
            <th style={{ padding: '6px 8px', color: 'var(--cr-text-muted)', fontWeight: 'normal' }}>Article Name</th>
            <th style={{ padding: '6px 8px', color: 'var(--cr-text-muted)', fontWeight: 'normal' }}>Link</th>
            <th style={{ padding: '6px 8px', color: 'var(--cr-text-muted)', fontWeight: 'normal' }}>Submitted by</th>
            {boolIsAdmin && <th style={{ padding: '6px 8px', color: 'var(--cr-text-muted)', fontWeight: 'normal' }}>Action</th>}
          </tr>
        </thead>
        <tbody>
          {arrPendingSourcesState.map((objSource) => (
            <tr key={objSource.id} style={{ borderBottom: '1px solid var(--cr-border)' }}>
              <td style={{ padding: '8px', color: 'var(--cr-text-main)' }}>{objSource.strTitle}</td>
              <td style={{ padding: '8px' }}>
                <a href={objSource.strUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--cr-text-main)', textDecoration: 'underline', wordBreak: 'break-all' }}>
                  {objSource.strUrl.length > 40 ? objSource.strUrl.substring(0, 40) + '...' : objSource.strUrl}
                </a>
              </td>
              <td style={{ padding: '8px', color: 'var(--cr-text-muted)' }}>{objSource.strAuthor || 'Anonymous'}</td>
              {boolIsAdmin && (
                <td style={{ padding: '8px' }}>
                  <button
                    onClick={() => handleApprove(objSource.id)}
                    disabled={numApprovingIdState === objSource.id}
                    className="verisphere-btn-outline"
                    style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                  >
                    {numApprovingIdState === objSource.id ? 'Approving...' : 'Approve'}
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

SourceReviewTable.propTypes = {
  postId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  boolIsAdmin: PropTypes.bool,
  strToken: PropTypes.string,
  onApproved: PropTypes.func,
};

export default SourceReviewTable;
