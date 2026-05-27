import React from 'react'
import S from './Notifications.module.css'

const ICONS = { success:'✓', error:'✕', info:'ℹ', warning:'⚠' }
const COLORS = { success:'var(--green)', error:'var(--red)', info:'var(--blue)', warning:'var(--yellow)' }

export default function Notifications({ items, onDismiss }) {
  if (!items.length) return null
  return (
    <div className={S.stack}>
      {items.map(n => (
        <div key={n.id} className={S.toast}>
          <span className={S.icon} style={{ color: COLORS[n.type] || COLORS.info }}>
            {ICONS[n.type] || ICONS.info}
          </span>
          <span className={S.msg}>{n.message}</span>
          <button className={S.close} onClick={() => onDismiss(n.id)}>×</button>
        </div>
      ))}
    </div>
  )
}
