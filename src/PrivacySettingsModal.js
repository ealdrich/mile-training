import React, { useState } from 'react';
import { updateUserSettings } from './supabase.js';
import { Copy, Check } from 'lucide-react';

const PrivacySettingsModal = ({ isNewUser, user, onClose, profileUrl }) => {
  const [schedulePublic, setSchedulePublic] = useState(user.schedulePublic || false);
  const [historyPublic, setHistoryPublic] = useState(user.historyPublic || false);
  const [displayName, setDisplayName] = useState(user.displayName || '');
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await updateUserSettings({ schedulePublic, historyPublic, displayName });
    onClose({ schedulePublic, historyPublic, displayName });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(profileUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-overlay">
      <div className="modal privacy-modal">
        <h2>{isNewUser ? 'Welcome!' : 'Privacy Settings'}</h2>
        {isNewUser && (
          <p className="privacy-intro">
            Your training plan and workout history are <strong>private by default</strong> — no one else can see your data unless you choose to make it public.
          </p>
        )}

        <div className="form-field privacy-name-field">
          <label htmlFor="display-name">Display name <span className="field-optional">(shown in search results)</span></label>
          <input
            id="display-name"
            type="text"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            placeholder="Your name"
          />
        </div>

        <div className="privacy-toggles">
          <label className="privacy-toggle-row">
            <div className="toggle-info">
              <span className="toggle-label">Training plan</span>
              <span className="toggle-desc">Allow anyone to view your training schedules via a public link</span>
            </div>
            <div
              className={`toggle-switch ${schedulePublic ? 'on' : ''}`}
              onClick={() => setSchedulePublic(v => !v)}
              role="switch"
              aria-checked={schedulePublic}
            >
              <div className="toggle-thumb" />
            </div>
          </label>

          <label className="privacy-toggle-row">
            <div className="toggle-info">
              <span className="toggle-label">Workout history</span>
              <span className="toggle-desc">Allow anyone to view your completed workout history via a public link</span>
            </div>
            <div
              className={`toggle-switch ${historyPublic ? 'on' : ''}`}
              onClick={() => setHistoryPublic(v => !v)}
              role="switch"
              aria-checked={historyPublic}
            >
              <div className="toggle-thumb" />
            </div>
          </label>
        </div>

        {profileUrl && (
          <div className="privacy-profile-url">
            <span className="privacy-url-label">Your public profile URL</span>
            <div className="privacy-url-row">
              <span className="privacy-url-text">{profileUrl}</span>
              <button className="copy-url-btn" onClick={handleCopy} title="Copy link">
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>
          </div>
        )}

        {!isNewUser && (
          <div className="privacy-note">
            Changes take effect immediately.
          </div>
        )}

        <div className="privacy-modal-actions">
          {!isNewUser && (
            <button className="cancel-btn" onClick={() => onClose({ schedulePublic: user.schedulePublic, historyPublic: user.historyPublic, displayName: user.displayName })}>
              Cancel
            </button>
          )}
          <button className="auth-submit-btn" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : isNewUser ? 'Get started' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrivacySettingsModal;
