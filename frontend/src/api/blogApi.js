import apiClient from './apiClient';

export const fetchBlogList = async () => {
  try {
    const data = await apiClient.get('/verisphere/recent-contributions/');
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error.message || "Failed to fetch blogs" };
  }
};

export const fetchBlogComments = async (blogId) => {
  try {
    const data = await apiClient.get(`/verisphere/blogs/${blogId}/comments/`);
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error.message || "Failed to fetch blog comments" };
  }
};

export const postBlogComment = async (blogId, strAuthor, strContent) => {
  try {
    const data = await apiClient.post(`/verisphere/blogs/${blogId}/comments/`, {
      strAuthor,
      strContent
    });
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error.message || "Failed to post blog comment" };
  }
};
