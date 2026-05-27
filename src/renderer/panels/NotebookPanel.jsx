import React from 'react';
import S from './Panel.module.css';

export default function NotebookPanel({ onClose }) {
  return (
    <div className={S.panel}>
      <div className={S.header}>
        <h2>Notebooks</h2>
        <button onClick={onClose} title="Close (Esc)">
          <svg viewBox="0 0 16 16" fill="none" width="14">
            <path d="M1 1l14 14M15 1L1 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      <div className={S.body}>
        <p>Notebooks will be listed here.</p>
        {/* Notebooks list and editor will go here */}
      </div>
    </div>
  );
}
