import React from 'react'
import S from './StatusBar.module.css'

const LANG = { javascript:'JavaScript',typescript:'TypeScript',python:'Python',html:'HTML',css:'CSS',json:'JSON',markdown:'Markdown',shellscript:'Shell Script',c:'C',cpp:'C++',java:'Java',go:'Go',rust:'Rust',ruby:'Ruby',php:'PHP',plaintext:'Plain Text',sql:'SQL',yaml:'YAML' }

export default function StatusBar({ language, fileName, modified, line, col, running, onOpenSettings }) {
  return (
    <footer className={S.bar}>
      <div className={S.left}>
        <button className={`${S.item} ${S.brand}`}>
          <svg viewBox="0 0 24 24" fill="none" width="11" height="11" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M8 5 A 8.5 8.5 0 0 0 8 19" />
            <path d="M16 5 A 8.5 8.5 0 0 1 16 19" />
            <circle cx="12" cy="12" r="2.5" fill="currentColor" stroke="none" />
          </svg>
          Atmos
        </button>
        {running && <span className={`${S.item} ${S.running}`}>● Running…</span>}
      </div>
      <div className={S.right}>
        {fileName && (
          <>
            <span className={S.item}>Ln {line}, Col {col}</span>
            <div className={S.sep} />
            <span className={S.item}>UTF-8</span>
            <div className={S.sep} />
            <span className={S.item}>LF</span>
            <div className={S.sep} />
            {language && <span className={S.item}>{LANG[language] || language}</span>}
            <div className={S.sep} />
          </>
        )}
        <button className={S.item} onClick={onOpenSettings} title="Open Settings">
          <svg viewBox="0 0 14 14" width="11" fill="none"><circle cx="7" cy="7" r="2.2" stroke="currentColor" strokeWidth="1.1"/><path d="M7 1.5v1.7M7 10.8v1.7M1.5 7h1.7M10.8 7h1.7M3.1 3.1l1.2 1.2M9.7 9.7l1.2 1.2M3.1 10.9l1.2-1.2M9.7 4.3l1.2-1.2" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/></svg>
          Settings
        </button>
      </div>
    </footer>
  )
}
