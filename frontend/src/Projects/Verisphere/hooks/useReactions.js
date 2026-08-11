import { useState, useEffect, useCallback } from 'react';
import { fetchPostReactions, postToggleReaction } from '../api/verisphereApi';

export const useReactions = (postId, boolIsLoggedIn) => {
  const [objReactionsState, setReactions] = useState({});
  const [objUserReactedState, setUserReacted] = useState({});
  const [boolShowPickerState, setShowPicker] = useState(false);

  useEffect(() => {
    let boolMounted = true;
    fetchPostReactions(postId).then((data) => {
      if (!boolMounted || !data) return;
      setReactions(data.reactions || {});
      setUserReacted(data.user_reacted || {});
    });
    return () => { boolMounted = false; };
  }, [postId]);

  useEffect(() => {
    if (!boolShowPickerState) return;
    const handleOutsideClick = () => setShowPicker(false);
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [boolShowPickerState]);

  const handleReact = useCallback(async (strEmoji) => {
    if (!boolIsLoggedIn) {
      setShowPicker(false);
      window.dispatchEvent(new CustomEvent('open-login'));
      return;
    }
    const boolHasReacted = objUserReactedState[strEmoji];
    const numActive = Object.values(objUserReactedState).filter(Boolean).length;
    if (!boolHasReacted && numActive >= 3) {
      alert('You can only give a maximum of 3 reactions per post.');
      setShowPicker(false);
      return;
    }
    setReactions((prev) => ({
      ...prev,
      [strEmoji]: (prev[strEmoji] || 0) + (boolHasReacted ? -1 : 1),
    }));
    setUserReacted((prev) => ({ ...prev, [strEmoji]: !prev[strEmoji] }));
    setShowPicker(false);

    const objRes = await postToggleReaction(postId, strEmoji);
    if (objRes?.status === 'error') {
      alert(objRes.message || 'Failed to record reaction.');
      setReactions((prev) => ({
        ...prev,
        [strEmoji]: (prev[strEmoji] || 0) + (boolHasReacted ? 1 : -1),
      }));
      setUserReacted((prev) => ({ ...prev, [strEmoji]: boolHasReacted }));
    }
  }, [postId, objUserReactedState, boolIsLoggedIn]);

  const arrTopReactions = Object.entries(objReactionsState)
    .filter(([, numCount]) => numCount > 0)
    .sort((a, b) => b[1] - a[1]);

  return {
    objReactionsState, objUserReactedState, boolShowPickerState,
    setShowPicker, handleReact, arrTopReactions,
  };
};
