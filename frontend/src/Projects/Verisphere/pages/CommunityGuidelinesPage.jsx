import React from 'react';

const sectionStyle = { marginBottom: '1.5rem' };
const headingStyle = { fontFamily: 'var(--cr-font-heading)', fontSize: '1.05rem', color: 'var(--cr-text-main)', margin: '0 0 0.5rem' };
const bodyStyle = { fontSize: '0.95rem', lineHeight: '1.6', color: 'var(--cr-text-main)', margin: 0 };
const listStyle = { fontSize: '0.95rem', lineHeight: '1.7', color: 'var(--cr-text-main)', margin: '0.4rem 0 0', paddingLeft: '1.2rem' };

const CommunityGuidelinesPage = () => (
  <div className="verisphere-post-detail" style={{
    maxWidth: '760px', margin: '20px auto', padding: '24px 28px 28px',
    background: 'var(--cr-surface)', border: '1px solid var(--cr-border)',
    borderRadius: 'var(--cr-radius-card)', boxShadow: 'var(--cr-shadow-card)',
    fontSize: '0.95rem', lineHeight: '1.6',
  }}>
    <h1 style={{ fontFamily: 'var(--cr-font-heading)', fontSize: '1.6rem', color: 'var(--cr-text-main)', marginTop: 0 }}>
      Community guidelines
    </h1>
    <p style={{ ...bodyStyle, color: 'var(--cr-text-muted)', marginBottom: '2rem' }}>
      VeriSphere exists for arguments to be judged on their merits, not their volume. These
      guidelines exist to keep that possible.
    </p>

    <div style={sectionStyle}>
      <h2 style={headingStyle}>Be civil</h2>
      <p style={bodyStyle}>
        Attack the argument, never the person. Personal insults, harassment, threats, and
        targeted abuse are removed regardless of who is "right" in the underlying debate.
      </p>
    </div>

    <div style={sectionStyle}>
      <h2 style={headingStyle}>Argue in good faith</h2>
      <ul style={listStyle}>
        <li>Respond to what someone actually said, not a strawman of it.</li>
        <li>If you cite a source, it should genuinely support your claim.</li>
        <li>Being shown wrong is normal here - update your position, don't dig in for its own sake.</li>
      </ul>
    </div>

    <div style={sectionStyle}>
      <h2 style={headingStyle}>No spam or manipulation</h2>
      <p style={bodyStyle}>
        Don't flood posts or comments, don't create multiple accounts to fake agreement, and
        don't use the AI analysis tools to harass another user rather than examine an argument.
      </p>
    </div>

    <div style={sectionStyle}>
      <h2 style={headingStyle}>Illegal content</h2>
      <p style={bodyStyle}>
        Content that is illegal in the jurisdiction Synapse LE operates in - threats of
        violence, exploitation of minors, doxxing, and similar - is removed on sight and may be
        reported to relevant authorities.
      </p>
    </div>

    <div style={sectionStyle}>
      <h2 style={headingStyle}>Enforcement</h2>
      <p style={bodyStyle}>
        Moderators may remove content or suspend accounts that violate these guidelines.
        Reputation on VeriSphere is a ledger of past conduct, never a license to break these
        rules going forward.
      </p>
    </div>

    <p style={{ ...bodyStyle, color: 'var(--cr-text-muted)', fontSize: '0.85rem', marginTop: '2rem' }}>
      Questions about a moderation decision, or think something here should change? Reach out
      at <a href="mailto:vsapofficial@gmail.com" style={{ color: 'var(--cr-text-main)' }}>vsapofficial@gmail.com</a>.
    </p>
  </div>
);

export default CommunityGuidelinesPage;
