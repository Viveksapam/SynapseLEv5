import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

import { fetchBlogList } from '../api/blogApi';
import { fetchProjectList } from '../api/projectApi';
import { fetchSkillList, fetchVideoList } from '../api/portfolioApi';
import { fetchProductList } from '../api/productApi';

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

// Safety cap: never let a slow/stuck request hold the welcome screen open forever.
const MAX_DATA_WAIT_MS = 4000;

export default function Home({ onOpenContact, onOpenLogin, authHook, settings }) {
  const [arrBlogsState, setArrBlogsState] = useState([]);
  const [arrProjectsState, setArrProjectsState] = useState([]);
  const [arrSkillsState, setArrSkillsState] = useState([]);
  const [arrProductsState, setArrProductsState] = useState([]);
  const [arrVideosState, setArrVideosState] = useState([]);

  const [boolIsProjectsLoadingState, setBoolIsProjectsLoadingState] = useState(true);
  const [boolIsProductsLoadingState, setBoolIsProductsLoadingState] = useState(true);
  const [boolIsVideosLoadingState, setBoolIsVideosLoadingState] = useState(true);
  const [boolDataReadyState, setBoolDataReadyState] = useState(false);

  const [boolShowWelcomeState, setBoolShowWelcomeState] = useState(true);
  const [numWelcomeProgressState, setNumWelcomeProgressState] = useState(0);
  const [boolIsWelcomeFadingState, setBoolIsWelcomeFadingState] = useState(false);
  const [boolAnimationsReadyState, setBoolAnimationsReadyState] = useState(false);
  const [boolProgressCompleteState, setBoolProgressCompleteState] = useState(false);

  // Pure visual progress animation — always plays out the same way regardless of data.
  useEffect(() => {
    if (!boolShowWelcomeState) return;

    let start = 0;
    const interval = setInterval(() => {
      start += 6;
      if (start >= 100) {
        start = 100;
        clearInterval(interval);
        setBoolProgressCompleteState(true);
      }
      setNumWelcomeProgressState(start);
    }, 20);

    return () => clearInterval(interval);
  }, [boolShowWelcomeState]);

  // Only actually dismiss the welcome screen once BOTH the progress animation has
  // finished AND the real page data has arrived — whichever is slower. Capped by
  // MAX_DATA_WAIT_MS so a slow/stuck request can't hold the overlay open forever.
  useEffect(() => {
    if (!boolShowWelcomeState || !boolProgressCompleteState) return;
    if (!boolDataReadyState) return;

    const t = setTimeout(() => {
      setBoolIsWelcomeFadingState(true);
      setTimeout(() => {
        setBoolShowWelcomeState(false);
        setBoolAnimationsReadyState(true);
      }, 400);
    }, 200);
    return () => clearTimeout(t);
  }, [boolShowWelcomeState, boolProgressCompleteState, boolDataReadyState]);

  useEffect(() => {
    if (!boolProgressCompleteState) return;
    const t = setTimeout(() => setBoolDataReadyState(true), MAX_DATA_WAIT_MS);
    return () => clearTimeout(t);
  }, [boolProgressCompleteState]);


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

  
  useEffect(() => {
    // Kick off every fetch in parallel, starting immediately (while the welcome
    // screen is still showing) instead of after the page is revealed.
    const loadData = async () => {
      const [blogsRes, projectsRes, skillsRes, productsRes, videosRes] = await Promise.all([
        fetchBlogList(), fetchProjectList(), fetchSkillList(), fetchProductList(), fetchVideoList(),
      ]);

      if (blogsRes.data) setArrBlogsState(blogsRes.data);

      if (projectsRes.data) setArrProjectsState(projectsRes.data);
      setBoolIsProjectsLoadingState(false);

      if (skillsRes.data) setArrSkillsState(skillsRes.data);

      if (productsRes.data) setArrProductsState(productsRes.data);
      setBoolIsProductsLoadingState(false);

      if (videosRes.data) setArrVideosState(videosRes.data);
      setBoolIsVideosLoadingState(false);

      setBoolDataReadyState(true);
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

      <SEO />

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
        />

        <ProjectsDirectory 
          boolIsProjectsLoadingState={boolIsProjectsLoadingState}
          arrFilteredProjectsState={arrProjectsState}
        />

        <ContributionsSection arrBlogsState={arrBlogsState} />

        <SpotlightSection
          arrVideosState={arrVideosState}
          boolIsLoadingState={boolIsVideosLoadingState}
        />

        <MerchandiseSection
          arrProductsState={arrProductsState}
          boolIsLoadingState={boolIsProductsLoadingState}
        />
      </main>

      <HomeFooter />
    </div>
  );
}

Home.propTypes = {
  onOpenContact: PropTypes.func,
  onOpenLogin: PropTypes.func.isRequired,
  authHook: PropTypes.object,
  settings: PropTypes.object
};
