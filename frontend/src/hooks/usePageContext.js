import { useState, useEffect } from 'react';

export function usePageContext() {
  const [contextStr, setContextStr] = useState("Viewing the top of the page (Hero Section)");

  useEffect(() => {
    // We will observe all main sections
    const sections = document.querySelectorAll('section[id], main > div[id], main > section');
    
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Find the section that is most intersecting
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.id || entry.target.className;
            let humanReadable = "Viewing " + id;
            if (id === 'home' || entry.target.classList.contains('hero-split')) {
              humanReadable = "Viewing the Hero/Home Section";
            } else if (id === 'portfolio' || entry.target.classList.contains('portfolio-section')) {
              humanReadable = "Viewing the Portfolio Projects";
            } else if (id === 'blog' || entry.target.classList.contains('blog-section')) {
              humanReadable = "Viewing the Blog/Writing section";
            } else if (entry.target.classList.contains('merch-section')) {
              humanReadable = "Viewing the Merchandise/Shop section";
            }
            setContextStr(humanReadable);
          }
        });
      },
      { threshold: 0.5 } // Trigger when at least 50% of the section is visible
    );

    sections.forEach((section) => observer.observe(section));

    return () => {
      sections.forEach((section) => observer.unobserve(section));
    };
  }, []);

  return contextStr;
}

