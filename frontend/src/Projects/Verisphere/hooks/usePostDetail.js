import { useState, useEffect, useCallback } from 'react';
import {
  fetchPostDetail, postCreateSource, postCreateComment, postAnalyzeComment, deleteComment, postAnalyzePost,
  fetchApprovedSources, postUpdatePost, updateComment, deletePost,
} from '../api/verisphereApi';




const withMinDuration = async (promiseFn, numMs) => {
  const [result] = await Promise.all([
    promiseFn(),
    new Promise((resolve) => setTimeout(resolve, numMs)),
  ]);
  return result;
};



const applyCommentAnalysis = (comments = [], numCommentId, data) =>
  comments.map((c) => {
    if (c.id === numCommentId) {
      return {
        ...c,
        strAiAnalysis: data.ai_summary,
        dictAiMetrics: { analyzed_at: data.analyzed_at },
      };
    }
    return c.replies?.length
      ? { ...c, replies: applyCommentAnalysis(c.replies, numCommentId, data) }
      : c;
  });

export const usePostDetail = (postId, strToken, boolIsLoggedIn) => {
  const [objPostState, setObjPostState] = useState(null);
  const [boolIsLoadingState, setBoolIsLoadingState] = useState(true);
  const [loadingCommentsState, setLoadingCommentsState] = useState({});
  const [boolIsAnalyzingPostState, setBoolIsAnalyzingPostState] = useState(false);
  const [strAnalysisPhaseState, setStrAnalysisPhaseState] = useState(null);

  const loadPost = useCallback(async () => {
    try {
      const data = await fetchPostDetail(postId);
      setObjPostState(data);
    } catch (objErr) {
      console.error('Error fetching post detail:', objErr);
    } finally {
      setBoolIsLoadingState(false);
    }
  }, [postId]);

  useEffect(() => { loadPost(); }, [loadPost]);

  const submitComment = async (objCommentData) => {
    if (!boolIsLoggedIn) return false;
    await postCreateComment(postId, objCommentData, strToken);
    await loadPost();
    return true;
  };

  const submitSource = async (objSourceData) => {
    if (!boolIsLoggedIn) return false;
    await postCreateSource(postId, objSourceData, strToken);
    await loadPost();
    return true;
  };

  const updatePost = async (objUpdates) => {
    await postUpdatePost(postId, objUpdates, strToken);
    await loadPost();
  };

  const removePost = async () => {
    await deletePost(postId, strToken);
  };

  const analyzeComment = async (numCommentId) => {
    setLoadingCommentsState((prev) => ({ ...prev, [numCommentId]: true }));
    try {
      const data = await postAnalyzeComment(numCommentId, strToken);
      setObjPostState((prev) => ({
        ...prev,
        comments: applyCommentAnalysis(prev.comments, numCommentId, data),
      }));
    } catch (objErr) {
      console.error('Failed to analyze comment', objErr);
      alert(objErr.message || 'Failed to analyze comment.');
    } finally {
      setLoadingCommentsState((prev) => ({ ...prev, [numCommentId]: false }));
    }
  };

  const handleDeleteComment = async (numCommentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;
    try {
      await deleteComment(postId, numCommentId, strToken);
      await loadPost();
    } catch (objErr) {
      console.error('Failed to delete comment', objErr);
      alert(objErr.message || 'Failed to delete comment');
    }
  };

  const handleUpdateComment = async (numCommentId, strContent) => {
    try {
      await updateComment(postId, numCommentId, strContent, strToken);
      await loadPost();
    } catch (objErr) {
      console.error('Failed to update comment', objErr);
      alert(objErr.message || 'Failed to update comment');
    }
  };

  
  const analyzePost = async () => {
    setBoolIsAnalyzingPostState(true);
    setStrAnalysisPhaseState('post');
    try {
      const data = await withMinDuration(() => postAnalyzePost(postId, strToken), 600);
      setObjPostState((prev) => ({
        ...prev,
        ai_summary: data.ai_summary,
        ai_context_guardrail: data.ai_context_guardrail,
        analysis_detail: data.analysis_detail,
        analyzed_at: data.analyzed_at,
      }));

      
      setStrAnalysisPhaseState('sources');
      const arrSources = await withMinDuration(() => fetchApprovedSources(postId), 600);
      setObjPostState((prev) => (prev ? { ...prev, sources: arrSources } : prev));

      
      setStrAnalysisPhaseState('reload');
      await withMinDuration(() => loadPost(), 600);

      
      setStrAnalysisPhaseState('done');
      await new Promise((resolve) => setTimeout(resolve, 900));
    } catch (objErr) {
      console.error('Failed to analyze post', objErr);
      alert(objErr.message || 'Failed to analyze this post. Please try again.');
    } finally {
      setBoolIsAnalyzingPostState(false);
      setStrAnalysisPhaseState(null);
    }
  };

  return {
    objPostState, boolIsLoadingState, loadingCommentsState, boolIsAnalyzingPostState, strAnalysisPhaseState,
    submitComment, submitSource, analyzeComment, analyzePost, handleDeleteComment, handleUpdateComment,
    updatePost, removePost,
    refetch: loadPost,
  };
};
