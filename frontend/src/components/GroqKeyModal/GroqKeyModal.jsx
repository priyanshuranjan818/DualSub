import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import './GroqKeyModal.css';

export default function GroqKeyModal() {
  const { groqApiKey, updateGroqApiKey, showKeyModal, setShowKeyModal } = useAppContext();
  const [inputKey, setInputKey] = useState(groqApiKey || '');

  if (!showKeyModal) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputKey.trim().startsWith('gsk_')) {
      updateGroqApiKey(inputKey.trim());
      setShowKeyModal(false);
    } else {
      alert('Please enter a valid Groq API key starting with gsk_');
    }
  };

  return (
    <div className="groq-modal-overlay">
      <div className="groq-modal">
        <h2 className="groq-modal__title">Welcome to LearnWithHaxx</h2>
        <p className="groq-modal__desc">
          To keep this application completely free and unlimited, you need to provide your own <strong>Groq API Key</strong> to transcribe audio.
        </p>
        <p className="groq-modal__desc">
          Groq AI is currently offering an incredibly fast and free API tier. You can generate a free key in just 30 seconds.
        </p>
        
        <form onSubmit={handleSubmit} className="groq-modal__form">
          <a
            href="https://console.groq.com/keys"
            target="_blank"
            rel="noopener noreferrer"
            className="groq-modal__link"
          >
            Click here to generate your free API Key ↗
          </a>
          <input
            type="text"
            className="groq-modal__input"
            value={inputKey}
            onChange={(e) => setInputKey(e.target.value)}
            placeholder="gsk_..."
            autoFocus
          />
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="submit" className="groq-modal__btn" style={{ flex: 1 }} disabled={!inputKey}>
              Save Key & Start
            </button>
            {groqApiKey && (
              <button type="button" className="groq-modal__btn" style={{ background: 'var(--bg-active)' }} onClick={() => setShowKeyModal(false)}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
