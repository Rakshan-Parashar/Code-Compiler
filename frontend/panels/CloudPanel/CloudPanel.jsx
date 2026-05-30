import React, { useState, useEffect } from 'react'
import S from '../Panel.module.css'
import { isFirebaseEnabled, fbListSnippets, fbSaveSnippet, fbDeleteSnippet } from '../../utils/firebase.js'

const LANG_LABELS = { javascript:'JS', typescript:'TS', python:'PY', html:'HTML', css:'CSS', json:'JSON', bash:'SH', default:'TXT' }

export default function CloudPanel({ activeFile, onClose, notify, onOpenFile }) {
  const [snippets, setSnippets] = useState([])
  const [selected, setSelected] = useState(null)
  const [editing, setEditing]   = useState(false)
  const [form, setForm]         = useState({ name:'', description:'', language:'javascript', code:'' })
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [account, setAccount]   = useState(null)

  useEffect(() => {
    const initCloud = async () => {
      setLoading(true)
      let acc = null
      if (window.api) {
        acc = await window.api.loadAccount()
        setAccount(acc)
      }
      
      if (isFirebaseEnabled) {
        if (acc?.email) {
          try {
            const list = await fbListSnippets(acc.email)
            setSnippets(list || [])
          } catch (e) {
            console.error(e)
            notify?.('error', e.message || 'Failed to fetch cloud snippets')
          }
        } else {
          setSnippets([])
        }
        setLoading(false)
      } else {
        window.api?.cloudList().then(list => {
          setSnippets(list || [])
          setLoading(false)
        })
      }
    }
    initCloud()
  }, [])

  const save = async () => {
    if (!form.name.trim()) { notify?.('error', 'Snippet name required'); return }
    
    if (isFirebaseEnabled) {
      if (!account?.email) { notify?.('error', 'You must be signed in to save snippets'); return }
      setLoading(true)
      try {
        const snippetData = editing ? { ...editing, ...form } : form
        const saved = await fbSaveSnippet(snippetData, account.email)
        setSnippets(prev => {
          const idx = prev.findIndex(x => x.id === saved.id)
          const next = [...prev]
          if (idx >= 0) next[idx] = saved
          else next.unshift(saved)
          return next
        })
        notify?.('success', editing ? 'Snippet updated' : 'Snippet saved to cloud ☁')
        setEditing(false); setForm({ name:'', description:'', language:'javascript', code:'' })
      } catch (e) {
        notify?.('error', e.message || 'Failed to save to Firebase')
      } finally {
        setLoading(false)
      }
    } else {
      const res = await window.api?.cloudSave(editing ? { ...editing, ...form } : form)
      if (res?.ok) {
        setSnippets(res.list)
        notify?.('success', editing ? 'Snippet updated' : 'Snippet saved to cloud ☁')
        setEditing(false); setForm({ name:'', description:'', language:'javascript', code:'' })
      }
    }
  }

  const del = async (id) => {
    if (!window.confirm('Delete this snippet?')) return
    
    if (isFirebaseEnabled) {
      if (!account?.email) { notify?.('error', 'You must be signed in to delete snippets'); return }
      setLoading(true)
      try {
        await fbDeleteSnippet(id)
        setSnippets(prev => prev.filter(s => s.id !== id))
        if (selected?.id === id) setSelected(null)
        notify?.('info', 'Snippet deleted')
      } catch (e) {
        notify?.('error', e.message || 'Failed to delete from Firebase')
      } finally {
        setLoading(false)
      }
    } else {
      const res = await window.api?.cloudDelete(id)
      if (res?.ok) { 
        setSnippets(res.list)
        if (selected?.id === id) setSelected(null)
        notify?.('info', 'Snippet deleted') 
      }
    }
  }

  const startEdit = (snip) => {
    setEditing(snip); setForm({ name: snip.name, description: snip.description || '', language: snip.language || 'javascript', code: snip.code || '' })
  }

  const saveCurrentFile = async () => {
    if (!activeFile) { notify?.('error', 'No file open'); return }
    const f = { name: activeFile.name, description: `Saved from ${activeFile.name}`, language: activeFile.ext === 'py' ? 'python' : activeFile.ext === 'ts' ? 'typescript' : 'javascript', code: activeFile.content }
    
    if (isFirebaseEnabled) {
      if (!account?.email) { notify?.('error', 'You must be signed in to save snippets'); return }
      setLoading(true)
      try {
        const saved = await fbSaveSnippet(f, account.email)
        setSnippets(prev => {
          const idx = prev.findIndex(x => x.id === saved.id)
          const next = [...prev]
          if (idx >= 0) next[idx] = saved
          else next.unshift(saved)
          return next
        })
        notify?.('success', `${activeFile.name} saved to cloud ☁`)
      } catch (e) {
        notify?.('error', e.message || 'Failed to save snippet to Firebase')
      } finally {
        setLoading(false)
      }
    } else {
      const res = await window.api?.cloudSave(f)
      if (res?.ok) { setSnippets(res.list); notify?.('success', `${activeFile.name} saved to cloud ☁`) }
    }
  }

  const filtered = snippets.filter(s =>
    !search || s.name.toLowerCase().includes(search.toLowerCase()) || (s.description || '').toLowerCase().includes(search.toLowerCase())
  )

  if (editing !== false) {
    return (
      <div className={S.backdrop} onMouseDown={e => e.target === e.currentTarget && onClose()}>
        <div className={S.panel} style={{ width: 560 }}>
          <div className={S.hdr}>
            <div className={S.hdrLeft}>
              <span>☁</span>
              <span>{editing ? 'Edit Snippet' : 'New Snippet'}</span>
            </div>
            <button className={S.closeBtn} onClick={() => setEditing(false)}>×</button>
          </div>
          <div className={S.bodyPad}>
            <div className={S.field}>
              <label className={S.label}>Name *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="My snippet name" />
            </div>
            <div className={S.field}>
              <label className={S.label}>Description</label>
              <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional description" />
            </div>
            <div className={S.field}>
              <label className={S.label}>Language</label>
              <select value={form.language} onChange={e => setForm(f => ({ ...f, language: e.target.value }))} className={S.select}>
                {['javascript','typescript','python','html','css','json','bash','plaintext'].map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
            <div className={S.field}>
              <label className={S.label}>Code *</label>
              <textarea value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} rows={10} className={S.codeArea} placeholder="Paste your code here…" />
            </div>
          </div>
          <div className={S.footer}>
            <button className={S.resetBtn} onClick={() => setEditing(false)}>Cancel</button>
            <button className={S.saveBtn} onClick={save}>
              {editing ? 'Update Snippet' : 'Save to Cloud'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (selected) {
    return (
      <div className={S.backdrop} onMouseDown={e => e.target === e.currentTarget && onClose()}>
        <div className={S.panel} style={{ width: 600 }}>
          <div className={S.hdr}>
            <div className={S.hdrLeft}>
              <span>☁</span>
              <span className={S.truncate}>{selected.name}</span>
              <span className={S.langTag}>{LANG_LABELS[selected.language] || 'TXT'}</span>
            </div>
            <button className={S.closeBtn} onClick={() => setSelected(null)}>←</button>
          </div>
          <div className={S.bodyPad}>
            {selected.description && <p className={S.snipDesc}>{selected.description}</p>}
            <div className={S.snipMeta}>
              Saved {new Date(selected.createdAt).toLocaleString()}
              {selected.updatedAt !== selected.createdAt && ` · Updated ${new Date(selected.updatedAt).toLocaleString()}`}
            </div>
            <pre className={S.codeBlock}>{selected.code}</pre>
          </div>
          <div className={S.footer}>
            <button className={S.resetBtn} onClick={() => del(selected.id)}>Delete</button>
            <div style={{ display:'flex', gap:8 }}>
              <button className={S.resetBtn} onClick={() => startEdit(selected)}>Edit</button>
              <button className={S.saveBtn} onClick={() => { 
                const ext = selected.language === 'python' ? 'py' : selected.language === 'typescript' ? 'ts' : selected.language === 'javascript' ? 'js' : selected.language === 'html' ? 'html' : selected.language === 'css' ? 'css' : selected.language === 'json' ? 'json' : selected.language === 'bash' ? 'sh' : 'txt';
                onOpenFile?.({
                  name: selected.name.includes('.') ? selected.name : `${selected.name}.${ext}`,
                  content: selected.code,
                  ext
                });
                onClose();
              }}>
                Open in Editor
              </button>
              <button className={S.resetBtn} onClick={() => { navigator.clipboard?.writeText(selected.code); notify?.('success','Copied to clipboard') }}>
                Copy
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={S.backdrop} onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className={S.panel} style={{ width: 540 }}>
        <div className={S.hdr}>
          <div className={S.hdrLeft}>
            <svg viewBox="0 0 16 16" fill="none" width="15"><path d="M3 9a4 4 0 010-8 4 4 0 017.5-1.5A3.5 3.5 0 0112.5 7H3z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/><path d="M7 11v3.5M5 13l2-2 2 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span>Cloud Snippets</span>
            {(!isFirebaseEnabled || account) && <span className={S.badge}>{snippets.length}</span>}
          </div>
          <button className={S.closeBtn} onClick={onClose}>×</button>
        </div>

        <div className={S.bodyPad}>
          {isFirebaseEnabled && !account && !loading ? (
            <div className={S.cloudEmpty}>
              <span style={{ fontSize:48 }}>☁</span>
              <p>Sign In Required</p>
              <span>Please sign in or create an account via the Account panel to synchronize your snippets with Google Firebase cloud.</span>
            </div>
          ) : (
            <>
              <div className={S.cloudTop}>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search snippets…" className={S.searchInput} />
                <div style={{ display:'flex', gap:6 }}>
                  {activeFile && (
                    <button className={S.saveCurrentBtn} onClick={saveCurrentFile} title={`Save ${activeFile.name} to cloud`}>
                      ☁ Save Current File
                    </button>
                  )}
                  <button className={S.newSnipBtn} onClick={() => setEditing({})}>+ New Snippet</button>
                </div>
              </div>

              {loading && <div className={S.cloudLoading}>Loading snippets…</div>}

              {!loading && !filtered.length && (
                <div className={S.cloudEmpty}>
                  <span style={{ fontSize:36 }}>☁</span>
                  <p>{search ? 'No snippets match your search' : 'No cloud snippets yet'}</p>
                  <span>{search ? '' : 'Save code snippets to access them anywhere'}</span>
                  {!search && <button className={S.newSnipBtn} onClick={() => setEditing({})}>+ Add First Snippet</button>}
                </div>
              )}

              <div className={S.snipList}>
                {filtered.map(snip => (
                  <div key={snip.id} className={S.snipCard} onClick={() => setSelected(snip)}>
                    <div className={S.snipTop}>
                      <span className={S.snipName}>{snip.name}</span>
                      <span className={S.langTag}>{LANG_LABELS[snip.language] || 'TXT'}</span>
                    </div>
                    {snip.description && <div className={S.snipDesc}>{snip.description}</div>}
                    <pre className={S.snipPreview}>{(snip.code || '').split('\n').slice(0,3).join('\n')}</pre>
                    <div className={S.snipFooter}>
                      <span>{new Date(snip.updatedAt).toLocaleDateString()}</span>
                      <div className={S.snipActions}>
                        <button className={S.snipBtn} onClick={e => { e.stopPropagation(); navigator.clipboard?.writeText(snip.code); notify?.('success','Copied') }}>Copy</button>
                        <button className={S.snipBtn} onClick={e => { e.stopPropagation(); startEdit(snip) }}>Edit</button>
                        <button className={`${S.snipBtn} ${S.snipDel}`} onClick={e => { e.stopPropagation(); del(snip.id) }}>Delete</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
