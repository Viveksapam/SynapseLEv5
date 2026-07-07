export const getAttemptData = (strStorageKey, strSlideId) => {
  try {
    const strRaw = localStorage.getItem(strStorageKey);
    const objAll = strRaw ? JSON.parse(strRaw) : {};
    return objAll[strSlideId] || { count: 0, firstAttemptTime: null };
  } catch {
    return { count: 0, firstAttemptTime: null };
  }
};

export const saveAttemptData = (strStorageKey, strSlideId, objAttemptData) => {
  try {
    const strRaw = localStorage.getItem(strStorageKey);
    const objAll = strRaw ? JSON.parse(strRaw) : {};
    objAll[strSlideId] = objAttemptData;
    localStorage.setItem(strStorageKey, JSON.stringify(objAll));
  } catch { /* storage unavailable */ }
};

export const getTimeRemaining = (numFirstAttemptTime, numCooldownMs) => {
  const numElapsed = Date.now() - numFirstAttemptTime;
  const numRemaining = numCooldownMs - numElapsed;
  if (numRemaining <= 0) return null;
  const numHours = Math.floor(numRemaining / (1000 * 60 * 60));
  const numMinutes = Math.floor((numRemaining % (1000 * 60 * 60)) / (1000 * 60));
  return `${numHours}h ${numMinutes}m`;
};
