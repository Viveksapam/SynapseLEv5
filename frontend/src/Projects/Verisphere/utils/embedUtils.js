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

export const seedInitialReactions = (postId) => {
  if (postId === 1004 || postId === '1004' || postId === 'blog_1004') {
    return { '❤️': 45, '👽': 12, '😂': 95, '🤗': 18, '👏': 27 };
  }
  if (postId === 1002 || postId === '1002' || postId === 'blog_1002') {
    return { '❤️': 89, '😂': 12, '🥺': 34, '🖕': 5, '🤬': 3 };
  }
  return { '❤️': 15, '🛡️': 6, '😂': 8, '😞': 4 };
};
