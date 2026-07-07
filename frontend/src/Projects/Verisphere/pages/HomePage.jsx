import React, { useEffect, useState, useCallback } from 'react';
import { fetchPosts } from '../api/verisphereApi';
import PostCard from '../components/PostCard';
import CommunityList from '../components/CommunityList';
import CreatePostForm from '../components/CreatePostForm';
import { useActivityTracker } from '../../../hooks/useActivityTracker';
import '../styles/VeriSphere.css';

function HomePage({ authHook }) {
    const [arrPostsState, setArrPostsState] = useState([]);
    const [boolIsLoadingState, setBoolIsLoadingState] = useState(true);
    const { trackEvent } = useActivityTracker();

    const loadPosts = useCallback(async () => {
        try {
            const data = await fetchPosts();
            setArrPostsState(data);
        } catch (error) {
            console.error("Error fetching posts:", error);
        } finally {
            setBoolIsLoadingState(false);
        }
    }, []);

    useEffect(() => {
        loadPosts();
        trackEvent('verisphere_home_view');
    }, [loadPosts, trackEvent]);

    if (boolIsLoadingState) return null;

    return (
        <div className="verisphere-home">
            {/* ── Main feed layout ── */}
            <div className="verisphere-layout-grid" style={{ paddingTop: '20px' }}>
                <div className="verisphere-main-content">
                    <CreatePostForm onPostCreated={loadPosts} />

                    {arrPostsState.length === 0 ? (
                        <div className="verisphere-empty-state">
                            <p>No posts yet. Be the first to start a rational discussion!</p>
                        </div>
                    ) : (
                        <div className="verisphere-post-list">
                            {arrPostsState.map(objPost => (
                                <PostCard
                                    key={objPost.id}
                                    objPost={objPost}
                                    authHook={authHook}
                                    onView={() => trackEvent('post_view', { post_id: objPost.id, title: objPost.title })}
                                />
                            ))}
                        </div>
                    )}
                </div>

                <div className="verisphere-sidebar">
                    <CommunityList />
                </div>
            </div>
        </div>
    );
}

export default HomePage;

