// Count all comments including nested replies
export const countAllComments = (comments) => {
  if (!comments || comments.length === 0) return 0;

  let total = comments.length;

  // Count all nested replies
  comments.forEach((comment) => {
    if (comment.replies && comment.replies.length > 0) {
      total += countAllComments(comment.replies); // Recursive count
    }
  });

  return total;
};
