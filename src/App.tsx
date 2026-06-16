import React, { useState, useEffect } from 'react';
import WorkoutLibrary from './WorkoutLibrary.js';
import Auth from './Auth.js';
import PublicProfile from './PublicProfile.js';
import PrivacySettingsModal from './PrivacySettingsModal.js';
import FeedbackButton from './FeedbackButton.js';
import { getCurrentUser, signOut } from './supabase.js';
import { LogOut, User, Settings, Info } from 'lucide-react';
import './App.css';

function getPublicUserId(): string | null {
  const m = window.location.pathname.match(/^\/profile\/([^/]+)$/);
  return m ? m[1] : null;
}

function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [showAbout, setShowAbout] = useState(false);
  const publicUserId = getPublicUserId();

  useEffect(() => {
    getCurrentUser().then(currentUser => {
      setUser(currentUser);
      setLoading(false);
    });
  }, []);

  const handleSignOut = async () => {
    await signOut();
    setUser(null);
  };

  const handleAuthSuccess = (newUser: any) => {
    setUser(newUser);
    setShowAuth(false);
  };

  const handleSettingsSaved = (updated: any) => {
    setUser((u: any) => ({ ...u, ...updated }));
    setShowSettings(false);
  };

  const openSignIn = () => { setAuthMode('signin'); setShowAuth(true); };
  const openSignUp = () => { setAuthMode('signup'); setShowAuth(true); };

  if (loading) {
    return (
      <div className="App">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Public profile view
  if (publicUserId) {
    return (
      <div className="App">
        <PublicProfile
          userId={publicUserId}
          currentUser={user}
          onSignIn={openSignIn}
        />
        {showAuth && (
          <div className="auth-modal-layer">
            <Auth
              initialMode={authMode}
              onAuthSuccess={handleAuthSuccess}
              onCancel={() => setShowAuth(false)}
            />
          </div>
        )}
      </div>
    );
  }

  // Auth screen (overlay on the app)
  if (showAuth) {
    return (
      <div className="App">
        <Auth
          initialMode={authMode}
          onAuthSuccess={handleAuthSuccess}
          onCancel={() => setShowAuth(false)}
        />
      </div>
    );
  }

  const profileUrl = user ? `${window.location.origin}/profile/${user.id}` : null;

  return (
    <div className="App">
      <div className="app-header-auth">
        {user ? (
          <>
            <div className="user-info">
              <User size={20} />
              <span>{user.email}</span>
            </div>
            <div className="header-actions">
              <button className="about-btn" onClick={() => setShowAbout(true)}>
                <Info size={15} /> About
              </button>
              <FeedbackButton user={user} />
              <button
                className="settings-btn"
                onClick={() => setShowSettings(true)}
                title="Account settings"
              >
                <Settings size={16} />
              </button>
              <button onClick={handleSignOut} className="sign-out-btn">
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="user-info guest-label">
              Browse as guest
            </div>
            <div className="header-actions">
              <button className="about-btn" onClick={() => setShowAbout(true)}>
                <Info size={15} /> About
              </button>
              <FeedbackButton user={user} />
              <button className="sign-in-btn-header" onClick={openSignIn}>Sign In</button>
              <button className="sign-up-btn-header" onClick={openSignUp}>Create Account</button>
            </div>
          </>
        )}
      </div>

      {showSettings && profileUrl && (
        <PrivacySettingsModal
          isNewUser={false}
          user={user}
          onClose={handleSettingsSaved}
          profileUrl={profileUrl}
        />
      )}

      <WorkoutLibrary user={user} onSignInRequired={openSignIn} />

      {showAbout && (
        <div className="about-overlay" onClick={() => setShowAbout(false)}>
          <div className="about-modal" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            <div className="about-header">
              <span>About Goobr</span>
              <button className="about-close" onClick={() => setShowAbout(false)}>✕</button>
            </div>
            <div className="about-body">
              <p className="about-tagline">This is not a Strava replacement!</p>
              <p className="about-intro"><strong>Purpose:</strong></p>
              <ul className="about-list">
                <li>Keep a standardized catalog of workouts</li>
                <li>Build training plans from the catalog</li>
                <li>Track workouts — import them from Strava</li>
                <li>Analyze the key metrics for each workout type</li>
              </ul>
              <p className="about-note">
                You can import any activity from Strava, but the intention is only to import
                key workouts and to track their target metrics here.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
