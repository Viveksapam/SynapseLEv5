import React, { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { NavLink } from 'react-router-dom';
import { Home, User, Globe, Info, ChevronDown, Flag } from 'lucide-react';
import { fetchCommunities, COMMUNITIES_UPDATED_EVENT } from '../api/communityApi';
import CreateCommunityForm from './CreateCommunityForm';

function SidenavSection({ strTitle, children }) {
  const [boolIsOpenState, setBoolIsOpenState] = useState(true);
  return (
    <div className="vs-sidenav-section">
      <button
        type="button"
        className="vs-sidenav-section-toggle"
        onClick={() => setBoolIsOpenState(!boolIsOpenState)}
        aria-expanded={boolIsOpenState}
      >
        <span>{strTitle}</span>
        <ChevronDown size={14} style={{ transform: boolIsOpenState ? 'none' : 'rotate(-90deg)', transition: 'transform 0.15s' }} />
      </button>
      {boolIsOpenState && children}
    </div>
  );
}

SidenavSection.propTypes = {
  strTitle: PropTypes.string.isRequired,
  children: PropTypes.node,
};

const linkClass = ({ isActive }) => `vs-sidenav-link${isActive ? ' active' : ''}`;

function CommunityLink({ objCommunity }) {
  const strRegister = objCommunity.register === 'lounge' ? 'lounge' : 'library';
  return (
    <NavLink to={`/verisphere/community/${objCommunity.id}`} className={linkClass}>
      <span className="vs-sidenav-dot" style={{ background: `var(--cr-${strRegister})` }} />
      <span className="vs-sidenav-link-label">{objCommunity.strName}</span>
    </NavLink>
  );
}

CommunityLink.propTypes = {
  objCommunity: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    strName: PropTypes.string.isRequired,
    register: PropTypes.string,
  }).isRequired,
};

function VeriSphereSidebar({ boolIsLoggedIn, boolIsAdmin }) {
  const [arrCommunitiesState, setArrCommunitiesState] = useState([]);

  const loadCommunities = useCallback(async () => {
    try {
      setArrCommunitiesState(await fetchCommunities());
    } catch (objErr) {
      console.error('Sidebar failed to load communities', objErr);
    }
  }, []);

  useEffect(() => {
    loadCommunities();
    window.addEventListener(COMMUNITIES_UPDATED_EVENT, loadCommunities);
    return () => window.removeEventListener(COMMUNITIES_UPDATED_EVENT, loadCommunities);
  }, [loadCommunities]);

  const arrJoined = arrCommunitiesState.filter((objCommunity) => objCommunity.joined);
  const arrOthers = arrCommunitiesState.filter((objCommunity) => !objCommunity.joined);

  return (
    <aside className="vs-sidenav" aria-label="VeriSphere navigation">
      <nav className="vs-sidenav-group">
        <NavLink to="/verisphere/feed" className={linkClass}>
          <Home size={18} />
          <span className="vs-sidenav-link-label">Feed</span>
        </NavLink>
        {boolIsLoggedIn && (
          <NavLink to="/verisphere/profile" className={linkClass}>
            <User size={18} />
            <span className="vs-sidenav-link-label">Profile</span>
          </NavLink>
        )}
        {boolIsAdmin && (
          <NavLink to="/verisphere/admin/reports" className={linkClass}>
            <Flag size={18} />
            <span className="vs-sidenav-link-label">Reports</span>
          </NavLink>
        )}
      </nav>

      <div className="vs-sidenav-divider" />

      {arrJoined.length > 0 && (
        <SidenavSection strTitle="Your communities">
          {arrJoined.map((objCommunity) => (
            <CommunityLink key={objCommunity.id} objCommunity={objCommunity} />
          ))}
        </SidenavSection>
      )}

      <SidenavSection strTitle={arrJoined.length > 0 ? 'Discover' : 'Communities'}>
        {arrOthers.length === 0 ? (
          <p className="vs-sidenav-empty">Nothing new to discover yet.</p>
        ) : (
          arrOthers.map((objCommunity) => (
            <CommunityLink key={objCommunity.id} objCommunity={objCommunity} />
          ))
        )}
        <div className="vs-sidenav-create">
          <CreateCommunityForm onCommunityCreated={loadCommunities} />
        </div>
      </SidenavSection>

      <div className="vs-sidenav-divider" />

      <SidenavSection strTitle="Resources">
        <NavLink to="/verisphere" end className={linkClass}>
          <Info size={18} />
          <span className="vs-sidenav-link-label">About VeriSphere</span>
        </NavLink>
        <NavLink to="/" end className={linkClass}>
          <Globe size={18} />
          <span className="vs-sidenav-link-label">Main Site</span>
        </NavLink>
      </SidenavSection>
    </aside>
  );
}

VeriSphereSidebar.propTypes = {
  boolIsLoggedIn: PropTypes.bool,
  boolIsAdmin: PropTypes.bool,
};

export default VeriSphereSidebar;
