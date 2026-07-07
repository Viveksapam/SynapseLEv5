import React from 'react';
import LegalPage from '../components/LegalPage';

const h2 = { fontSize: '1.1rem', color: '#f5f5f7', margin: '1.8rem 0 0.6rem' };
const p = { margin: '0 0 0.8rem' };
const ul = { margin: '0 0 0.8rem', paddingLeft: '1.2rem' };

const PrivacyPolicyPage = () => (
  <LegalPage title="Privacy Policy" updatedDate="July 5, 2026">
    <p style={p}>
      This describes what Synapse LE collects, why, and who it's shared with. It applies to
      the main site and to VeriSphere.
    </p>

    <h2 style={h2}>What we collect</h2>
    <ul style={ul}>
      <li>Account info: username, email, first and last name, password (stored as a salted hash, never in plain text).</li>
      <li>Content you post: posts, comments, sources you submit, and reactions.</li>
      <li>Optional profile info: bio and profile picture, if you add them.</li>
      <li>Basic server logs (IP address, timestamps, request paths) generated automatically by hosting infrastructure.</li>
    </ul>

    <h2 style={h2}>Why we collect it</h2>
    <ul style={ul}>
      <li>Email verifies you're a real person at sign-up and lets you recover your account (password reset).</li>
      <li>Username and name are shown publicly next to what you post.</li>
      <li>Server logs are used only for debugging and abuse prevention, not tracking or advertising.</li>
    </ul>

    <h2 style={h2}>Who it's shared with</h2>
    <p style={p}>
      We don't sell your data. It's shared only with the services that run the platform:
    </p>
    <ul style={ul}>
      <li><strong>Resend</strong> - sends verification and password-reset emails on our behalf.</li>
      <li><strong>Google Gemini</strong> - processes post/comment text you or another user submits for AI analysis, when that feature is used.</li>
      <li><strong>Neon / Render</strong> - our database and hosting providers, who store data on our behalf under their own security practices.</li>
    </ul>

    <h2 style={h2}>Your controls</h2>
    <ul style={ul}>
      <li>Edit your profile info any time from account settings.</li>
      <li>Change your password, or reset it via email if you forget it.</li>
      <li>Deactivate your account - this stops it from authenticating; your past comments keep their display name, consistent with how public discussion threads work elsewhere.</li>
      <li>Request full account deletion by emailing us (see below) if deactivation isn't enough.</li>
    </ul>

    <h2 style={h2}>Data retention</h2>
    <p style={p}>
      An unverified sign-up (never confirmed by email code) is not kept indefinitely - a fresh
      registration attempt for the same username or email simply overwrites it. Verified
      account data is kept until you request deletion.
    </p>

    <h2 style={h2}>Changes</h2>
    <p style={p}>
      This policy may be updated as the platform evolves. Material changes will be reflected
      here with an updated date.
    </p>

    <h2 style={h2}>Contact</h2>
    <p style={p}>
      Questions, or a data deletion request: <a href="mailto:vsapofficial@gmail.com" style={{ color: '#8fb3ff' }}>vsapofficial@gmail.com</a>.
    </p>
  </LegalPage>
);

export default PrivacyPolicyPage;
