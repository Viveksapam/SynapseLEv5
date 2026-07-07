import React, { useEffect, useState, useCallback } from 'react';
import { fetchPosts } from '../api/verisphereApi';
import PostCard from '../components/PostCard';
import CommunityList from '../components/CommunityList';
import CreatePostForm from '../components/CreatePostForm';
import { useActivityTracker } from '../../../hooks/useActivityTracker';
import '../styles/VeriSphere.css';

const STR_SIGNUP_PROMPT_KEY = 'vs_ai_signup_prompt_shown';

function HomePage({ authHook }) {
    const [arrPostsState, setArrPostsState] = useState([]);
    const [boolIsLoadingState, setBoolIsLoadingState] = useState(true);
    const [boolShowSignupPromptState, setBoolShowSignupPromptState] = useState(false);
    const { trackEvent } = useActivityTracker();
    const { boolIsLoggedInState } = authHook || {};

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

    useEffect(() => {
        if (!boolIsLoggedInState && !sessionStorage.getItem(STR_SIGNUP_PROMPT_KEY)) {
            setBoolShowSignupPromptState(true);
            sessionStorage.setItem(STR_SIGNUP_PROMPT_KEY, '1');
        }
    }, [boolIsLoggedInState]);

    const handleSignUpClick = () => {
        setBoolShowSignupPromptState(false);
        window.dispatchEvent(new CustomEvent('open-login'));
    };

    if (boolIsLoadingState) return null;

    return (
        <div className="verisphere-home">
            {boolShowSignupPromptState && (
                <div
                    onClick={() => setBoolShowSignupPromptState(false)}
                    style={{
                        position: 'fixed', inset: 0, zIndex: 200,
                        background: 'rgba(0,0,0,0.5)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: '1rem',
                    }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            background: 'var(--v2-bg)',
                            border: '1px solid var(--glass-border)',
                            borderRadius: '16px',
                            padding: '2rem',
                            maxWidth: '380px',
                            width: '100%',
                            textAlign: 'center',
                            boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
                        }}
                    >
                        <p style={{ color: 'var(--v2-text-main)', fontSize: '1.05rem', margin: '0 0 1.5rem 0', lineHeight: '1.5' }}>
                            Please sign up to use AI features.
                        </p>
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                            <button
                                onClick={handleSignUpClick}
                                style={{
                                    background: 'var(--v2-accent-1)', color: '#fff', border: 'none',
                                    padding: '10px 24px', borderRadius: '100px', fontWeight: 600,
                                    fontSize: '0.9rem', cursor: 'pointer',
                                }}
                            >
                                Sign Up
                            </button>
                            <button
                                onClick={() => setBoolShowSignupPromptState(false)}
                                style={{
                                    background: 'transparent', color: 'var(--v2-text-muted)',
                                    border: '1px solid var(--glass-border)',
                                    padding: '10px 24px', borderRadius: '100px', fontWeight: 600,
                                    fontSize: '0.9rem', cursor: 'pointer',
                                }}
                            >
                                Maybe later
                            </button>
                        </div>
                    </div>
                </div>
            )}

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

