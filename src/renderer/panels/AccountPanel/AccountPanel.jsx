import React, { useState, useEffect } from 'react'
import S from '../Panel.module.css'
import { isFirebaseEnabled, fbLogin, fbSignup, fbLogout, fbListSnippets, fbLoginWithGoogle, fbDeleteAccount } from '../../utils/firebase.js'

export default function AccountPanel({ onClose, notify, onOpenCloud }) {
  const [account, setAccount] = useState(null)
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [tab, setTab] = useState('login')
  const [loading, setLoading] = useState(false)
  const [snippetsCount, setSnippetsCount] = useState(0)
  const [filesSavedCount, setFilesSavedCount] = useState(0)

  const fetchStats = (email) => {
    if (isFirebaseEnabled && email) {
      fbListSnippets(email).then(list => {
        if (Array.isArray(list)) setSnippetsCount(list.length)
      }).catch(() => { })
    } else {
      window.api?.cloudList().then(list => {
        if (Array.isArray(list)) setSnippetsCount(list.length)
      })
    }
    window.api?.loadRecent().then(recent => {
      if (Array.isArray(recent)) setFilesSavedCount(recent.length)
    })
  }

  useEffect(() => {
    window.api?.loadAccount().then(a => {
      if (a) {
        setAccount(a)
        fetchStats(a.email)
      }
    })
  }, [])

  const loginWithGoogle = async () => {
    setLoading(true)
    try {
      const accountData = await fbLoginWithGoogle()
      await window.api?.saveAccount(accountData)
      setAccount(accountData)
      notify?.('success', `Welcome, ${accountData.name}!`)
      fetchStats(accountData.email)
    } catch (e) {
      notify?.('error', e.message || 'Google authentication failed')
    } finally {
      setLoading(false)
    }
  }

  const deleteAccount = async () => {
    const confirmed = window.confirm("Are you absolutely sure you want to delete your account? This action CANNOT be undone and all your snippets will be permanently lost.")
    if (!confirmed) return

    const promptVal = window.prompt("To confirm deletion, please type 'DELETE':")
    if (promptVal !== 'DELETE') {
      notify?.('info', 'Account deletion cancelled')
      return
    }

    setLoading(true)
    try {
      if (isFirebaseEnabled) {
        await fbDeleteAccount()
      }
      const res = await window.api?.deleteAccount()
      if (!isFirebaseEnabled && (!res || !res.ok)) {
        throw new Error(res?.error || "Failed to delete account from local database.")
      }

      setAccount(null)
      setForm({ name: '', email: '', password: '' })
      setSnippetsCount(0)
      setFilesSavedCount(0)
      notify?.('success', 'Your account and snippets have been permanently deleted.')
    } catch (e) {
      notify?.('error', e.message || 'Failed to delete account')
    } finally {
      setLoading(false)
    }
  }

  const login = async () => {
    if (!form.email || !form.password) { notify?.('error', 'Email and password required'); return }
    setLoading(true)
    try {
      let accountData
      if (isFirebaseEnabled) {
        if (tab === 'login') {
          accountData = await fbLogin(form.email, form.password)
        } else {
          if (!form.name.trim()) { notify?.('error', 'Name is required for Sign Up'); setLoading(false); return }
          accountData = await fbSignup(form.name.trim(), form.email, form.password)
        }
        await window.api?.saveAccount(accountData)
      } else {
        let res
        if (tab === 'login') {
          res = await window.api?.accountLogin(form.email, form.password)
        } else {
          if (!form.name.trim()) { notify?.('error', 'Name is required for Sign Up'); setLoading(false); return }
          res = await window.api?.accountSignup(form.name.trim(), form.email, form.password)
        }
        if (res && res.ok) {
          accountData = res.account
        } else {
          notify?.('error', res?.error || 'Authentication failed')
          setLoading(false)
          return
        }
      }

      setAccount(accountData)
      notify?.('success', tab === 'login' ? `Welcome back, ${accountData.name}!` : 'Account created successfully!')
      fetchStats(accountData.email)
    } catch (e) {
      notify?.('error', e.message)
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    if (isFirebaseEnabled) {
      try { await fbLogout() } catch { }
    }
    await window.api?.logout()
    setAccount(null); setForm({ name: '', email: '', password: '' })
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
            <svg viewBox="0 0 16 16" width="15" fill="none"><circle cx="8" cy="5.5" r="3" stroke="currentColor" strokeWidth="1.2" /><path d="M2 14c0-3 2.7-5 6-5s6 2 6 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
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
                {['login', 'signup'].map(t => (
                  <button key={t} className={`${S.authTab} ${tab === t ? S.authTabAct : ''}`} onClick={() => setTab(t)}>
                    {t === 'login' ? 'Sign In' : 'Sign Up'}
                  </button>
                ))}
              </div>

              {tab === 'signup' && (
                <div className={S.field}>
                  <label className={S.label}>Name *</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Your name" />
                </div>
              )}
              <div className={S.field}>
                <label className={S.label}>Email *</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="you@example.com" />
              </div>
              <div className={S.field}>
                <label className={S.label}>Password *</label>
                <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="••••••••" onKeyDown={e => e.key === 'Enter' && login()} />
              </div>
            </div>
          )}

          {account ? (
            <div className={S.accountActions}>
              <div className={S.statsRow}>
                <StatBox label="Snippets" value={snippetsCount} icon="☁" />
                <StatBox label="Files Saved" value={filesSavedCount} icon="💾" />
                <StatBox label="Member Since" value={new Date(account.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} icon="📅" />
              </div>
              <button className={S.cloudBtn} onClick={onOpenCloud}>
                ☁ Open Cloud Snippets
              </button>
              <button className={S.logoutBtn} onClick={logout}>Sign Out</button>
              <button className={S.deleteAccBtn} onClick={deleteAccount} disabled={loading}>
                Delete Account
              </button>
            </div>
          ) : (
            <>
              <button className={`${S.saveBtn} ${loading ? S.loading : ''}`} onClick={login} disabled={loading}>
                {loading ? 'Signing in…' : tab === 'login' ? 'Sign In' : 'Create Account'}
              </button>

              {isFirebaseEnabled && (
                <button className={S.googleBtn} onClick={loginWithGoogle} disabled={loading}>
                  <svg width="16" height="16" viewBox="0 0 48 48" style={{ marginRight: '4px' }}>
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                    <path fill="#4285F4" d="M46.5 24c0-1.61-.15-3.16-.42-4.69H24v8.87h12.66c-.55 2.87-2.17 5.3-4.61 6.93l7.18 5.56C43.34 36.5 46.5 30.82 46.5 24z" />
                    <path fill="#FBBC05" d="M10.54 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.98-6.19z" />
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.18-5.56c-2.03 1.36-4.64 2.18-8.71 2.18-6.26 0-11.57-4.22-13.46-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                  </svg>
                  <span>Sign In with Google</span>
                </button>
              )}
            </>
          )}

          {!account && (
            <p className={S.disclaimer}>
              Accounts and snippets are securely synchronized with {isFirebaseEnabled ? 'Google Firebase cloud' : 'the local SQLite'} database.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function EditableName({ name, onSave }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(name)
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
