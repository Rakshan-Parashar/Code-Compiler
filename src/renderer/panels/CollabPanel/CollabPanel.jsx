import React, { useState, useEffect } from 'react'
import S from '../Panel.module.css'

export default function CollabPanel({ onClose, notify, collabState, onConnect, onDisconnect }) {
  const [roomIdInput, setRoomIdInput] = useState('')
  const [usernameInput, setUsernameInput] = useState('')

  useEffect(() => {
    // If not connected and we have a logged-in user, auto-populate username from local account storage
    if (!collabState.connected) {
      window.api?.loadAccount().then(a => {
        if (a && a.name) {
          setUsernameInput(a.name)
        } else {
          setUsernameInput('User_' + Math.floor(1000 + Math.random() * 9000))
        }
      })
    }
  }, [collabState.connected, collabState.username])

  const handleCreate = () => {
    if (!usernameInput.trim()) {
      notify?.('error', 'Please enter a username.')
      return
    }
    const newRoomId = 'room_' + Math.random().toString(36).substring(2, 8)
    onConnect(newRoomId, usernameInput.trim())
  }

  const handleJoin = () => {
    if (!usernameInput.trim()) {
      notify?.('error', 'Please enter a username.')
      return
    }
    if (!roomIdInput.trim()) {
      notify?.('error', 'Please enter a Room ID to join.')
      return
    }
    onConnect(roomIdInput.trim(), usernameInput.trim())
  }

  const handleCopy = () => {
    if (collabState.roomId) {
      window.api?.clipboardWrite(collabState.roomId)
      notify?.('success', 'Room ID copied to clipboard!')
    }
  }

  return (
    <div className={S.backdrop} onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className={S.panel} style={{ width: 440 }}>
        <div className={S.hdr}>
          <div className={S.hdrLeft}>
            <svg viewBox="0 0 16 16" width="15" fill="none">
              <path d="M4 14v-1a3 3 0 0 1 3-3h2a3 3 0 0 1 3 3v1M8 7a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            <span>Live Collaboration</span>
          </div>
          <button className={S.closeBtn} onClick={onClose}>×</button>
        </div>

        <div className={S.bodyPad}>
          {collabState.connected ? (
            /* Connected Mode */
            <div className={S.profile} style={{ flexDirection: 'column', alignItems: 'stretch' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
                <div className={S.avatar} style={{ background: '#10b981', marginRight: 15 }}>
                  {collabState.username?.charAt(0).toUpperCase() || '?'}
                </div>
                <div className={S.profileInfo}>
                  <div className={S.profileName}>{collabState.username}</div>
                  <div className={S.profileEmail} style={{ color: '#10b981' }}>● Connected to Session</div>
                </div>
              </div>

              <div className={S.field} style={{ marginBottom: 20 }}>
                <label className={S.label}>Room ID</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  <input readOnly value={collabState.roomId} style={{ flex: 1, background: '#17171c', border: '1px solid #333' }} />
                  <button className={S.saveBtn} style={{ width: 'auto', padding: '0 15px', background: '#7C3AED' }} onClick={handleCopy}>
                    Copy
                  </button>
                </div>
              </div>

              <div className={S.field} style={{ marginBottom: 25 }}>
                <label className={S.label}>Active Collaborators ({collabState.users.length})</label>
                <div style={{ 
                  maxHeight: 120, 
                  overflowY: 'auto', 
                  background: '#0d0d0f', 
                  borderRadius: 6, 
                  border: '1px solid #222',
                  padding: '8px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8
                }}>
                  {collabState.users.map((user, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                      <span style={{ 
                        width: 6, 
                        height: 6, 
                        borderRadius: '50%', 
                        background: user === collabState.username ? '#3b82f6' : '#10b981' 
                      }} />
                      <span>{user} {user === collabState.username ? '(You)' : ''}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button className={S.logoutBtn} style={{ background: '#ef4444' }} onClick={onDisconnect}>
                Disconnect Session
              </button>
            </div>
          ) : (
            /* Setup/Join Mode */
            <div>
              <div className={S.field} style={{ marginBottom: 15 }}>
                <label className={S.label}>Your Display Name</label>
                <input 
                  value={usernameInput} 
                  onChange={e => setUsernameInput(e.target.value)} 
                  placeholder="Enter username" 
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 15, marginTop: 10 }}>
                <div>
                  <button className={S.saveBtn} style={{ background: '#7C3AED' }} onClick={handleCreate}>
                    Create Collaborative Session
                  </button>
                  <p className={S.disclaimer} style={{ marginTop: 6, textAlign: 'center' }}>
                    Generate a new room and invite others to edit files together.
                  </p>
                </div>

                <div style={{ height: 1, background: '#222', margin: '5px 0' }} />

                <div className={S.field}>
                  <label className={S.label}>Join Existing Room</label>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <input 
                      value={roomIdInput} 
                      onChange={e => setRoomIdInput(e.target.value)} 
                      placeholder="Enter Room ID" 
                    />
                    <button className={S.saveBtn} style={{ width: 'auto', padding: '0 20px', background: '#3b82f6' }} onClick={handleJoin}>
                      Join
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
