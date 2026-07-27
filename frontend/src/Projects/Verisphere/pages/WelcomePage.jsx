import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ThreeVisual from '../../../theme/ThreeVisual';

function WelcomePage() {
  const navigate = useNavigate();
  const [numProgress, setNumProgress] = useState(0);

  useEffect(() => {
    const numDuration = 5000;
    const numInterval = 30;
    const numStep = (numInterval / numDuration) * 100;
    const timer = setInterval(() => {
      setNumProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          navigate('/verisphere/feed');
          return 100;
        }
        return prev + numStep;
      });
    }, numInterval);
    return () => clearInterval(timer);
  }, [navigate]);

  return (
    <>

      <div className="v2-canvas-container">
        <ThreeVisual disableMouse />
      </div>

      <div className="v2-welcome-content" style={{
        position: 'relative', zIndex: 1,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', textAlign: 'center', padding: '2rem',
      }}>
        <h1 style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 'clamp(1.8rem, 5vw, 3.2rem)',
          fontWeight: '800',
          margin: '0 0 1rem 0',
          letterSpacing: '-0.02em',
          color: 'var(--v2-text-main)',
        }}>
          Welcome to <span style={{ color: 'white' }}>VeriSphere</span>
        </h1>

        <p style={{
          fontSize: '0.95rem',
          color: 'var(--v2-text-muted)',
          maxWidth: '600px',
          lineHeight: '1.5',
          marginBottom: '2.5rem',
        }}>
          The rational public square. Step into an AI-moderated arena where truth takes center stage, and arguments are weighed on their merits, not their volume.
        </p>

        <div className="v2-welcome-features" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1.2rem',
          maxWidth: '900px',
          width: '100%',
          marginBottom: '2.5rem',
        }}>
          {[
            { title: 'AI-Reasoned', desc: 'Every argument is analyzed to promote clarity, constructive dialogue, and mutual understanding.' },
            { title: 'Fact-Checked', desc: 'Claims are automatically cross-referenced with verified sources in real-time.' },
            { title: 'Civil Discourse', desc: 'A protected environment where ideas battle, but personal attacks are filtered out.' },
          ].map(feature => (
            <div key={feature.title} className="v2-welcome-card" style={{
              background: 'var(--glass-bg)',
              border: '1px solid var(--glass-border)',
              borderRadius: '16px',
              padding: '1.5rem',
              backdropFilter: 'blur(8px)',
            }}>
              <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", color: 'var(--v2-text-main)', fontSize: '1rem', marginBottom: '0.4rem', marginTop: 0 }}>{feature.title}</h3>
              <p style={{ color: 'var(--v2-text-muted)', fontSize: '0.85rem', lineHeight: '1.5', margin: 0 }}>{feature.desc}</p>
            </div>
          ))}
        </div>

        <Link
          to="/verisphere/feed"
          style={{
            fontSize: '1rem',
            padding: '12px 32px',
            textDecoration: 'none',
            display: 'inline-block',
            background: 'transparent',
            border: '1.5px solid rgba(255,255,255,0.5)',
            borderRadius: '100px',
            color: 'white',
            fontWeight: '600',
            fontFamily: "'Space Grotesk', sans-serif",
            marginBottom: '1.5rem',
          }}
          onMouseOver={(e) => e.currentTarget.style.borderColor = 'white'}
          onMouseOut={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)'}
        >
          Enter The Sphere
        </Link>

        <div style={{ width: '160px', height: '2px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${numProgress}%`,
            background: 'rgba(255,255,255,0.5)',
            borderRadius: '2px',
            transition: 'width 0.03s linear',
          }} />
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--v2-text-muted)', marginTop: '0.5rem' }}>entering in 5s…</span>
      </div>
    </>
  );
}

export default WelcomePage;
