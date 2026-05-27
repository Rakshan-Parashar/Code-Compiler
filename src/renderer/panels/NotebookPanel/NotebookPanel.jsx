import React, { useState } from 'react'
import Editor from '@monaco-editor/react'
import S from '../Panel.module.css'

export default function NotebookPanel({ 
  onClose, 
  notify, 
  notebooks = [], 
  activeNotebook, 
  createNotebook, 
  readNotebook, 
  writeNotebook, 
  deleteNotebook, 
  updateContent, 
  setActiveNotebook 
}) {
  const [search, setSearch] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [newNotebookName, setNewNotebookName] = useState('')

  // Filter notebooks based on search
  const filtered = notebooks.filter(name => name.toLowerCase().includes(search.toLowerCase()))

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!newNotebookName.trim()) return
    let name = newNotebookName.trim()
    if (!name.endsWith('.md')) name += '.md'
    await createNotebook(name)
    setNewNotebookName('')
    setIsCreating(false)
  }

  const handleDelete = async (e, name) => {
    e.stopPropagation()
    if (confirm(`Are you sure you want to delete the notebook "${name}"?`)) {
      await deleteNotebook(name)
    }
  }

  const handleSave = () => {
    if (activeNotebook) {
      writeNotebook(activeNotebook.name, activeNotebook.content)
    }
  }

  return (
    <div className={S.backdrop} onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className={S.panel} style={{ width: 1000, height: '80vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div className={S.hdr}>
          <div className={S.hdrLeft}>
            <svg viewBox="0 0 16 16" width="16" fill="none" style={{ color: 'var(--ac)' }}>
              <path d="M4 3h8M4 6h8M4 9h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <rect x="2" y="1" width="12" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
            <span style={{ fontWeight: 'bold' }}>Zenith Notebooks</span>
          </div>
          <button className={S.closeBtn} onClick={onClose}>×</button>
        </div>

        {/* Body Split */}
        <div className={S.body} style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          
          {/* Left Sidebar: Notebook list */}
          <div style={{ width: 280, borderRight: '1px solid var(--b1)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px', background: '#0a0a0d' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input 
                type="text" 
                placeholder="Search notebooks..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  flex: 1,
                  background: '#121218',
                  border: '1px solid #1c1c24',
                  borderRadius: '6px',
                  padding: '6px 10px',
                  color: '#fff',
                  fontSize: '12px',
                  outline: 'none'
                }}
              />
              <button 
                onClick={() => setIsCreating(true)}
                title="Create Notebook"
                style={{
                  background: 'var(--ac)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  width: '28px',
                  height: '28px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                +
              </button>
            </div>

            {/* Create Notebook Form */}
            {isCreating && (
              <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '10px', background: '#121218', borderRadius: '6px', border: '1px solid #1c1c24' }}>
                <span style={{ fontSize: '11px', color: '#8c8c9e', fontWeight: 'bold' }}>NEW NOTEBOOK NAME</span>
                <input 
                  type="text"
                  placeholder="e.g. todo, notes"
                  value={newNotebookName}
                  onChange={e => setNewNotebookName(e.target.value)}
                  autoFocus
                  style={{
                    background: '#0d0d12',
                    border: '1px solid #2d2d38',
                    borderRadius: '4px',
                    padding: '5px 8px',
                    color: '#fff',
                    fontSize: '12px',
                    outline: 'none'
                  }}
                />
                <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', marginTop: '4px' }}>
                  <button 
                    type="button" 
                    onClick={() => setIsCreating(false)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#8c8c9e',
                      fontSize: '11px',
                      cursor: 'pointer',
                      padding: '4px 8px'
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    style={{
                      background: 'var(--ac)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      padding: '4px 10px'
                    }}
                  >
                    Create
                  </button>
                </div>
              </form>
            )}

            {/* Notebooks List */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {filtered.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#5a5a6e', fontSize: '12px', marginTop: '20px' }}>
                  No notebooks found
                </div>
              ) : (
                filtered.map(name => (
                  <div 
                    key={name}
                    onClick={() => readNotebook(name)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      background: activeNotebook?.name === name ? 'rgba(124, 58, 237, 0.15)' : 'none',
                      border: activeNotebook?.name === name ? '1px solid rgba(124, 58, 237, 0.4)' : '1px solid transparent',
                      cursor: 'pointer',
                      color: activeNotebook?.name === name ? '#fff' : '#b5b5c0',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={e => {
                      if (activeNotebook?.name !== name) e.currentTarget.style.background = 'rgba(255,255,255,0.02)'
                    }}
                    onMouseLeave={e => {
                      if (activeNotebook?.name !== name) e.currentTarget.style.background = 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                      <span style={{ fontSize: '14px' }}>📝</span>
                      <span style={{ fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {name.replace(/\.md$/, '')}
                      </span>
                    </div>
                    <button 
                      onClick={(e) => handleDelete(e, name)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#d32f2f',
                        cursor: 'pointer',
                        fontSize: '14px',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(211, 47, 47, 0.1)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Column: Editor & Preview */}
          <div style={{ flex: 1, background: '#0d0d12', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {activeNotebook ? (
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                {/* Active Notebook Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 18px', borderBottom: '1px solid #1c1c24', background: '#0a0a0d' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff' }}>
                      {activeNotebook.name.replace(/\.md$/, '')}
                    </span>
                    {activeNotebook.modified ? (
                      <span style={{ color: '#d97706', fontSize: '10px' }}>● Unsaved</span>
                    ) : (
                      <span style={{ color: '#059669', fontSize: '10px' }}>● Saved</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      onClick={handleSave}
                      style={{
                        background: activeNotebook.modified ? 'var(--ac)' : '#2d2d38',
                        color: activeNotebook.modified ? '#fff' : '#8c8c9e',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '6px 12px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        cursor: activeNotebook.modified ? 'pointer' : 'default'
                      }}
                    >
                      Save
                    </button>
                    <button 
                      onClick={() => setActiveNotebook(null)}
                      style={{
                        background: '#2d2d38',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '6px 12px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                      }}
                    >
                      Close
                    </button>
                  </div>
                </div>

                {/* Editor wrap */}
                <div style={{ flex: 1, position: 'relative' }}>
                  <Editor 
                    key={activeNotebook.name}
                    height="100%"
                    theme="vs-dark"
                    language="markdown"
                    value={activeNotebook.content || ''}
                    onChange={val => updateContent(val || '')}
                    options={{
                      fontSize: 13,
                      fontFamily: "'JetBrains Mono', monospace",
                      minimap: { enabled: false },
                      wordWrap: 'on',
                      padding: { top: 12, bottom: 12 }
                    }}
                  />
                </div>
              </div>
            ) : (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#5a5a6e', gap: '14px', padding: '40px' }}>
                <span style={{ fontSize: '48px' }}>📝</span>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#8c8c9e' }}>No Notebook Open</div>
                <p style={{ fontSize: '12px', color: '#5a5a6e', maxWidth: '300px', textAlign: 'center', lineHeight: '1.5' }}>
                  Select an existing notebook from the sidebar or click the <b>+</b> button to create a new Markdown notebook.
                </p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
