import React, { useState, useEffect, useRef } from 'react'

const COMMANDS = [
  { id:'open',      label:'Open File',             hint:'Ctrl+O',       section:'File' },
  { id:'folder',    label:'Open Folder',           hint:'Ctrl+Shift+O', section:'File' },
  { id:'save',      label:'Save File',             hint:'Ctrl+S',       section:'File' },
  { id:'new',       label:'New File',              hint:'Ctrl+N',       section:'File' },
  { id:'run',       label:'Run File',              hint:'F5',           section:'Run' },
  { id:'sidebar',   label:'Toggle Sidebar',        hint:'Ctrl+Shift+E', section:'View' },
  { id:'panel',     label:'Toggle Terminal Panel', hint:'Ctrl+`',       section:'View' },
  { id:'settings',  label:'Open Settings',         hint:'Ctrl+,',       section:'Settings' },
  { id:'account',   label:'Account & Profile',     hint:'',             section:'Settings' },
  { id:'cloud',     label:'Cloud Snippets',        hint:'',             section:'Cloud' },
  { id:'notebooks', label:'Notebooks',             hint:'Ctrl+Shift+M', section:'Cloud' },
]

const COMMAND_ICONS = {
  open: (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  ),
  folder: (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  ),
  save: (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  ),
  new: (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="12" y1="18" x2="12" y2="12" />
      <line x1="9" y1="15" x2="15" y2="15" />
    </svg>
  ),
  run: (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="5 3 19 12 5 21 5 3" fill="currentColor" />
    </svg>
  ),
  sidebar: (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="9" y1="3" x2="9" y2="21" />
    </svg>
  ),
  panel: (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="3" y1="15" x2="21" y2="15" />
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  account: (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  cloud: (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
    </svg>
  ),
  notebooks: (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  ),
  file_default: (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  )
};

function getIcon(id) {
  if (id.startsWith('file_')) return COMMAND_ICONS.file_default;
  return COMMAND_ICONS[id] || COMMAND_ICONS.file_default;
}

export default function CommandPalette({ openFiles, onClose, onSelectFile, onOpen, onOpenFolder, onSave, onRun, onSettings, onAccount, onCloud, onToggleSidebar, onTogglePanel, onNewFile, onNotebooks }) {
  const [q, setQ] = useState('')
  const [sel, setSel] = useState(0)
  const inputRef = useRef()
  const listRef  = useRef()

  useEffect(() => { inputRef.current?.focus() }, [])

  const fileResults = q.length > 0
    ? openFiles.filter(f => f.name.toLowerCase().includes(q.toLowerCase())).map(f => ({ id: 'file_' + f.id, label: f.name, hint: f.path?.split(/[/\\]/).slice(-2).join('/') || '', section: 'Open Files', file: f }))
    : openFiles.slice(0, 5).map(f => ({ id: 'file_' + f.id, label: f.name, hint: '', section: 'Open Files', file: f }))

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
    <div 
      className="fixed inset-0 bg-[#040406]/75 backdrop-blur-md z-[2000] flex items-start justify-center pt-24 animate-cp-fade-in"
      onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-[560px] bg-bg2/95 border border-white/[0.06] rounded-2xl overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-3xl animate-cp-slide-down">
        
        {/* Search Row */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.05] group/row">
          <svg viewBox="0 0 16 16" width="14" fill="none" className="text-t3 group-focus-within/row:text-accent transition-all duration-200">
            <circle cx="6.5" cy="6.5" r="4.2" stroke="currentColor" strokeWidth="1.4"/>
            <path d="M10 10l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <input
            ref={inputRef}
            className="flex-1 bg-transparent border-none text-[13.5px] text-t1 placeholder-t3 outline-none focus:outline-none focus:ring-0"
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search files, run commands…"
          />
          <kbd className="bg-white/[0.02] border border-white/[0.08] rounded-md px-1.5 py-0.5 text-[9.5px] font-mono text-t3 select-none shadow-sm">Esc</kbd>
        </div>

        {/* Results List */}
        <div ref={listRef} className="max-h-[380px] overflow-y-auto p-2 space-y-1">
          {all.length === 0 && <div className="p-6 text-center text-t3 text-xs">No results for "{q}"</div>}
          {Object.entries(groups).map(([section, items]) => (
            <div key={section} className="space-y-0.5">
              <div className="px-3 pt-3 pb-1.5 text-[9.5px] font-bold uppercase tracking-wider text-accent/70 select-none">{section}</div>
              {items.map(item => {
                const isSelected = item._idx === clampedSel;
                return (
                  <button
                    key={item.id}
                    data-idx={item._idx}
                    onClick={() => execute(item)}
                    onMouseEnter={() => setSel(item._idx)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs transition-all duration-100 border border-transparent cursor-pointer ${
                      isSelected 
                        ? 'bg-accent/10 border-accent/20 text-white shadow-[0_2px_12px_-4px_rgba(0,229,255,0.15)]' 
                        : 'bg-transparent text-t2 hover:bg-white/[0.02] hover:text-t1'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`p-1.5 rounded-md flex items-center justify-center transition-all ${
                        isSelected 
                          ? 'bg-accent/15 text-accent' 
                          : 'bg-white/[0.03] text-t3'
                      }`}>
                        {getIcon(item.id)}
                      </div>
                      <span className="font-semibold tracking-wide truncate">{item.label}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {item.hint && <Keycap hint={item.hint} isSelected={isSelected} />}
                      {isSelected && <span className="text-[11px] text-accent font-semibold ml-1">↵</span>}
                    </div>
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Keycap({ hint, isSelected }) {
  if (!hint) return null;
  const isMac = typeof navigator !== 'undefined' && navigator.userAgent.includes('Mac');
  let keys = hint.includes('+') ? hint.split('+') : [hint];

  return (
    <div className="flex gap-1 items-center select-none">
      {keys.map((k, idx) => {
        let displayKey = k;
        if (isMac) {
          if (k === 'Ctrl') displayKey = '⌘';
          else if (k === 'Shift') displayKey = '⇧';
        } else {
          if (k === '⌘') displayKey = 'Ctrl';
          else if (k === '⇧') displayKey = 'Shift';
        }
        return (
          <kbd 
            key={idx} 
            className={`font-mono text-[9px] px-1.5 py-0.5 rounded shadow-[0_1px_1px_rgba(0,0,0,0.4)] border transition-all duration-100 ${
              isSelected 
                ? 'bg-accent/20 border-accent/30 text-accent font-semibold' 
                : 'bg-white/[0.04] border-white/[0.08] text-t3'
            }`}
          >
            {displayKey}
          </kbd>
        );
      })}
    </div>
  );
}
