import React from 'react';
import { ArrowLeft, Award, CheckCircle, BrainCircuit, Activity, Calendar, FileText } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import SEO from '../../components/SEO';
import './CredentialsPage.css';

function CredentialsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const boolJustCompleted = location.state?.boolJustCompleted || false;

  const arrSkills = [
    { strName: 'React Architecture', numUser: boolJustCompleted ? 92 : 70, numMarket: 85, color: '#6366f1' },
    { strName: 'FastAPI API Design', numUser: boolJustCompleted ? 85 : 80, numMarket: 80, color: '#10b981' },
    { strName: 'System Scalability', numUser: boolJustCompleted ? 78 : 65, numMarket: 75, color: '#f59e0b' },
  ];

  const arrTimeline = [
    { date: 'Today', title: 'React Architecture Exam Completed', icon: <FileText size={16} />, active: boolJustCompleted },
    { date: 'Oct 12, 2026', title: 'Earned Synapse Verified Badge', icon: <CheckCircle size={16} />, active: true },
    { date: 'Sep 05, 2026', title: 'Completed Backend Sandbox Project', icon: <Activity size={16} />, active: false },
    { date: 'Aug 20, 2026', title: 'Enrolled in Full Stack Track', icon: <Calendar size={16} />, active: false },
  ];

  return (
    <div className="cred-dashboard-wrapper">
      <SEO 
        title="Verifiable Credentials - Synapse" 
        description="View and verify developer credentials, skill benchmarks, and achievements on the Synapse platform."
        icon="/credentials.svg"
      />
      <nav className="cred-sidebar">
        <div className="sidebar-brand">
          <BrainCircuit size={24} color="#6366f1" />
          <span>Synapse</span>
        </div>
        <div className="sidebar-menu">
          <button className="menu-btn active">Dashboard</button>
          <button className="menu-btn" onClick={() => navigate('/assessment')}>Take Exam</button>
          <button className="menu-btn" onClick={() => navigate('/')}>Main Page</button>
        </div>
      </nav>

      <main className="cred-main-content">
        <header className="dashboard-header">
          <div>
            <h1 className="dashboard-title">Credentials Dashboard</h1>
            <p className="dashboard-subtitle">Monitor your technical proficiency and industry standing.</p>
          </div>
          <button className="btn-primary-exam" onClick={() => navigate('/assessment')}>
            <BrainCircuit size={18} /> Start New Assessment
          </button>
        </header>

        <div className="dashboard-grid">
          {/* Radial Benchmark Widget */}
          <div className="widget-card col-span-2">
            <h3 className="widget-title">Skillset Benchmark Rings</h3>
            <div className="radial-rings-container">
              {arrSkills.map((objSkill, index) => {
                const radius = 40;
                const circumference = 2 * Math.PI * radius;
                const strokeDashoffset = circumference - (objSkill.numUser / 100) * circumference;
                
                return (
                  <div key={index} className="radial-item">
                    <svg width="120" height="120" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r={radius} fill="transparent" stroke="var(--border-light)" strokeWidth="8" />
                      <circle 
                        cx="50" 
                        cy="50" 
                        r={radius} 
                        fill="transparent" 
                        stroke={objSkill.color} 
                        strokeWidth="8" 
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        transform="rotate(-90 50 50)"
                        className="radial-progress-circle"
                      />
                    </svg>
                    <div className="radial-content">
                      <span className="radial-score">{objSkill.numUser}%</span>
                    </div>
                    <span className="radial-label">{objSkill.strName}</span>
                    <span className="radial-sub">Market: {objSkill.numMarket}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Certificate Widget */}
          <div className="widget-card cert-widget">
            <div className={`certificate-card ${boolJustCompleted ? 'unlocked' : ''}`}>
              <div className="cert-top">
                <Award size={40} className="cert-award-icon" />
                <h2>Synapse Certificate</h2>
                <span className="cert-sub">VERIFIED CREDENTIAL</span>
              </div>
              <div className="cert-body">
                <p className="cert-recipient">VIVEK SAPAM</p>
                <div className="cert-score">
                  <span>OVERALL SCORE</span>
                  <strong>{boolJustCompleted ? '92%' : '70%'}</strong>
                </div>
              </div>
              <div className="cert-footer">
                <div className="cert-seal">
                  <CheckCircle size={14} /> Verified Seal
                </div>
                <span className="cert-id">ID: SYN-998374</span>
              </div>
            </div>
          </div>

          {/* Timeline Widget */}
          <div className="widget-card col-span-3 timeline-widget">
            <h3 className="widget-title">Recent Achievements</h3>
            <div className="timeline-container">
              {arrTimeline.map((item, idx) => (
                <div key={idx} className={`timeline-item ${item.active ? 'active' : ''}`}>
                  <div className="timeline-icon">{item.icon}</div>
                  <div className="timeline-content">
                    <h4>{item.title}</h4>
                    <span>{item.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

export default CredentialsPage;

