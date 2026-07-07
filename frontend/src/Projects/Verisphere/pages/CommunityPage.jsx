import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchPosts } from '../api/verisphereApi';
import { fetchCommunityDetail, postJoinCommunity, postLeaveCommunity, notifyCommunitiesUpdated } from '../api/communityApi';
import { useAuth } from '../../../hooks/useAuth';
import PostCard from '../components/PostCard';
import CommunityList from '../components/CommunityList';
import CreatePostForm from '../components/CreatePostForm';
import CommunityManagePanel from '../components/CommunityManagePanel';
import '../styles/VeriSphere.css';

function CommunityPage({ authHook }) {
    const { id } = useParams();
    const fallbackAuth = useAuth();
    const objAuthHook = authHook || fallbackAuth;
    const { boolIsLoggedInState, strTokenState } = objAuthHook;
    const [objCommunityState, setObjCommunityState] = useState(null);
    const [arrPostsState, setArrPostsState] = useState([]);
    const [boolIsLoadingState, setBoolIsLoadingState] = useState(true);
    const [boolIsJoiningState, setBoolIsJoiningState] = useState(false);

    const handleJoinToggle = async () => {
        if (!boolIsLoggedInState) { window.dispatchEvent(new CustomEvent('open-login')); return; }
        setBoolIsJoiningState(true);
        try {
            if (objCommunityState?.joined) await postLeaveCommunity(id);
            else await postJoinCommunity(id);
            notifyCommunitiesUpdated();
            await loadCommunityData();
        } catch (error) {
            alert(error.message || 'Failed to update membership');
        } finally {
            setBoolIsJoiningState(false);
        }
    };

    const loadCommunityData = async () => {
        setBoolIsLoadingState(true);
        try {
            const [communityData, postsData] = await Promise.all([
                fetchCommunityDetail(id),
                fetchPosts(id)
            ]);
            setObjCommunityState(communityData);
            setArrPostsState(postsData);
        } catch (error) {
            console.error("Error fetching community data:", error);
        } finally {
            setBoolIsLoadingState(false);
        }
    };

    useEffect(() => {
        loadCommunityData();
    }, [id]);

    if (boolIsLoadingState) return <div className="verisphere-loading">Loading Communities...</div>;
    if (!objCommunityState) return <div className="verisphere-empty-state">Forum not found.</div>;

    return (
        <div className="verisphere-home">
            {/* Enhanced Community Hero Design */}
            <div 
                className="verisphere-hero" 
                style={{ 
                    borderBottom: '1px solid rgba(88, 166, 255, 0.1)',
                    background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.05) 0%, rgba(88, 166, 255, 0.02) 100%)',
                    backdropFilter: 'blur(10px)',
                    position: 'relative',
                    overflow: 'hidden',
                    padding: '48px 24px'
                }}
            >
                {/* Decorative Background Elements */}
                <div style={{
                    position: 'absolute',
                    top: '-50%',
                    right: '-10%',
                    width: '300px',
                    height: '300px',
                    background: 'radial-gradient(circle, rgba(88, 166, 255, 0.1) 0%, transparent 70%)',
                    borderRadius: '50%',
                    zIndex: 0
                }}></div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '24px', position: 'relative', zIndex: 1, maxWidth: '1200px', margin: '0 auto' }}>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '16px',
                        background: 'linear-gradient(135deg, var(--v2-accent-1) 0%, #2b5d8f 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '32px',
                        color: 'white',
                        boxShadow: '0 8px 32px rgba(88, 166, 255, 0.3)'
                    }}>
                        {objCommunityState.strName.charAt(0).toUpperCase()}
                    </div>
                    
                    <div style={{ flex: 1 }}>
                        <h2 style={{ margin: '0 0 8px 0', fontSize: '2.5rem', fontWeight: 'bold', letterSpacing: '-0.02em', color: 'var(--v2-text-main)' }}>
                            {objCommunityState.strName}
                        </h2>
                        <p style={{ margin: '0 0 16px 0', color: 'var(--v2-text-muted)', fontSize: '1.1rem', maxWidth: '600px', lineHeight: '1.5' }}>
                            {objCommunityState.strDescription || 'A VeriSphere community dedicated to rational discourse.'}
                        </p>
                        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', fontSize: '0.9rem', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--v2-text-muted)', border: '1px solid var(--glass-border)', borderRadius: '10px', padding: '2px 10px' }}>
                                {objCommunityState.register === 'lounge' ? 'Lounge' : 'Library'}
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--v2-text-muted)' }}>
                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3fb950', display: 'inline-block' }}></span>
                                {objCommunityState.member_count || 0} member{objCommunityState.member_count === 1 ? '' : 's'}
                            </div>
                            <button
                                onClick={handleJoinToggle}
                                disabled={boolIsJoiningState || objCommunityState.boolCanModerate}
                                className="v2-btn v2-btn-primary"
                                style={{
                                    padding: '6px 16px',
                                    borderRadius: '20px',
                                    fontSize: '0.85rem',
                                    background: 'rgba(88, 166, 255, 0.1)',
                                    border: '1px solid rgba(88, 166, 255, 0.4)',
                                    color: 'var(--v2-accent-1)',
                                    opacity: objCommunityState.boolCanModerate ? 0.5 : 1,
                                }}
                            >
                                {boolIsJoiningState ? 'Updating...'
                                    : objCommunityState.boolCanModerate ? 'Creator'
                                    : objCommunityState.joined ? 'Leave' : 'Join'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="verisphere-layout-grid">
                <div className="verisphere-main-content">
                    <CreatePostForm numCommunityId={id} onPostCreated={loadCommunityData} />
                    
                    {arrPostsState.length === 0 ? (
                        <div className="verisphere-empty-state">
                            <p>No posts in this forum yet. Be the first to start a rational discussion!</p>
                        </div>
                    ) : (
                        <div className="verisphere-post-list">
                            {arrPostsState.map(objPost => (
                                <PostCard key={objPost.id} objPost={objPost} authHook={objAuthHook} />
                            ))}
                        </div>
                    )}
                </div>
                
                <div className="verisphere-sidebar">
                    {objCommunityState.boolCanModerate && (
                        <CommunityManagePanel community={objCommunityState} onUpdated={loadCommunityData} />
                    )}
                    <CommunityList />
                </div>
            </div>
        </div>
    );
}

export default CommunityPage;

