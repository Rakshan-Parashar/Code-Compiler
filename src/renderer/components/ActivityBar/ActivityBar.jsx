import React from 'react'
import S from './ActivityBar.module.css'

const TOP = [
  { id:'explorer',    title:'Explorer (⌘⇧E)',   d:'M2 3h5l2 2h7v10H2V3z M2 7h14' },
  { id:'notebooks',   title:'Notebooks',         d:'M4 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm1 2v10m6-9H6m4 3H6m4 3H6' },
  { id:'search',      title:'Search',            circle:true },
  { id:'git',         title:'Source Control',    git:true },
  { id:'extensions',  title:'Extensions',        grid:true },
]
const BOT = [
  { id:'cloud',    title:'Cloud Sync',  cloud:true },
  { id:'account',  title:'Account',     person:true },
  { id:'settings', title:'Settings',    gear:true },
]

export default function ActivityBar({ active, onSelect }) {
  return (
    <aside className={S.bar}>
      <div className={S.group}>
        {TOP.map(a => <ABtn key={a.id} item={a} active={active === a.id} onSelect={onSelect} />)}
      </div>
      <div className={S.group}>
        {BOT.map(a => <ABtn key={a.id} item={a} active={active === a.id} onSelect={onSelect} />)}
      </div>
    </aside>
  )
}

function ABtn({ item, active, onSelect }) {
  return (
    <button className={`${S.btn} ${active ? S.act : ''}`} title={item.title} onClick={() => onSelect(item.id)}>
      {active && <span className={S.indicator} />}
      <Icon item={item} />
    </button>
  )
}

function Icon({ item }) {
  if (item.circle) return (
    <svg viewBox="0 0 16 16" fill="none" width="17"><circle cx="6.5" cy="6.5" r="4.2" stroke="currentColor" strokeWidth="1.3"/><path d="M10 10l4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
  )
  if (item.git) return (
    <svg viewBox="0 0 16 16" fill="none" width="17"><circle cx="4" cy="4" r="2" stroke="currentColor" strokeWidth="1.2"/><circle cx="4" cy="12" r="2" stroke="currentColor" strokeWidth="1.2"/><circle cx="12" cy="4" r="2" stroke="currentColor" strokeWidth="1.2"/><path d="M4 6v4M6 4h3.5c1.1 0 1.5.7 1.5 1.5v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
  )
  if (item.grid) return (
    <svg viewBox="0 0 16 16" fill="none" width="17"><rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.2"/><rect x="9"   y="1.5" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.2"/><rect x="1.5" y="9"   width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.2"/><rect x="9"   y="9"   width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.2"/></svg>
  )
  if (item.cloud) return (
    <svg viewBox="0 0 16 16" fill="none" width="17"><path d="M4.5 10.5a3 3 0 010-6 3 3 0 015.7-1.2A2.8 2.8 0 0112 9H4.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/><path d="M8 11v3.5M6 13l2-2 2 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
  )
  if (item.person) return (
    <svg viewBox="0 0 16 16" fill="none" width="17"><circle cx="8" cy="5.5" r="2.8" stroke="currentColor" strokeWidth="1.2"/><path d="M2 14c0-2.8 2.7-4.5 6-4.5s6 1.7 6 4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
  )
  if (item.gear) return (
    <svg viewBox="0 0 16 16" fill="none" width="17"><circle cx="8" cy="8" r="2.2" stroke="currentColor" strokeWidth="1.2"/><path d="M8 1.5v1.8M8 12.7v1.8M1.5 8h1.8M12.7 8h1.8M3.3 3.3l1.3 1.3M11.4 11.4l1.3 1.3M3.3 12.7l1.3-1.3M11.4 4.6l1.3-1.3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
  )
  return (
    <svg viewBox="0 0 16 16" fill="none" width="17"><path d={item.d} stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/></svg>
  )
}
