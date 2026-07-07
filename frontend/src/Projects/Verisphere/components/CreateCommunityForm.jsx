import React, { useState } from 'react';
import { postCreateCommunity, notifyCommunitiesUpdated } from '../api/communityApi';
import { useAuth } from '../../../hooks/useAuth';

function CreateCommunityForm({ onCommunityCreated }) {
    const { boolIsLoggedInState } = useAuth();

    const [strNameState, setStrNameState] = useState('');
    const [strDescriptionState, setStrDescriptionState] = useState('');
    const [strRegisterState, setStrRegisterState] = useState('library');
    const [boolIsSubmittingState, setBoolIsSubmittingState] = useState(false);
    const [boolIsExpandedState, setBoolIsExpandedState] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!boolIsLoggedInState || !strNameState.trim()) return;

        setBoolIsSubmittingState(true);
        try {
            await postCreateCommunity({
                strName: strNameState.toLowerCase().replace(/\s+/g, '-'),
                strDescription: strDescriptionState,
                register: strRegisterState,
            });
            
            setStrNameState('');
            setStrDescriptionState('');
            setBoolIsExpandedState(false);
            notifyCommunitiesUpdated();

            if (onCommunityCreated) {
                onCommunityCreated();
            }
        } catch (error) {
            console.error("Failed to create community", error);
            alert("Failed to create forum. Ensure you are logged in and the name is unique.");
        } finally {
            setBoolIsSubmittingState(false);
        }
    };

    if (!boolIsLoggedInState) return null;

    return (
        <div className="verisphere-community-card">
            <button
                type="button"
                onClick={() => setBoolIsExpandedState(!boolIsExpandedState)}
                style={{ width: '100%', boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--cr-text-main)' }}
            >
                <span style={{ fontFamily: 'var(--cr-font-heading)', fontSize: '13px', fontWeight: 600 }}>+ Create new forum</span>
            </button>

            {boolIsExpandedState && (
                <form onSubmit={handleSubmit} style={{ marginTop: '12px' }}>
                    <input
                        type="text"
                        placeholder="Forum name"
                        value={strNameState}
                        onChange={(e) => setStrNameState(e.target.value)}
                        required
                        className="verisphere-input"
                        style={{ fontSize: '12.5px', marginBottom: '8px' }}
                    />
                    <textarea
                        placeholder="Brief description..."
                        value={strDescriptionState}
                        onChange={(e) => setStrDescriptionState(e.target.value)}
                        className="verisphere-textarea"
                        style={{ height: '60px', fontSize: '12.5px' }}
                    />
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                        <button type="button" onClick={() => setStrRegisterState('library')}
                            style={{ flex: 1, textAlign: 'center', border: `1px solid ${strRegisterState === 'library' ? 'var(--cr-library)' : 'var(--cr-border)'}`, color: strRegisterState === 'library' ? 'var(--cr-library)' : 'var(--cr-text-muted)', background: strRegisterState === 'library' ? 'var(--cr-library-bg)' : 'transparent', borderRadius: 'var(--cr-radius-chip)', padding: '5px 0', fontSize: '11.5px', fontWeight: strRegisterState === 'library' ? 600 : 400, cursor: 'pointer' }}>
                            Library
                        </button>
                        <button type="button" onClick={() => setStrRegisterState('lounge')}
                            style={{ flex: 1, textAlign: 'center', border: `1px solid ${strRegisterState === 'lounge' ? 'var(--cr-lounge)' : 'var(--cr-border)'}`, color: strRegisterState === 'lounge' ? 'var(--cr-lounge)' : 'var(--cr-text-muted)', background: strRegisterState === 'lounge' ? 'var(--cr-lounge-bg)' : 'transparent', borderRadius: 'var(--cr-radius-chip)', padding: '5px 0', fontSize: '11.5px', fontWeight: strRegisterState === 'lounge' ? 600 : 400, cursor: 'pointer' }}>
                            Lounge
                        </button>
                    </div>
                    <p style={{ fontSize: '11px', color: 'var(--cr-text-muted)', lineHeight: '1.5', margin: '0 0 10px' }}>
                        Register picker — sets the community's default temperature.
                    </p>
                    <button type="submit" disabled={boolIsSubmittingState} className="verisphere-btn-primary" style={{ width: '100%' }}>
                        {boolIsSubmittingState ? 'Creating...' : 'Create Forum'}
                    </button>
                </form>
            )}
        </div>
    );
}

export default CreateCommunityForm;

