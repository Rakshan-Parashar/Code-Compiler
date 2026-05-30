import React, { useState, useEffect } from 'react'
import S from '../Panel.module.css'
import { isFirebaseEnabled, auth } from '../../utils/firebase.js'

export default function HelpOverlayPanel({ view, onClose, openFiles, activeFile, onSelectTab, onNewFile, onOpenFolder, onOpenFile, onAI, onOpenSettings, onJumpToLine }) {
  const [account, setAccount] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [lineInput, setLineInput] = useState('')
  const [colInput, setColInput] = useState('')

  useEffect(() => {
    window.api?.loadAccount().then(a => {
      if (a) setAccount(a)
    })
  }, [])

  const shortcutsList = [
    { key: 'Ctrl+N', desc: 'Create a new file', cat: 'File' },
    { key: 'Ctrl+O', desc: 'Open a file from disk', cat: 'File' },
    { key: 'Ctrl+Shift+O', desc: 'Open a workspace folder', cat: 'File' },
    { key: 'Ctrl+S', desc: 'Save current file changes', cat: 'File' },
    { key: 'Ctrl+Shift+S', desc: 'Save current file as...', cat: 'File' },
    { key: 'Ctrl+Z', desc: 'Undo last edit', cat: 'Edit' },
    { key: 'Ctrl+Y', desc: 'Redo last undone edit', cat: 'Edit' },
    { key: 'Ctrl+Shift+F', desc: 'Format current file code', cat: 'Edit' },
    { key: 'Ctrl+Shift+K', desc: 'Open AI Coding Assistant', cat: 'Edit' },
    { key: 'Ctrl+Shift+P', desc: 'Open Command Palette', cat: 'View' },
    { key: 'Ctrl+Shift+E', desc: 'Toggle file explorer sidebar', cat: 'View' },
    { key: 'Ctrl+`', desc: 'Toggle terminal / output panel', cat: 'View' },
    { key: 'Ctrl+\\', desc: 'Split editor pane', cat: 'View' },
    { key: 'F11', desc: 'Toggle Full Screen mode', cat: 'View' },
    { key: 'Ctrl+G', desc: 'Go to specific line/column', cat: 'Go' },
    { key: 'F12', desc: 'Go to definition of symbol', cat: 'Go' },
    { key: 'Shift+F12', desc: 'Find all references of symbol', cat: 'Go' },
    { key: 'F5', desc: 'Compile and Run active program', cat: 'Run' },
    { key: 'Shift+F5', desc: 'Stop running program execution', cat: 'Run' },
    { key: 'F9', desc: 'Toggle Gutter Breakpoint', cat: 'Run' },
  ]

  const codingQuotes = [
    "Clean code always looks like it was written by someone who cares.",
    "First, solve the problem. Then, write the code.",
    "Before software can be reusable it first has to be usable.",
    "Make it work, make it right, make it fast.",
    "Simplicity is the soul of efficiency."
  ]

  const handleGoToLineSubmit = (e) => {
    e.preventDefault()
    const lineNum = parseInt(lineInput)
    if (!isNaN(lineNum) && lineNum > 0) {
      onJumpToLine?.(lineNum)
      onClose()
    }
  }

  // Filter shortcuts
  const filteredShortcuts = shortcutsList.filter(s =>
    s.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.cat.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const renderContent = () => {
    switch (view) {
      case 'welcome':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(255, 255, 255, 0.03)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--ac) 0%, var(--acl) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', color: '#060608', fontWeight: 'bold', boxShadow: '0 4px 12px rgba(0, 229, 255, 0.2)' }}>
                {account?.name?.charAt(0).toUpperCase() || '🚀'}
              </div>
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--t1)', margin: 0 }}>
                  Hello, {account?.name || 'Developer'}!
                </h2>
                <p style={{ fontSize: '12px', color: 'var(--t3)', margin: '4px 0 0 0' }}>
                  Welcome back to your Atmos workspace.
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <h3 style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--t3)', margin: '0 0 8px 0', fontWeight: 'bold' }}>
                  System Status
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: 'var(--t2)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--t3)' }}>IDE Version:</span>
                    <span>v1.0.0</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--t3)' }}>Cloud Sync:</span>
                    <span style={{ color: isFirebaseEnabled ? 'var(--ac)' : 'var(--t2)' }}>
                      {isFirebaseEnabled ? 'Firebase Active' : 'SQLite Local'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--t3)' }}>Engine:</span>
                    <span>Electron v28.3.3</span>
                  </div>
                </div>
              </div>

              <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <h3 style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--t3)', margin: '0 0 8px 0', fontWeight: 'bold' }}>
                  Quick Actions
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
                  <button onClick={() => { onNewFile?.(); onClose() }} style={{ textAlign: 'left', background: 'none', border: 'none', color: 'var(--ac)', cursor: 'pointer', padding: 0 }}>
                    📄 Create New File
                  </button>
                  <button onClick={() => { onOpenFolder?.(); onClose() }} style={{ textAlign: 'left', background: 'none', border: 'none', color: 'var(--ac)', cursor: 'pointer', padding: 0 }}>
                    🗂 Open Workspace Folder
                  </button>
                  <button onClick={() => { onAI?.(); onClose() }} style={{ textAlign: 'left', background: 'none', border: 'none', color: 'var(--ac)', cursor: 'pointer', padding: 0 }}>
                    ✨ Ask AI Assistant
                  </button>
                </div>
              </div>
            </div>

            <div style={{ background: 'rgba(0, 0, 0, 0.15)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.05)', fontStyle: 'italic', fontSize: '12.5px', color: 'var(--t3)', textAlign: 'center', lineHeight: '1.5' }}>
              "{codingQuotes[Math.floor(Date.now() / 86400000) % codingQuotes.length]}"
            </div>
          </div>
        )

      case 'shortcuts':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '55vh' }}>
            <div className={S.field}>
              <input 
                type="text" 
                value={searchQuery} 
                onChange={e => setSearchQuery(e.target.value)} 
                placeholder="Search keyboard shortcuts..." 
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  color: 'var(--t1)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  fontSize: '13px',
                  outline: 'none'
                }}
              />
            </div>
            <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }}>
              {filteredShortcuts.map((s, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontSize: '12.5px', color: 'var(--t1)' }}>{s.desc}</span>
                    <span style={{ fontSize: '10px', color: 'var(--t3)', textTransform: 'uppercase' }}>{s.cat}</span>
                  </div>
                  <kbd style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '4px', padding: '3px 8px', fontSize: '11px', fontFamily: 'var(--fmono)', color: 'var(--t2)', whiteSpace: 'nowrap' }}>
                    {s.key}
                  </kbd>
                </div>
              ))}
              {filteredShortcuts.length === 0 && (
                <div style={{ color: 'var(--t3)', fontSize: '12px', textAlign: 'center', padding: '20px' }}>
                  No shortcuts match your search query.
                </div>
              )}
            </div>
          </div>
        )

      case 'about':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'linear-gradient(135deg, var(--ac) 0%, var(--acl) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(0, 229, 255, 0.25)' }}>
              <svg viewBox="0 0 20 20" fill="none" width="36">
                <polygon points="10,2 18,16 2,16" stroke="#060608" strokeWidth="2" strokeLinejoin="round" fill="rgba(6,6,8,.1)" />
                <path d="M7 13l3-6 3 6" stroke="rgba(6,6,8,.8)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M8.5 11h3" stroke="rgba(6,6,8,.8)" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--t1)', margin: 0 }}>
                Atmos IDE
              </h2>
              <p style={{ fontSize: '12.5px', color: 'var(--ac)', fontWeight: '500', margin: '4px 0 0 0' }}>
                Ultimate Hybrid Code Execution Environment
              </p>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '10px', padding: '12px 18px', width: '100%', fontSize: '12px', color: 'var(--t2)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--t3)' }}>Version:</span>
                <span>1.0.0 (Desktop Edition)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--t3)' }}>Developer:</span>
                <span>Google DeepMind AAC & Rakshan Parashar</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--t3)' }}>License:</span>
                <span>MIT License</span>
              </div>
            </div>

            <p style={{ fontSize: '11px', color: 'var(--t3)', lineHeight: '1.5', margin: 0 }}>
              Atmos IDE is designed as a hybrid workspace environment providing local execution toolchains alongside secure Google Firebase cloud synchronization.
            </p>
          </div>
        )

      case 'gotoline':
        return (
          <form onSubmit={handleGoToLineSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className={S.field}>
              <label className={S.label}>Line Number *</label>
              <input 
                type="number" 
                value={lineInput} 
                onChange={e => setLineInput(e.target.value)} 
                placeholder="1" 
                min="1"
                required
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  color: 'var(--t1)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  fontSize: '13px',
                  outline: 'none'
                }}
                autoFocus
              />
            </div>
            <div className={S.field}>
              <label className={S.label}>Column Number (Optional)</label>
              <input 
                type="number" 
                value={colInput} 
                onChange={e => setColInput(e.target.value)} 
                placeholder="1" 
                min="1"
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  color: 'var(--t1)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  fontSize: '13px',
                  outline: 'none'
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
              <button type="button" className={S.resetBtn} style={{ flex: 1 }} onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className={S.saveBtn} style={{ flex: 1 }}>
                Jump to Line
              </button>
            </div>
          </form>
        )

      default:
        return null
    }
  }

  const getHeaderTitle = () => {
    switch (view) {
      case 'welcome': return 'Greeting Dashboard'
      case 'shortcuts': return 'Keyboard Shortcuts'
      case 'about': return 'About Atmos IDE'
      case 'gotoline': return 'Go to Line'
      default: return 'Information'
    }
  }

  return (
    <div className={S.backdrop} onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className={S.panel} style={{ width: view === 'shortcuts' ? 480 : 400 }}>
        <div className={S.hdr}>
          <div className={S.hdrLeft}>
            <svg viewBox="0 0 16 16" width="14" fill="none" stroke="currentColor" strokeWidth="1.2">
              <circle cx="8" cy="8" r="6" />
              <line x1="8" y1="11" x2="8" y2="8" />
              <line x1="8" y1="5" x2="8" y2="5" />
            </svg>
            <span>{getHeaderTitle()}</span>
          </div>
          <button className={S.closeBtn} onClick={onClose}>×</button>
        </div>
        <div className={S.bodyPad}>
          {renderContent()}
        </div>
      </div>
    </div>
  )
}
