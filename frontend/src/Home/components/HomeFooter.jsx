import React from 'react';
import { Link } from 'react-router-dom';
import { legacyContactLinks } from '../../data/legacyLinks';

const HomeFooter = () => {
  return (
    <footer className="ath-footer">
      <div className="ath-footer-inner">

        {/* Top: numbered contacts */}
        <div className="ath-footer-top">
          <div className="ath-footer-contact-col">
            <span className="ath-footer-contact-label">Connect</span>
            <div className="ath-footer-contact-list">
              <a
                href={legacyContactLinks.linkedin}
                target="_blank"
                rel="noreferrer"
                className="ath-footer-contact-row"
              >
                <span className="ath-footer-contact-left">
                  <span className="ath-footer-contact-num">01</span>
                  <span className="ath-footer-contact-name">LinkedIn</span>
                </span>
                <span className="ath-footer-contact-handle">/in/sapam-singh ↗</span>
              </a>
              <a
                href={legacyContactLinks.github}
                target="_blank"
                rel="noreferrer"
                className="ath-footer-contact-row"
              >
                <span className="ath-footer-contact-left">
                  <span className="ath-footer-contact-num">02</span>
                  <span className="ath-footer-contact-name">GitHub</span>
                </span>
                <span className="ath-footer-contact-handle">/Viveksapam ↗</span>
              </a>
              <a
                href={`mailto:${legacyContactLinks.email}`}
                className="ath-footer-contact-row ath-footer-contact-row-last"
              >
                <span className="ath-footer-contact-left">
                  <span className="ath-footer-contact-num">03</span>
                  <span className="ath-footer-contact-name">Email</span>
                </span>
                <span className="ath-footer-contact-handle">{legacyContactLinks.email} ↗</span>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar: copyright left, nav links right */}
        <div className="ath-footer-bottom">
          <p className="ath-footer-copyright">
            © {new Date().getFullYear()} Synapse LE.
          </p>
          <div className="ath-footer-nav-links">
            <Link className="ath-footer-nav-link" to="/verisphere/guidelines">
              Verisphere Guidelines
            </Link>
            <Link className="ath-footer-nav-link" to="/credentials">
              Assessment Protocols &amp; Ethics
            </Link>
            <Link className="ath-footer-nav-link" to="/shop">
              Shop
            </Link>
            <Link className="ath-footer-nav-link" to="/terms">
              Terms
            </Link>
            <Link className="ath-footer-nav-link" to="/privacy">
              Privacy
            </Link>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default HomeFooter;
