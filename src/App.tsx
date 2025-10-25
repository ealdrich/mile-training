import React, { useState, useEffect } from 'react';
import WorkoutLibrary from './WorkoutLibrary.js';
import Auth from './Auth.js';
import { onAuthStateChange, getCurrentUser, signOut } from './supabase.js';
import { LogOut, User } from 'lucide-react';
import './App.css';

function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      setLoading(false);
    };

    checkUser();

    // Listen for auth state changes
    const { data: { subscription } } = onAuthStateChange((_event: any, session: any) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
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
