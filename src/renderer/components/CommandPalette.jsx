import React, { useState, useEffect, useRef } from 'react'
import S from './CommandPalette.module.css'

const COMMANDS = [
  { id:'open',    label:'Open File',           hint:'⌘O',  icon:'📄', section:'File' },
  { id:'folder',  label:'Open Folder',         hint:'⌘⇧O', icon:'📂', section:'File' },
  { id:'save',    label:'Save File',           hint:'⌘S',  icon:'💾', section:'File' },
  { id:'new',     label:'New File',            hint:'⌘N',  icon:'✨', section:'File' },
  { id:'run',     label:'Run File',            hint:'F5',  icon:'▶',  section:'Run' },
  { id:'sidebar', label:'Toggle Sidebar',      hint:'⌘⇧E', icon:'⬚',  section:'View' },
  { id:'panel',   label:'Toggle Terminal Panel',hint:'⌘`', icon:'⬛', section:'View' },
  { id:'settings',label:'Open Settings',       hint:'',    icon:'⚙',  section:'Settings' },
  { id:'account', label:'Account & Profile',   hint:'',    icon:'👤', section:'Settings' },
  { id:'cloud',   label:'Cloud Snippets',      hint:'',    icon:'☁',  section:'Cloud' },
  { id:'notebooks', label:'Notebooks',           hint:'',    icon:'📓', section:'Cloud' },
]

export default function CommandPalette({ openFiles, onClose, onSelectFile, onOpen, onOpenFolder, onSave, onRun, onSettings, onAccount, onCloud, onToggleSidebar, onTogglePanel, onNewFile, onNotebooks }) {
  const [q, setQ] = useState('')
  const [sel, setSel] = useState(0)
  const inputRef = useRef()
  const listRef  = useRef()

  useEffect(() => { inputRef.current?.focus() }, [])

  const fileResults = q.length > 0
    ? openFiles.filter(f => f.name.toLowerCase().includes(q.toLowerCase())).map(f => ({ id: 'file_' + f.id, label: f.name, hint: f.path?.split(/[/\\]/).slice(-2).join('/') || '', icon: '📄', section: 'Open Files', file: f }))
    : openFiles.slice(0, 5).map(f => ({ id: 'file_' + f.id, label: f.name, hint: '', icon: '📄', section: 'Open Files', file: f }))

  const cmdResults = q
    ? COMMANDS.filter(c => c.label.toLowerCase().includes(q.toLowerCase()))
    : COMMANDS

  const all = [...fileResults, ...cmdResults]
  const clampedSel = Math.min(sel, all.length - 1)

  useEffect(() => { setSel(0) }, [q])

  useEffect(() => {
    const h = e => {
      if (e.key === 'ArrowDown')  { e.preventDefault(); setSel(s => Math.min(s + 1, all.length - 1)) }
      if (e.key === 'ArrowUp')    { e.preventDefault(); setSel(s => Math.max(s - 1, 0)) }
      if (e.key === 'Enter')      { e.preventDefault(); execute(all[clampedSel]) }
      if (e.key === 'Escape')     { onClose() }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [all, clampedSel, onClose])

  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${clampedSel}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [clampedSel])

  const execute = (item) => {
    if (!item) return
    if (item.file)          { onSelectFile(item.file); return }
    const map = { open:onOpen, folder:onOpenFolder, save:onSave, new:onNewFile, run:onRun, settings:onSettings, account:onAccount, cloud:onCloud, sidebar:onToggleSidebar, panel:onTogglePanel, notebooks:onNotebooks }
    map[item.id]?.()
    onClose()
  }

  // Group results
  const groups = {}
  all.forEach((item, i) => {
    if (!groups[item.section]) groups[item.section] = []
    groups[item.section].push({ ...item, _idx: i })
  })

  return (
    <div className={S.backdrop} onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className={S.palette}>
        <div className={S.inputRow}>
          <svg viewBox="0 0 16 16" width="14" fill="none" className={S.searchIcon}>
            <circle cx="6.5" cy="6.5" r="4.2" stroke="currentColor" strokeWidth="1.3"/>
            <path d="M10 10l4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
          <input
            ref={inputRef}
            className={S.input}
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search files, run commands…"
          />
          <kbd className={S.escKey}>Esc</kbd>
        </div>

        <div ref={listRef} className={S.list}>
          {all.length === 0 && <div className={S.noResult}>No results for "{q}"</div>}
          {Object.entries(groups).map(([section, items]) => (
            <div key={section}>
              <div className={S.groupLabel}>{section}</div>
              {items.map(item => (
                <button
                  key={item.id}
                  data-idx={item._idx}
                  className={`${S.item} ${item._idx === clampedSel ? S.itemSel : ''}`}
                  onClick={() => execute(item)}
                  onMouseEnter={() => setSel(item._idx)}
                >
                  <span className={S.icon}>{item.icon}</span>
                  <span className={S.label}>{item.label}</span>
                  {item.hint && <span className={S.hintKbd}>{item.hint}</span>}
                  {item._idx === clampedSel && <span className={S.enter}>↵</span>}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
