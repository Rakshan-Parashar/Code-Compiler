import React, { useState, useEffect } from 'react'
import S from './Panel.module.css'

export default function AccountPanel({ onClose, notify, onOpenCloud }) {
  const [account, setAccount] = useState(null)
  const [form, setForm]       = useState({ name:'', email:'', password:'' })
  const [tab, setTab]         = useState('login')
  const [loading, setLoading] = useState(false)

  useEffect(() => { window.api?.loadAccount().then(a => { if (a) setAccount(a) }) }, [])

  const login = async () => {
    if (!form.email || !form.password) { notify?.('error', 'Email and password required'); return }
    setLoading(true)
    await new Promise(r => setTimeout(r, 800)) // simulate network
    const a = { name: form.name || form.email.split('@')[0], email: form.email, avatar: null, createdAt: Date.now(), plan: 'free' }
    await window.api?.saveAccount(a)
    setAccount(a); setLoading(false)
    notify?.('success', `Welcome, ${a.name}!`)
  }

  const logout = async () => {
    await window.api?.logout()
    setAccount(null); setForm({ name:'', email:'', password:'' })
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
                <StatBox label="Snippets" value="—" icon="☁" />
                <StatBox label="Files Saved" value="—" icon="💾" />
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
              Account data is stored locally on your device. Cloud sync coming soon.
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
