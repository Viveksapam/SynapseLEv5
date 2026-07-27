import { API_BASE } from '../../../api/config';
import { readToken } from '../../../hooks/useAuth';

const authHeaders = () => {
  const strToken = readToken();
  return strToken ? { Authorization: `Bearer ${strToken}` } : {};
};

export const createReport = async (strContentType, numContentId, strReason) => {
  const objResponse = await fetch(`${API_BASE}/verisphere/reports/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ content_type: strContentType, content_id: numContentId, reason: strReason }),
  });
  const objData = await objResponse.json().catch(() => ({}));
  if (!objResponse.ok) throw new Error(objData.detail || `Failed to submit report (${objResponse.status})`);
  return objData;
};

export const fetchOpenReports = async () => {
  const objResponse = await fetch(`${API_BASE}/verisphere/reports/`, {
    headers: { ...authHeaders() },
  });
  const objData = await objResponse.json().catch(() => ([]));
  if (!objResponse.ok) throw new Error(objData.detail || `Failed to load reports (${objResponse.status})`);
  return objData;
};

export const resolveReport = async (numReportId, strAction) => {
  const objResponse = await fetch(`${API_BASE}/verisphere/reports/${numReportId}/resolve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ action: strAction }),
  });
  const objData = await objResponse.json().catch(() => ({}));
  if (!objResponse.ok) throw new Error(objData.detail || `Failed to resolve report (${objResponse.status})`);
  return objData;
};
