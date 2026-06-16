import React, { useState } from 'react';
import { MessageSquare, X } from 'lucide-react';
import { getToken } from './supabase.js';

const TYPES = [
  { value: 'bug',      label: '🐛 Bug report' },
  { value: 'feature',  label: '✨ Feature request' },
  { value: 'feedback', label: '💬 General feedback' },
];

const FeedbackButton = ({ user }) => {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState('feedback');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const handleOpen = () => {
    setOpen(true);
    setDone(false);
    setError('');
    setMessage('');
    setType('feedback');
    setEmail(user?.email || '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) { setError('Please enter a message.'); return; }
    setSubmitting(true);
    setError('');

    const token = getToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers,
        body: JSON.stringify({ type, message, email, pageUrl: window.location.href }),
      });
      if (!res.ok) throw new Error();
      setDone(true);
    } catch {
      setError('Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button className="feedback-trigger-btn" onClick={handleOpen}>
        <MessageSquare size={15} />
        Feedback
      </button>

      {open && (
        <div className="feedback-overlay" onClick={() => setOpen(false)}>
          <div className="feedback-modal" onClick={e => e.stopPropagation()}>
            <div className="feedback-header">
              <span>Send feedback</span>
              <button className="feedback-close" onClick={() => setOpen(false)}>
                <X size={18} />
              </button>
            </div>

            {done ? (
              <div className="feedback-done">
                <div className="feedback-done-icon">✓</div>
                <p>Thanks! We'll look into it.</p>
                <button className="feedback-submit-btn" onClick={() => setOpen(false)}>Close</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="feedback-form">
                <div className="feedback-type-row">
                  {TYPES.map(t => (
                    <button
                      key={t.value}
                      type="button"
                      className={`feedback-type-btn ${type === t.value ? 'active' : ''}`}
                      onClick={() => setType(t.value)}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                <textarea
                  className="feedback-textarea"
                  placeholder="Describe the bug, request, or feedback…"
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  rows={4}
                  required
                  autoFocus
                />

                {!user && (
                  <input
                    className="feedback-email"
                    type="email"
                    placeholder="Your email (optional)"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                )}

                {error && <div className="feedback-error">{error}</div>}

                <button type="submit" className="feedback-submit-btn" disabled={submitting}>
                  {submitting ? 'Sending…' : 'Send feedback'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default FeedbackButton;
