import React, { useState, useEffect } from 'react'
import S from '../Panel.module.css'

export default function AccountPanel({ onClose, notify, onOpenCloud }) {
  const [account, setAccount] = useState(null)
  const [form, setForm]       = useState({ name:'', email:'', password:'' })
  const [tab, setTab]         = useState('login')
  const [loading, setLoading] = useState(false)
  const [snippetsCount, setSnippetsCount] = useState(0)
  const [filesSavedCount, setFilesSavedCount] = useState(0)

  const fetchStats = () => {
    window.api?.cloudList().then(list => {
      if (Array.isArray(list)) setSnippetsCount(list.length)
    })
    window.api?.loadRecent().then(recent => {
      if (Array.isArray(recent)) setFilesSavedCount(recent.length)
    })
  }

  useEffect(() => {
    window.api?.loadAccount().then(a => {
      if (a) {
        setAccount(a)
        fetchStats()
      }
    })
  }, [])

  const login = async () => {
    if (!form.email || !form.password) { notify?.('error', 'Email and password required'); return }
    setLoading(true)
    try {
      let res
      if (tab === 'login') {
        res = await window.api?.accountLogin(form.email, form.password)
      } else {
        if (!form.name.trim()) { notify?.('error', 'Name is required for Sign Up'); setLoading(false); return }
        res = await window.api?.accountSignup(form.name.trim(), form.email, form.password)
      }
      if (res && res.ok) {
        setAccount(res.account)
        notify?.('success', tab === 'login' ? `Welcome back, ${res.account.name}!` : 'Account created successfully!')
        // Fetch stats after login/signup
        window.api?.cloudList().then(list => {
          if (Array.isArray(list)) setSnippetsCount(list.length)
        })
        window.api?.loadRecent().then(recent => {
          if (Array.isArray(recent)) setFilesSavedCount(recent.length)
        })
      } else {
        notify?.('error', res?.error || 'Authentication failed')
      }
    } catch (e) {
      notify?.('error', e.message)
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    await window.api?.logout()
    setAccount(null); setForm({ name:'', email:'', password:'' })
    setSnippetsCount(0)
    setFilesSavedCount(0)
    notify?.('info', 'Signed out')
  }

  const updateName = async (name) => {
    const updated = { ...account, name }
    await window.api?.saveAccount(updated)
    setAccount(updated)
    notify?.('success', 'Profile updated')
  }

  return (
    <div className={S.backdrop} onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className={S.panel} style={{ width: 440 }}>
        <div className={S.hdr}>
          <div className={S.hdrLeft}>
            <svg viewBox="0 0 16 16" width="15" fill="none"><circle cx="8" cy="5.5" r="3" stroke="currentColor" strokeWidth="1.2"/><path d="M2 14c0-3 2.7-5 6-5s6 2 6 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
            <span>Account</span>
          </div>
          <button className={S.closeBtn} onClick={onClose}>×</button>
        </div>

        <div className={S.bodyPad}>
          {account ? (
            /* Logged in */
            <div className={S.profile}>
              <div className={S.avatar}>
                {account.name?.charAt(0).toUpperCase() || '?'}
              </div>
              <div className={S.profileInfo}>
                <EditableName name={account.name} onSave={updateName} />
                <div className={S.profileEmail}>{account.email}</div>
                <div className={S.planBadge}>{account.plan === 'pro' ? '⭐ Pro' : '🆓 Free'}</div>
              </div>
            </div>
          ) : (
            /* Auth form */
            <div>
              <div className={S.authTabs}>
                {['login','signup'].map(t => (
                  <button key={t} className={`${S.authTab} ${tab === t ? S.authTabAct : ''}`} onClick={() => setTab(t)}>
                    {t === 'login' ? 'Sign In' : 'Sign Up'}
                  </button>
                ))}
              </div>

              {tab === 'signup' && (
                <div className={S.field}>
                  <label className={S.label}>Name</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Your name" />
                </div>
              )}
              <div className={S.field}>
                <label className={S.label}>Email</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="you@example.com" />
              </div>
              <div className={S.field}>
                <label className={S.label}>Password</label>
                <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="••••••••" onKeyDown={e => e.key === 'Enter' && login()} />
              </div>
            </div>
          )}

          {account ? (
            <div className={S.accountActions}>
              <div className={S.statsRow}>
                <StatBox label="Snippets" value={snippetsCount} icon="☁" />
                <StatBox label="Files Saved" value={filesSavedCount} icon="💾" />
                <StatBox label="Member Since" value={new Date(account.createdAt).toLocaleDateString('en-US',{month:'short',year:'numeric'})} icon="📅" />
              </div>
              <button className={S.cloudBtn} onClick={() => { onOpenCloud(); onClose() }}>
                ☁ Open Cloud Snippets
              </button>
              <button className={S.logoutBtn} onClick={logout}>Sign Out</button>
            </div>
          ) : (
            <button className={`${S.saveBtn} ${loading ? S.loading : ''}`} onClick={login} disabled={loading}>
              {loading ? 'Signing in…' : tab === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          )}

          {!account && (
            <p className={S.disclaimer}>
              Accounts and snippets are securely synchronized with the MongoDB cloud database.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function EditableName({ name, onSave }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal]         = useState(name)
  const commit = () => { onSave(val); setEditing(false) }
  return editing
    ? <input className={S.nameInput} value={val} onChange={e => setVal(e.target.value)} onBlur={commit} onKeyDown={e => e.key === 'Enter' && commit()} autoFocus />
    : <div className={S.profileName} onClick={() => setEditing(true)} title="Click to edit">{name}</div>
}

function StatBox({ label, value, icon }) {
  return (
    <div className={S.statBox}>
      <span className={S.statIcon}>{icon}</span>
      <span className={S.statVal}>{value}</span>
      <span className={S.statLabel}>{label}</span>
    </div>
  )
}
