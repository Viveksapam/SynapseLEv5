import { useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE } from '../../../api/config';

const SLOW_THRESHOLD_MS = 2500;
const HEALTH_TIMEOUT_MS = 45000;
const RETRY_DELAY_MS = 4000;
const MAX_ATTEMPTS = 6;

// Render's free tier spins the backend down after inactivity, so the first
// request after a while can take 30-60s. This pings a lightweight health
// endpoint and only surfaces a "waking up" state once it's actually slow,
// so normal warm-server loads never see it.
export const useBackendWakeUp = () => {
  const [strStatus, setStatus] = useState('checking');

  useEffect(() => {
    let isCancelled = false;
    let slowTimer = null;

    const attempt = async (numAttemptsLeft) => {
      slowTimer = setTimeout(() => {
        if (!isCancelled) setStatus('waking');
      }, SLOW_THRESHOLD_MS);

      try {
        await axios.get(`${API_BASE}/health/`, { timeout: HEALTH_TIMEOUT_MS });
        clearTimeout(slowTimer);
        if (!isCancelled) setStatus('ready');
      } catch (error) {
        clearTimeout(slowTimer);
        if (isCancelled) return;
        if (numAttemptsLeft <= 1) {
          setStatus('unreachable');
          return;
        }
        setStatus('waking');
        setTimeout(() => attempt(numAttemptsLeft - 1), RETRY_DELAY_MS);
      }
    };

    attempt(MAX_ATTEMPTS);

    return () => {
      isCancelled = true;
      clearTimeout(slowTimer);
    };
  }, []);

  return strStatus;
};
