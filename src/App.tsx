import React, { useState, useEffect } from 'react';
import WorkoutLibrary from './WorkoutLibrary.js';
import Auth from './Auth.js';
import { getCurrentUser, signOut } from './supabase.js';
import { LogOut, User } from 'lucide-react';
import './App.css';

function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

  if (!user) {
    return (
      <div className="App">
        <Auth onAuthSuccess={setUser} />
      </div>
    );
  }

  return (
    <div className="App">
      <div className="app-header-auth">
        <div className="user-info">
          <User size={20} />
          <span>{user.email}</span>
        </div>
        <button onClick={handleSignOut} className="sign-out-btn">
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
      <WorkoutLibrary user={user} />
    </div>
  );
}

export default App;
