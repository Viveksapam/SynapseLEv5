import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

import { fetchBlogList } from '../api/blogApi';
import { fetchProjectList } from '../api/projectApi';
import { fetchSkillList } from '../api/portfolioApi';
import { fetchProductList } from '../api/productApi';

import SkillModal from './components/SkillModal';
import SEO from '../components/SEO';
import './Home.css';

import WelcomeOverlay from './components/WelcomeOverlay';
import TopNavBar from './components/TopNavBar';
import HomeHero from './components/HomeHero';
import CapabilitiesCarousel from './components/CapabilitiesCarousel';
import ProjectsDirectory from './components/ProjectsDirectory';
import ContributionsSection from './components/ContributionsSection';
import SpotlightSection from './components/SpotlightSection';
import MerchandiseSection from './components/MerchandiseSection';
import HomeFooter from './components/HomeFooter';

export default function Home({ onOpenContact, onOpenLogin, authHook, settings }) {
  const [arrBlogsState, setArrBlogsState] = useState([]);
  const [arrProjectsState, setArrProjectsState] = useState([]);
  const [arrSkillsState, setArrSkillsState] = useState([]);
  const [arrProductsState, setArrProductsState] = useState([]);

  const [boolIsProjectsLoadingState, setBoolIsProjectsLoadingState] = useState(true);
  const [boolIsProductsLoadingState, setBoolIsProductsLoadingState] = useState(true);
  
  const [boolShowWelcomeState, setBoolShowWelcomeState] = useState(true);
  const [numWelcomeProgressState, setNumWelcomeProgressState] = useState(0);
  const [boolIsWelcomeFadingState, setBoolIsWelcomeFadingState] = useState(false);
  const [boolAnimationsReadyState, setBoolAnimationsReadyState] = useState(false);

  const [objSelectedSkillState, setObjSelectedSkillState] = useState(null);
  const [numDemoLevelState, setNumDemoLevelState] = useState(80);

  // Initial Boot Animation
  useEffect(() => {
    if (!boolShowWelcomeState) return;

    let start = 0;
    const interval = setInterval(() => {
      start += 3;
      if (start >= 100) {
        start = 100;
        clearInterval(interval);
        setTimeout(() => {
          setBoolIsWelcomeFadingState(true);
          setTimeout(() => {
            setBoolShowWelcomeState(false);
            setBoolAnimationsReadyState(true);
          }, 800);
        }, 1000);
      }
      setNumWelcomeProgressState(start);
    }, 45);

    return () => clearInterval(interval);
  }, [boolShowWelcomeState]);

  // Reveal Animations Observer
  useEffect(() => {
    if (!boolAnimationsReadyState) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('ath-reveal-visible');
        }
      });
    }, { threshold: 0.05 });

    const elements = document.querySelectorAll('.ath-reveal');
    elements.forEach((el) => observer.observe(el));
    return () => { elements.forEach((el) => observer.unobserve(el)); };
  }, [boolAnimationsReadyState]);

  // Data Loading
  useEffect(() => {
    const loadData = async () => {
      const blogsRes = await fetchBlogList();
      if (blogsRes.data) setArrBlogsState(blogsRes.data);

      const projectsRes = await fetchProjectList();
      if (projectsRes.data) setArrProjectsState(projectsRes.data);
      setBoolIsProjectsLoadingState(false);

      const skillsRes = await fetchSkillList();
      if (skillsRes.data) setArrSkillsState(skillsRes.data);

      const productsRes = await fetchProductList();
      if (productsRes.data) setArrProductsState(productsRes.data);
      setBoolIsProductsLoadingState(false);
    };
    loadData();
  }, []);

  const { boolIsLoggedInState, handleLogout } = authHook || {};

  return (
    <div className={`ath-wrapper ${boolAnimationsReadyState ? 'ath-animations-ready' : ''}`}>
      <WelcomeOverlay 
        boolShowWelcomeState={boolShowWelcomeState}
        boolIsWelcomeFadingState={boolIsWelcomeFadingState}
        numWelcomeProgressState={numWelcomeProgressState}
      />

      <SEO title="Synapse | Scholarly Home" description="Release v.4 — Designing virtual spaces for accessibility and shared discovery." />

      <TopNavBar 
        boolIsLoggedInState={boolIsLoggedInState} 
        onOpenLogin={onOpenLogin} 
        handleLogout={handleLogout} 
      />

      <main>
        <HomeHero boolAnimationsReadyState={boolAnimationsReadyState} />

        <CapabilitiesCarousel 
          boolAnimationsReadyState={boolAnimationsReadyState} 
          arrSkillsState={arrSkillsState}
          onSelectSkill={setObjSelectedSkillState}
        />

        <ProjectsDirectory 
          boolIsProjectsLoadingState={boolIsProjectsLoadingState}
          arrFilteredProjectsState={arrProjectsState}
        />

        <ContributionsSection arrBlogsState={arrBlogsState} />

        <SpotlightSection />

        <MerchandiseSection
          arrProductsState={arrProductsState}
          boolIsLoadingState={boolIsProductsLoadingState}
        />
      </main>

      <HomeFooter />

      {objSelectedSkillState && (
        <SkillModal
          objSelectedSkill={objSelectedSkillState}
          onClose={() => setObjSelectedSkillState(null)}
          numDemoLevel={numDemoLevelState}
          onDemoLevelChange={setNumDemoLevelState}
        />
      )}
    </div>
  );
}

Home.propTypes = {
  onOpenContact: PropTypes.func,
  onOpenLogin: PropTypes.func.isRequired,
  authHook: PropTypes.object,
  settings: PropTypes.object
};
