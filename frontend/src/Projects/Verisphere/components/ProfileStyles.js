export const profileCardStyle = {
  background: 'var(--cr-surface)',
  border: '1px solid var(--cr-border)',
  borderRadius: 'var(--cr-radius-card)',
  boxShadow: 'var(--cr-shadow-card)',
  padding: '18px 20px',
};

export const profileLabelStyle = {
  fontSize: '15px',
  fontWeight: 600,
  fontFamily: 'var(--cr-font-heading)',
  color: 'var(--cr-text-main)',
  marginBottom: '12px',
};

export const profileInputStyle = {
  flex: 1,
  background: 'var(--cr-surface-raised)',
  border: '1px solid var(--cr-border)',
  color: 'var(--cr-text-main)',
  borderRadius: 'var(--cr-radius-input)',
  padding: '8px 12px',
  fontFamily: 'var(--cr-font-body)',
  fontSize: '13.5px',
  outline: 'none',
};

export const profileBtnBase = {
  padding: '7px 16px',
  borderRadius: 'var(--cr-radius-input)',
  fontFamily: 'var(--cr-font-heading)',
  fontSize: '13px',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'opacity 0.15s',
};

export const formatDate = (strIso) => {
  if (!strIso) return 'N/A';
  const d = new Date(strIso);
  return isNaN(d) ? 'N/A' : d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};
