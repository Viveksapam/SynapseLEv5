// Formats an analysis timestamp for display. Backend stores UTC without a
// timezone suffix, so we treat a naive ISO string as UTC before converting to
// the viewer's local time.
export const formatAnalyzedAt = (strTimestamp) => {
  if (!strTimestamp) return null;
  const strIso = /[zZ]|[+-]\d{2}:?\d{2}$/.test(strTimestamp) ? strTimestamp : `${strTimestamp}Z`;
  const objDate = new Date(strIso);
  if (Number.isNaN(objDate.getTime())) return null;
  return objDate.toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};
