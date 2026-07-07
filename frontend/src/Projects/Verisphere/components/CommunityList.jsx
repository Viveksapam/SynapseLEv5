import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchCommunities } from '../api/communityApi';

import CreateCommunityForm from './CreateCommunityForm';

function CommunityList() {
    const [arrCommunitiesState, setArrCommunitiesState] = useState([]);
    const [boolIsLoadingState, setBoolIsLoadingState] = useState(true);

    const loadCommunities = async () => {
        try {
            const data = await fetchCommunities();
            setArrCommunitiesState(data);
        } catch (error) {
            console.error("Error fetching communities:", error);
        } finally {
            setBoolIsLoadingState(false);
        }
    };

    useEffect(() => {
        loadCommunities();
    }, []);

    if (boolIsLoadingState) return <div className="verisphere-sidebar-box">Loading forums...</div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="verisphere-sidebar-box" style={{ padding: '0', overflow: 'hidden' }}>
                <h3 style={{ padding: '16px 18px 12px', fontSize: '16px', margin: 0, borderBottom: '1px solid var(--cr-border)' }}>Discover communities</h3>
                {arrCommunitiesState.length === 0 ? (
                    <p style={{ padding: '16px 18px', color: 'var(--cr-text-muted)', fontSize: '13px' }}>No communities yet.</p>
                ) : (
                    <ul className="verisphere-community-list" style={{ padding: 0, margin: 0, listStyle: 'none' }}>
                        {arrCommunitiesState.map(community => {
                            const strRegister = community.register === 'lounge' ? 'lounge' : 'library';
                            return (
                            <li key={community.id} style={{ borderBottom: '1px solid var(--cr-border)' }}>
                                <Link
                                    to={`/verisphere/community/${community.id}`}
                                    className="community-link"
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '3px',
                                        padding: '14px 18px',
                                        color: 'var(--cr-text-main)',
                                        textDecoration: 'none',
                                        transition: 'background 0.2s'
                                    }}
                                    onMouseOver={(e) => e.currentTarget.style.background = 'var(--cr-surface-raised)'}
                                    onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                    <span style={{ display: 'flex', gap: '7px', alignItems: 'baseline', flexWrap: 'wrap' }}>
                                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: `var(--cr-${strRegister})`, display: 'inline-block', alignSelf: 'center' }} />
                                        <strong style={{ fontSize: '13.5px' }}>{community.strName}</strong>
                                        <span style={{ fontSize: '9.5px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: 'var(--cr-font-mono)', color: `var(--cr-${strRegister})`, background: `var(--cr-${strRegister}-bg)`, borderRadius: 'var(--cr-radius-badge)', padding: '1px 7px' }}>
                                            {strRegister === 'lounge' ? 'Lounge' : 'Library'}
                                        </span>
                                        {community.joined && (
                                            <span style={{ fontSize: '10.5px', color: 'var(--cr-text-muted)', fontFamily: 'var(--cr-font-mono)' }}>Joined</span>
                                        )}
                                    </span>
                                    <span style={{ fontSize: '12px', color: 'var(--cr-text-muted)', lineHeight: '1.4' }}>
                                        {community.strDescription || 'A place for discussion'}
                                    </span>
                                    <span style={{ fontSize: '11px', color: 'var(--cr-text-muted)', fontFamily: 'var(--cr-font-mono)' }}>
                                        {community.member_count} member{community.member_count === 1 ? '' : 's'}
                                    </span>
                                </Link>
                            </li>
                            );
                        })}
                    </ul>
                )}
            </div>

            <div className="verisphere-sidebar-box">
                <h3 style={{ fontSize: '15px', marginTop: 0, marginBottom: '4px' }}>Create new forum</h3>
                <p style={{ fontSize: '12px', color: 'var(--cr-text-muted)', marginBottom: '16px', lineHeight: '1.5' }}>Can't find what you're looking for? Create a new space for rational discussion.</p>
                <CreateCommunityForm onCommunityCreated={loadCommunities} />
            </div>
        </div>
    );
}

export default CommunityList;

