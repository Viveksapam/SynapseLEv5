import { useState, useEffect, useCallback } from 'react';
import { fetchNotifications, fetchUnreadCount, postMarkAllRead } from '../api/engagementApi';

// Poll cadence mirrors the activity tracker's flush interval order of magnitude -
// notifications are a return trigger, not a chat; 60s is plenty at current scale.
const POLL_INTERVAL_MS = 60000;

export const useNotifications = (boolIsLoggedIn) => {
  const [numUnreadState, setNumUnreadState] = useState(0);
  const [arrNotificationsState, setArrNotificationsState] = useState([]);
  const [boolPanelOpenState, setBoolPanelOpenState] = useState(false);

  useEffect(() => {
    if (!boolIsLoggedIn) {
      setNumUnreadState(0);
      setArrNotificationsState([]);
      setBoolPanelOpenState(false);
      return undefined;
    }
    let boolCancelled = false;
    const poll = async () => {
      const numCount = await fetchUnreadCount();
      if (!boolCancelled) setNumUnreadState(numCount);
    };
    poll();
    const numTimer = setInterval(poll, POLL_INTERVAL_MS);
    return () => { boolCancelled = true; clearInterval(numTimer); };
  }, [boolIsLoggedIn]);

  const togglePanel = useCallback(async () => {
    const boolOpening = !boolPanelOpenState;
    setBoolPanelOpenState(boolOpening);
    if (!boolOpening) return;
    const arrItems = await fetchNotifications();
    setArrNotificationsState(arrItems);
    // Opening the panel counts as reading everything in it.
    if (arrItems.some((n) => !n.read_at)) {
      await postMarkAllRead();
    }
    setNumUnreadState(0);
  }, [boolPanelOpenState]);

  const closePanel = useCallback(() => setBoolPanelOpenState(false), []);

  return { numUnreadState, arrNotificationsState, boolPanelOpenState, togglePanel, closePanel };
};
