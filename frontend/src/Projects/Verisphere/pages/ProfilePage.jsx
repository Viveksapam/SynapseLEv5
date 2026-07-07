import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useAuth } from '../../../hooks/useAuth';
import { fetchPosts } from '../api/verisphereApi';
import { updateUserProfile } from '../../../api/userApi';
import ProfileBanner from '../components/ProfileBanner';
import ProfileOverview from '../components/ProfileOverview';
import ProfileActivity from '../components/ProfileActivity';
import ProfileSettings from '../components/ProfileSettings';
import '../styles/VeriSphere.css';

const TABS = ['Overview', 'Activity', 'Settings'];
const EMPTY_FORM = { first_name: '', last_name: '', strBio: '', strProfilePicUrl: '' };

const buildForm = (user) => user ? {
  first_name: user.first_name || '',
  last_name: user.last_name || '',
  strBio: user.strBio || '',
  strProfilePicUrl: user.strProfilePicUrl || '',
} : EMPTY_FORM;

const ProfilePage = ({ authHook }) => {
  const fallbackAuth = useAuth();
  const { objUserState, setObjUserState, boolIsLoggedInState, strTokenState } = authHook || fallbackAuth;

  const [arrUserPostsState, setArrUserPostsState] = useState([]);
  const [boolIsLoadingPostsState, setBoolIsLoadingPostsState] = useState(true);
  const [boolIsEditingState, setBoolIsEditingState] = useState(false);
  const [boolIsSavingState, setBoolIsSavingState] = useState(false);
  const [objEditFormState, setObjEditFormState] = useState(EMPTY_FORM);
  const [strActiveTabState, setStrActiveTabState] = useState(TABS[0]);

  useEffect(() => {
    setObjEditFormState(buildForm(objUserState));
  }, [objUserState]);

  useEffect(() => {
    if (!objUserState) { setBoolIsLoadingPostsState(false); return; }
    fetchPosts()
      .then((arrPosts) => setArrUserPostsState(arrPosts.filter((p) => p.strAuthorUsername === objUserState.username)))
      .catch((objErr) => console.error('Failed to fetch user posts', objErr))
      .finally(() => setBoolIsLoadingPostsState(false));
  }, [objUserState]);

  const handleSaveProfile = async () => {
    setBoolIsSavingState(true);
    try {
      const objUpdated = await updateUserProfile(objEditFormState, strTokenState);
      setObjUserState(objUpdated);
      setBoolIsEditingState(false);
    } catch (objErr) {
      console.error('Profile update failed', objErr);
      alert('Could not save profile – please try again');
    } finally {
      setBoolIsSavingState(false);
    }
  };

  const handlePostCreated = () => {
    setBoolIsLoadingPostsState(true);
    fetchPosts()
      .then((arrPosts) => setArrUserPostsState(arrPosts.filter((p) => p.strAuthorUsername === objUserState.username)))
      .catch((objErr) => console.error('Failed to refresh posts', objErr))
      .finally(() => setBoolIsLoadingPostsState(false));
  };

  if (!boolIsLoggedInState || !objUserState) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--cr-text-main)' }}>
        <h2 style={{ margin: '0 0 12px', fontFamily: 'var(--cr-font-heading)' }}>Access Denied</h2>
        <p style={{ color: 'var(--cr-text-muted)', margin: 0 }}>Please log in to view your profile.</p>
      </div>
    );
  }

  return (
    <div style={{ color: 'var(--cr-text-main)', fontFamily: 'var(--cr-font-body)', display: 'flex', justifyContent: 'center' }}>
    <div style={{ width: '100%', maxWidth: '760px' }}>
      <ProfileBanner
        user={objUserState}
        isEditing={boolIsEditingState}
        editForm={objEditFormState}
        setEditForm={setObjEditFormState}
        isSaving={boolIsSavingState}
        onSave={handleSaveProfile}
        onCancel={() => { setBoolIsEditingState(false); setObjEditFormState(buildForm(objUserState)); }}
        onStartEdit={() => setBoolIsEditingState(true)}
      />

      <div className="vs-profile-tabs" style={{ display: 'flex', gap: '22px', padding: '0 24px', borderBottom: '1px solid var(--cr-border)' }}>
        {TABS.map((strTab) => (
          <button
            key={strTab}
            onClick={() => setStrActiveTabState(strTab)}
            style={{
              padding: '0 0 10px', border: 'none',
              borderBottom: strActiveTabState === strTab ? '2px solid var(--cr-text-main)' : '2px solid transparent',
              marginBottom: '-1px',
              background: 'transparent',
              color: strActiveTabState === strTab ? 'var(--cr-text-main)' : 'var(--cr-text-muted)',
              fontFamily: 'var(--cr-font-heading)', fontSize: '13.5px',
              fontWeight: 600,
              cursor: 'pointer', transition: 'color 0.15s, border-color 0.15s',
            }}
          >
            {strTab}
          </button>
        ))}
      </div>

      <div className="vs-profile-content" style={{ padding: '20px 24px' }}>
        {strActiveTabState === 'Overview' && (
          <ProfileOverview
            user={objUserState}
            isEditing={boolIsEditingState}
            editForm={objEditFormState}
            setEditForm={setObjEditFormState}
            postCount={arrUserPostsState.length}
            isLoadingPosts={boolIsLoadingPostsState}
          />
        )}
        {strActiveTabState === 'Activity' && (
          <ProfileActivity arrPosts={arrUserPostsState} boolIsLoading={boolIsLoadingPostsState} onPostCreated={handlePostCreated} />
        )}
        {strActiveTabState === 'Settings' && (
          <ProfileSettings
            user={objUserState}
            strToken={strTokenState}
            onUserChanged={setObjUserState}
            onDeactivated={() => { (authHook || fallbackAuth).handleLogout(); }}
          />
        )}
      </div>
    </div>
    </div>
  );
};

ProfilePage.propTypes = {
  authHook: PropTypes.object,
};

export default ProfilePage;
