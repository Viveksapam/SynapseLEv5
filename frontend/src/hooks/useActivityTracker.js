/**
 * useActivityTracker.js
 * 
 * Silently records user activity events for the AI Presence Engine.
 * All data is stored in localStorage (anonymous) — nothing is PII.
 * Batched events are POSTed to /api/activity/log/ every 30 seconds.
 * 
 * Usage:
 *   const { trackEvent } = useActivityTracker();
 *   trackEvent('project_click', { project: 'synapse' });
 */

import { useCallback, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const SESSION_KEY = 'synapse_session';
const BATCH_KEY = 'synapse_event_batch';
const BACKEND = 'http://127.0.0.1:8000';

// ── Session management ──────────────────────────────────────────────────────
function readSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || '{}');
  } catch { return {}; }
}

function writeSession(updates) {
  try {
    const current = readSession();
    localStorage.setItem(SESSION_KEY, JSON.stringify({ ...current, ...updates }));
  } catch { /* ignore */ }
}

function addToBatch(event) {
  try {
    const batch = JSON.parse(localStorage.getItem(BATCH_KEY) || '[]');
    batch.push({ ...event, ts: Date.now() });
    // Keep only last 50 events to avoid bloat
    if (batch.length > 50) batch.splice(0, batch.length - 50);
    localStorage.setItem(BATCH_KEY, JSON.stringify(batch));
  } catch { /* ignore */ }
}

function flushBatch() {
  try {
    const batch = JSON.parse(localStorage.getItem(BATCH_KEY) || '[]');
    if (!batch.length) return;
    localStorage.removeItem(BATCH_KEY);

    // Fire-and-forget POST
    fetch(`${BACKEND}/api/activity/log/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: readSession().session_id,
        events: batch,
      }),
      keepalive: true,
    }).catch(() => {
      // If backend isn't up, silently restore — don't lose events
      try {
        const existing = JSON.parse(localStorage.getItem(BATCH_KEY) || '[]');
        localStorage.setItem(BATCH_KEY, JSON.stringify([...batch, ...existing].slice(0, 50)));
      } catch { /* ignore */ }
    });
  } catch { /* ignore */ }
}

// ── Generate/retrieve anonymous session ID ──────────────────────────────────
function ensureSessionId() {
  const s = readSession();
  if (!s.session_id) {
    const id = `s_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    writeSession({ session_id: id });
    return id;
  }
  return s.session_id;
}

// ── Scroll depth tracker ────────────────────────────────────────────────────
function useScrollDepth(trackEvent, path) {
  const milestones = useRef(new Set());

  useEffect(() => {
    milestones.current.clear();
    const handler = () => {
      const pct = Math.round(
        (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
      );
      [25, 50, 75, 100].forEach(m => {
        if (pct >= m && !milestones.current.has(m)) {
          milestones.current.add(m);
          trackEvent('scroll_depth', { depth: m, page: path });
        }
      });
    };
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, [trackEvent, path]);
}

// ── Time on page tracker ────────────────────────────────────────────────────
function useTimeOnPage(trackEvent, path) {
  const startRef = useRef(Date.now());

  useEffect(() => {
    startRef.current = Date.now();
    return () => {
      const seconds = Math.round((Date.now() - startRef.current) / 1000);
      if (seconds > 3) {
        trackEvent('time_on_page', { seconds, page: path });
      }
    };
  }, [path]); // eslint-disable-line
}

// ── Main hook ───────────────────────────────────────────────────────────────
export function useActivityTracker() {
  const location = useLocation();
  const path = location.pathname;

  // Opt-out check
  const isOptedOut = () => localStorage.getItem('synapse_no_track') === 'true';

  // Core track function
  const trackEvent = useCallback((eventType, data = {}) => {
    if (isOptedOut()) return;
    const event = { type: eventType, page: path, ...data };
    addToBatch(event);
    writeSession({ last_action: `${eventType}:${path}` });
  }, [path]);

  // Initialize session on first mount
  useEffect(() => {
    if (isOptedOut()) return;
    const session = readSession();
    const sessionId = ensureSessionId();
    const now = new Date().toISOString().split('T')[0];

    writeSession({
      visit_count: (session.visit_count || 0) + 1,
      last_visit_date: now,
    });

    trackEvent('page_view', { title: document.title });
  }, [path]); // track each route change

  // Flush batch every 30 seconds
  useEffect(() => {
    if (isOptedOut()) return;
    const interval = setInterval(flushBatch, 30_000);
    // Also flush on page unload
    window.addEventListener('beforeunload', flushBatch);
    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', flushBatch);
    };
  }, []);

  // Sub-trackers
  useScrollDepth(trackEvent, path);
  useTimeOnPage(trackEvent, path);

  return { trackEvent };
}

