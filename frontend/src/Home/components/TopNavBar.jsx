import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';

const TopNavBar = ({ boolIsLoggedInState, onOpenLogin, handleLogout }) => {
  const [boolIsDarkModeState, setBoolIsDarkMode] = useState(false);
  const [boolIsMobileMenuOpenState, setBoolIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const savedMode = localStorage.getItem('ath-dark-mode');

    const isDark = savedMode !== null ? savedMode === 'true' : false;
    setBoolIsDarkMode(isDark);
    applyDarkMode(isDark);
  }, []);

  const applyDarkMode = (isDark) => {
    if (isDark) {
      document.documentElement.classList.add('ath-dark-mode');
      // `old-ui` is the light-theme variant for index.css's global --bg-card/--text-main/etc.
      // vars (used outside the Home page's ath- system, e.g. the Shop page) — keep it in sync
      // with the same toggle so there's one light/dark switch, not two.
      document.body.classList.remove('old-ui');
    } else {
      document.documentElement.classList.remove('ath-dark-mode');
      document.body.classList.add('old-ui');
    }
  };

  const handleDarkModeToggle = () => {
    const newMode = !boolIsDarkModeState;
    setBoolIsDarkMode(newMode);
    localStorage.setItem('ath-dark-mode', newMode);
    applyDarkMode(newMode);
  };

  return (
    <header className="ath-header">
      <nav className="ath-nav">
        <div className="ath-brand-group">
          <Link to="/" className="ath-brand">
            Synapse LE
          </Link>
          <ul className="ath-nav-links hidden-mobile">
            <Link className="ath-nav-link" to="/verisphere">
              Verisphere
            </Link>
            <a 
              className="ath-nav-link" 
              href="#video"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('video')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Spotlight
            </a>
            <a 
              className="ath-nav-link" 
              href="#merchandise"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('merchandise')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Merchandise
            </a>
          </ul>
        </div>
        
        <div className="ath-nav-actions">
          <button
            onClick={handleDarkModeToggle}
            className="ath-dark-mode-toggle"
            title={boolIsDarkModeState ? 'Light mode' : 'Dark mode'}
            aria-label={boolIsDarkModeState ? 'Light mode' : 'Dark mode'}
          >
            {boolIsDarkModeState ? 'LIGHT' : 'DARK'}
          </button>

          <button
            className="ath-hamburger-menu hidden-desktop"
            onClick={() => setBoolIsMobileMenuOpen(!boolIsMobileMenuOpenState)}
            aria-label="Toggle menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>

          <div className={`ath-dropdown-container hidden-mobile ${boolIsMobileMenuOpenState ? 'open' : ''}`}>
            <button className="ath-dropdown-trigger">
              RELEASES <ChevronDown size={12} style={{ marginLeft: '4px' }} />
            </button>
            <div className="ath-dropdown-menu">
              <div className="ath-dropdown-column">
                <h4>Home Designs</h4>
                <a href="/" className="ath-nav-link">Classic</a>
              </div>
              <div className="ath-dropdown-column">
                <h4>Social</h4>
                <Link to="/verisphere">Verisphere</Link>
              </div>
              <div className="ath-dropdown-column">
                <h4>E-Commerce</h4>
                <Link to="/shop">Shop Page</Link>
              </div>
              <div className="ath-dropdown-column">
                <h4>Learning</h4>
                <Link to="/assessment">Assessment Hub</Link>
                <Link to="/sle">Classroom</Link>
              </div>
            </div>
          </div>

          {boolIsLoggedInState ? (
            <button
              onClick={handleLogout}
              className="ath-btn-login hidden-mobile"
            >
              LOG OUT
            </button>
          ) : (
            <button
              onClick={onOpenLogin}
              className="ath-btn-login hidden-mobile"
            >
              LOG IN
            </button>
          )}
        </div>

        {boolIsMobileMenuOpenState && (
          <div className="ath-mobile-menu">
            <Link
              to="/verisphere"
              className="ath-mobile-menu-link"
              onClick={() => setBoolIsMobileMenuOpen(false)}
            >
              Verisphere
            </Link>
            <a
              href="#video"
              className="ath-mobile-menu-link"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('video')?.scrollIntoView({ behavior: 'smooth' });
                setBoolIsMobileMenuOpen(false);
              }}
            >
              Spotlight
            </a>
            <a
              href="#merchandise"
              className="ath-mobile-menu-link"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('merchandise')?.scrollIntoView({ behavior: 'smooth' });
                setBoolIsMobileMenuOpen(false);
              }}
            >
              Merchandise
            </a>
            <div className="ath-mobile-menu-divider"></div>
            <button
              className="ath-mobile-menu-link"
              onClick={() => {
                setBoolIsMobileMenuOpen(false);
                window.location.href = '/shop';
              }}
            >
              Shop
            </button>
            <button
              className="ath-mobile-menu-link"
              onClick={() => {
                setBoolIsMobileMenuOpen(false);
                window.location.href = '/credentials';
              }}
            >
              Credentials
            </button>
            {boolIsLoggedInState ? (
              <button
                onClick={() => {
                  handleLogout();
                  setBoolIsMobileMenuOpen(false);
                }}
                className="ath-mobile-menu-link"
              >
                LOG OUT
              </button>
            ) : (
              <button
                onClick={() => {
                  onOpenLogin();
                  setBoolIsMobileMenuOpen(false);
                }}
                className="ath-mobile-menu-link"
              >
                LOG IN
              </button>
            )}
          </div>
        )}
      </nav>
    </header>
  );
};

TopNavBar.propTypes = {
  boolIsLoggedInState: PropTypes.bool,
  onOpenLogin: PropTypes.func.isRequired,
  handleLogout: PropTypes.func.isRequired
};

export default TopNavBar;
