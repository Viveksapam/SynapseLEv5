export const normalizeEmbedUrl = (strUrl) => {
  if (!strUrl) return null;
  if (strUrl.includes('youtube.com/embed/')) return strUrl;

  if (strUrl.includes('instagram.com/')) {
    if (strUrl.includes('/embed')) return strUrl;
    return strUrl.replace(/\/$/, '') + '/embed/';
  }

  const objWatchMatch = strUrl.match(/[?&]v=([^&]+)/);
  if (objWatchMatch) return `https://www.youtube.com/embed/${objWatchMatch[1]}`;
  const objShortMatch = strUrl.match(/youtu\.be\/([^?&]+)/);
  if (objShortMatch) return `https://www.youtube.com/embed/${objShortMatch[1]}`;
  return strUrl;
};

export const isImageUrl = (strUrl) => {
  if (!strUrl) return false;
  return !!(strUrl.match(/\.(jpeg|jpg|gif|png|webp)(\?.*)?$/i) || strUrl.includes('images.unsplash.com'));
};

export const EXTENDED_EMOJIS = ['❤️', '👏', '🤗', '😂', '👽', '🛡️', '🥺', '😞', '🖕', '🤬'];
