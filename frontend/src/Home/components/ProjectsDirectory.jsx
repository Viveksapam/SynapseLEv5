import React from 'react';
import PropTypes from 'prop-types';
import { Link, useNavigate } from 'react-router-dom';

const ProjectsDirectory = ({ boolIsProjectsLoadingState, arrFilteredProjectsState }) => {
  const navigate = useNavigate();

  return (
    <section className="ath-grid-section ath-reveal" id="projects">
      <aside className="ath-sidebar">
        <div className="ath-sidebar-sticky">
          <h3 className="ath-sidebar-title">Project Indices</h3>
          <ul className="ath-sidebar-list">
            <li className="ath-sidebar-item" onClick={() => navigate('/verisphere')}>
              <span className="ath-sidebar-item-name">VERISPHERE</span>
              <span className="ath-sidebar-item-code">001</span>
            </li>
            <li className="ath-sidebar-item" onClick={() => navigate('/credentials')}>
              <span className="ath-sidebar-item-name">ASSESSMENTS</span>
              <span className="ath-sidebar-item-code">042</span>
            </li>
            <li className="ath-sidebar-item" onClick={() => document.getElementById('video')?.scrollIntoView({ behavior: 'smooth' })}>
              <span className="ath-sidebar-item-name">SPOTLIGHT</span>
              <span className="ath-sidebar-item-code">109</span>
            </li>
            <li className="ath-sidebar-item" onClick={() => document.getElementById('merchandise')?.scrollIntoView({ behavior: 'smooth' })}>
              <span className="ath-sidebar-item-name">MERCHANDISE</span>
              <span className="ath-sidebar-item-code">215</span>
            </li>
          </ul>
          
          <div className="ath-sidebar-quote-box">
            <p className="ath-quote-text">
              "Built for discourse you can verify — where every claim carries its source."
            </p>
          </div>
        </div>
      </aside>

      <div className="ath-main-content">
        {boolIsProjectsLoadingState ? (
          <div className="ath-project-skeleton-list">
            {[1, 2].map((n) => (
              <div key={n} className="ath-project-skeleton-row">
                <div className="ath-skeleton-img-wrapper" />
                <div className="ath-skeleton-body">
                  <div className="ath-skeleton-line short" />
                  <div className="ath-skeleton-line title" />
                  <div className="ath-skeleton-line desc-1" />
                  <div className="ath-skeleton-line desc-2" />
                  <div className="ath-skeleton-line tags" />
                </div>
              </div>
            ))}
          </div>
        ) : arrFilteredProjectsState.length === 0 ? (
          <p style={{ color: 'var(--ath-text-muted)', textAlign: 'center', padding: '40px 0' }}>
            No case studies match your directory search.
          </p>
        ) : (
          arrFilteredProjectsState.map((project, idx) => {
            const isEven = idx % 2 === 0;
            const techStack = project.strTechStack ? project.strTechStack.split(',').map(t => t.trim()) : [];
            const figLabel = `FIG. 0${idx + 1}`;
            const kicker = project.strKickerLabel || `PROJECT 0${idx + 1}`;
            const ctaText = project.strCtaText || 'Explore';
            const ctaTo = project.strCtaRoute || '/verisphere';

            return (
              <article
                key={project.id}
                className={`ath-article-row ${isEven ? 'ath-article-row-even' : ''}`}
              >
                <div className="ath-article-img-wrapper">
                  <img
                    src={project.strImageUrl}
                    alt={project.strName}
                    className="ath-article-img"
                  />
                  <div className="ath-article-badge">{figLabel}</div>
                </div>

                <div className="ath-article-body">
                  <span className="ath-article-published">0{idx + 1} — {kicker}</span>
                  <h2 className="ath-article-title">{project.strName}</h2>
                  <p className="ath-article-desc">{project.strDescription}</p>

                  <div className="ath-article-tags">
                    {techStack.map((tech, i) => (
                      <span key={i} className="ath-article-tag">
                        {tech}
                      </span>
                    ))}
                  </div>

                  <Link to={ctaTo} className="ath-article-link" style={{ marginTop: '20px' }}>
                    {ctaText}
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </Link>
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
};

ProjectsDirectory.propTypes = {
  boolIsProjectsLoadingState: PropTypes.bool.isRequired,
  arrFilteredProjectsState: PropTypes.array.isRequired
};

export default ProjectsDirectory;
