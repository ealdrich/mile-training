import React, { useState } from 'react';
import { signIn, signUp } from './supabase.js';
import './Auth.css';

const Auth = ({ onAuthSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isSignUp) {
        const { data, error } = await signUp(email, password);
        if (error) {
          setError(error.message);
        } else {
          alert('Check your email for the confirmation link!');
          setIsSignUp(false);
        }
      } else {
        const { data, error } = await signIn(email, password);
        if (error) {
          setError(error.message);
        } else if (data.user) {
          onAuthSuccess(data.user);
        }
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMode = () => {
    setIsSignUp(!isSignUp);
    setError('');
    setEmail('');
    setPassword('');
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="app-logo">
            <img
              src={`${process.env.PUBLIC_URL}/grubes_logo.png`}
              alt="Grube's GOOBS"
              className="logo-image"
            />
          </div>
          <h1>Mile Training with Dan Gruber</h1>
          <p>{isSignUp ? 'Create your account' : 'Sign in to continue'}</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              autoComplete="email"
            />
          </div>

          <div className="form-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              required
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              minLength={6}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button
            type="submit"
            className="auth-submit-btn"
            disabled={loading || !email || !password}
          >
            {loading ? 'Please wait...' : (isSignUp ? 'Sign Up' : 'Sign In')}
          </button>
        </form>

        <div className="auth-toggle">
          {isSignUp ? (
            <p>
              Already have an account?{' '}
              <button
                type="button"
                className="toggle-btn"
                onClick={handleToggleMode}
              >
                Sign In
              </button>
            </p>
          ) : (
            <p>
              Don't have an account?{' '}
              <button
                type="button"
                className="toggle-btn"
                onClick={handleToggleMode}
              >
                Sign Up
              </button>
            </p>
          )}
        </div>

        {isSignUp && (
          <div className="signup-info">
            <p><strong>Note:</strong> You'll need to confirm your email address before you can sign in.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Auth;