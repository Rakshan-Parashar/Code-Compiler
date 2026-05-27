import React, { useState, useRef, useEffect } from 'react'
import S from './Sidebar.module.css'

/* ── colour / icon maps ── */
const FC = { js:'#f7df1e',jsx:'#61dafb',ts:'#3178c6',tsx:'#61dafb',py:'#3776ab',html:'#e34f26',css:'#1572b6',json:'#cbcb41',md:'#519aba',sh:'#89e051',rs:'#dea584',go:'#79d4fd',java:'#f89820',rb:'#cc342d',vue:'#41b883',svelte:'#ff3e00',yaml:'#cc3514',yml:'#cc3514',sql:'#e38d00',default:'#6b7280' }
const FL = { js:'JS',jsx:'⚛',ts:'TS',tsx:'⚛',py:'PY',html:'HT',css:'CS',json:'{}',md:'MD',sh:'SH',rs:'RS',go:'GO',java:'JV',rb:'RB',vue:'VU',svelte:'SV',default:'··' }

function FIcon({ ext }) {
  const c = FC[ext] || FC.default
  const l = FL[ext] || FL.default
  return <span className={S.ficon} style={{ color: c, borderColor: `${c}38` }}>{l}</span>
}

/* ── root ── */
export default function Sidebar({ activity, folderTree, folderName, rootFolderPath, openFiles, activeFile, onOpenFile, onOpenFileDiff, onOpenFolder, onNewFile, onNewFolder, onDeleteItem, onRenameItem, onRefresh, notify, git }) {
  return (
    <aside className={S.sidebar}>
      {activity === 'explorer'   && <Explorer {...{ folderTree, folderName, rootFolderPath, openFiles, activeFile, onOpenFile, onOpenFolder, onNewFile, onNewFolder, onDeleteItem, onRenameItem, onRefresh }} />}
      {activity === 'search'     && <SearchPane openFiles={openFiles} onOpenFile={onOpenFile} />}
      {activity === 'git'        && <GitPane git={git} onOpenFileDiff={onOpenFileDiff} rootFolderPath={rootFolderPath} />}
      {activity === 'extensions' && <ExtPane notify={notify} />}
    </aside>
  )
}

/* ── Explorer ── */
function Explorer({ folderTree, folderName, rootFolderPath, openFiles, activeFile, onOpenFile, onOpenFolder, onNewFile, onNewFolder, onDeleteItem, onRenameItem, onRefresh }) {
  const [exp, setExp] = useState({})
  const toggle = p => setExp(e => ({ ...e, [p]: !e[p] }))

  return (
    <div className={S.pane}>
      <div className={S.hdr}>
        <span className={S.hdrTitle}>EXPLORER</span>
        <div className={S.hdrBtns}>
          <Btn tip="New File"    onClick={() => onNewFile(rootFolderPath)}><NewFileIcon /></Btn>
          <Btn tip="New Folder"  onClick={() => onNewFolder(rootFolderPath)}><NewFolderIcon /></Btn>
          <Btn tip="Refresh"     onClick={onRefresh}><RefreshIcon /></Btn>
          <Btn tip="Open Folder" onClick={onOpenFolder}><FolderIcon /></Btn>
        </div>
      </div>

      <div className={S.tree}>
        {!folderTree?.length ? (
          <div className={S.empty}>
            <FolderBigIcon />
            <p>No folder open</p>
            <button className={S.openBtn} onClick={onOpenFolder}>Open Folder</button>
          </div>
        ) : (
          <>
            <div className={S.root}><FolderIcon /><span>{folderName}</span></div>
            {folderTree.map(item => (
              <TreeNode key={item.path} item={item} depth={0} exp={exp} toggle={toggle}
                activeFile={activeFile} onOpenFile={onOpenFile}
                onNewFile={onNewFile} onNewFolder={onNewFolder}
                onDeleteItem={onDeleteItem} onRenameItem={onRenameItem} />
            ))}
          </>
        )}
      </div>
    </div>
  )
}

function TreeNode({ item, depth, exp, toggle, activeFile, onOpenFile, onNewFile, onNewFolder, onDeleteItem, onRenameItem }) {
  const [ctx,      setCtx]      = useState(null)
  const [renaming, setRenaming] = useState(false)
  const [draft,    setDraft]    = useState(item.name)
  const inputRef = useRef()
  const isOpen   = exp[item.path]
  const isActive = item.type === 'file' && activeFile?.path === item.path

  useEffect(() => { if (renaming) { inputRef.current?.focus(); inputRef.current?.select() } }, [renaming])

  const commit = () => { onRenameItem(item.path, draft); setRenaming(false) }

  return (
    <>
      <div
        className={`${S.node} ${isActive ? S.nodeAct : ''}`}
        style={{ paddingLeft: 8 + depth * 13 }}
        onClick={() => item.type === 'folder' ? toggle(item.path) : onOpenFile(item)}
        onContextMenu={e => { e.preventDefault(); e.stopPropagation(); setCtx({ x: e.clientX, y: e.clientY }) }}
      >
        {item.type === 'folder'
          ? <><Arrow open={isOpen} /><FolderIcon open={isOpen} /></>
          : <><span className={S.indent} /><FIcon ext={item.ext} /></>
        }
        {renaming
          ? <input ref={inputRef} className={S.rInput} value={draft} onChange={e => setDraft(e.target.value)}
              onBlur={commit} onClick={e => e.stopPropagation()}
              onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setRenaming(false) }} />
          : <span className={S.nodeName}>{item.name}</span>
        }
      </div>

      {item.type === 'folder' && isOpen && item.children?.map(ch => (
        <TreeNode key={ch.path} item={ch} depth={depth + 1} exp={exp} toggle={toggle}
          activeFile={activeFile} onOpenFile={onOpenFile}
          onNewFile={onNewFile} onNewFolder={onNewFolder}
          onDeleteItem={onDeleteItem} onRenameItem={onRenameItem} />
      ))}

      {ctx && (
        <CtxMenu x={ctx.x} y={ctx.y} item={item}
          onClose={() => setCtx(null)}
          onNewFile={() => onNewFile(item.type === 'folder' ? item.path : undefined)}
          onNewFolder={() => onNewFolder(item.type === 'folder' ? item.path : undefined)}
          onRename={() => setRenaming(true)}
          onDelete={() => onDeleteItem(item.path)}
          onReveal={() => window.api?.revealItem(item.path)} />
      )}
    </>
  )
}

function CtxMenu({ x, y, item, onClose, onNewFile, onNewFolder, onRename, onDelete, onReveal }) {
  const ref = useRef()
  useEffect(() => {
    const fn = e => { if (!ref.current?.contains(e.target)) onClose() }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [onClose])
  const cl = (fn) => () => { fn(); onClose() }
  return (
    <div ref={ref} className={S.ctx} style={{ left: x, top: y }}>
      {item.type === 'folder' && <CI onClick={cl(onNewFile)}>New File</CI>}
      {item.type === 'folder' && <CI onClick={cl(onNewFolder)}>New Folder</CI>}
      {item.type === 'folder' && <div className={S.csep} />}
      <CI onClick={cl(onRename)}>Rename</CI>
      <CI onClick={cl(onReveal)}>Reveal in Finder</CI>
      <div className={S.csep} />
      <CI danger onClick={cl(onDelete)}>Delete</CI>
    </div>
  )
}
const CI = ({ children, onClick, danger }) => (
  <button className={`${S.ci} ${danger ? S.ciDanger : ''}`} onClick={onClick}>{children}</button>
)

/* ── Search ── */
function SearchPane({ openFiles, onOpenFile }) {
  const [q, setQ] = useState('')
  const results = q.length > 1
    ? openFiles.flatMap(f => {
        const lines = (f.content || '').split('\n')
        const hits  = lines.map((t, i) => ({ ln: i + 1, t })).filter(l => l.t.toLowerCase().includes(q.toLowerCase()))
        return hits.length ? [{ f, hits: hits.slice(0, 6) }] : []
      })
    : []
  return (
    <div className={S.pane}>
      <div className={S.hdr}><span className={S.hdrTitle}>SEARCH</span></div>
      <div className={S.searchBox}><input value={q} onChange={e => setQ(e.target.value)} placeholder="Search in open files…" /></div>
      <div className={S.results}>
        {q.length > 1 && !results.length && <p className={S.noResult}>No results</p>}
        {results.map(({ f, hits }) => (
          <div key={f.id}>
            <div className={S.rfName} onClick={() => onOpenFile(f)}>{f.name}<span className={S.badge}>{hits.length}</span></div>
            {hits.map(h => (
              <div key={h.ln} className={S.rLine} onClick={() => onOpenFile(f)}>
                <span className={S.rLn}>{h.ln}</span>
                <span className={S.rText}>{h.t.trim().slice(0, 60)}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Git ── */
function GitPane({ git, onOpenFileDiff, rootFolderPath }) {
  const [msg, setMsg] = useState('')
  const [committing, setCommitting] = useState(false)

  if (!git) return null

  if (!git.hasGit) {
    return (
      <div className={S.pane}>
        <div className={S.hdr}><span className={S.hdrTitle}>SOURCE CONTROL</span></div>
        <div className={S.bigEmpty} style={{ padding: '24px 16px', textAlign: 'center' }}>
          <svg viewBox="0 0 48 48" fill="none" width="38" style={{ color: '#8c8c9e', marginBottom: '12px' }}><circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1.5"/><circle cx="12" cy="36" r="5" stroke="currentColor" strokeWidth="1.5"/><circle cx="36" cy="12" r="5" stroke="currentColor" strokeWidth="1.5"/><path d="M12 17v14M13.5 12H30c3 0 5 2 5 5v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          <p style={{ color: '#fff', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px' }}>No git repository</p>
          <span style={{ color: '#8c8c9e', fontSize: '11px', display: 'block', marginBottom: '16px' }}>This folder is not a Git repository.</span>
          <button 
            onClick={git.init}
            style={{
              background: 'var(--ac)',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            Initialize Repository
          </button>
        </div>
      </div>
    )
  }

  const handleCommit = async (e) => {
    e.preventDefault()
    if (!msg.trim()) return
    setCommitting(true)
    await git.commit(msg)
    setMsg('')
    setCommitting(false)
  }

  const unstagedFiles = git.status.filter(f => f.status === '??' || f.status === ' M' || f.status === ' D' || f.status === 'AM')
  const stagedFiles = git.status.filter(f => f.status === 'A ' || f.status === 'M ' || f.status === 'D ')

  return (
    <div className={S.pane} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className={S.hdr}>
        <span className={S.hdrTitle}>SOURCE CONTROL ({git.branch})</span>
        <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
          <button onClick={git.pull} title="Pull" style={{ background: 'none', border: 'none', color: '#8c8c9e', cursor: 'pointer', fontSize: '12px' }}>⬇️</button>
          <button onClick={git.push} title="Push" style={{ background: 'none', border: 'none', color: '#8c8c9e', cursor: 'pointer', fontSize: '12px' }}>⬆️</button>
          <button onClick={git.refresh} title="Refresh" style={{ background: 'none', border: 'none', color: '#8c8c9e', cursor: 'pointer', fontSize: '12px' }}>🔄</button>
        </div>
      </div>

      <div style={{ padding: '12px' }}>
        <form onSubmit={handleCommit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <input 
            type="text" 
            placeholder="Commit message (Ctrl+Enter to commit)" 
            value={msg} 
            onChange={e => setMsg(e.target.value)}
            style={{
              background: '#0d0d12',
              border: '1px solid #2d2d38',
              borderRadius: '4px',
              padding: '6px 10px',
              color: '#fff',
              fontSize: '12px',
              outline: 'none'
            }}
            onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handleCommit(e) }}
          />
          <button 
            type="submit" 
            disabled={committing || !msg.trim() || git.status.length === 0}
            style={{
              background: msg.trim() && git.status.length > 0 ? 'var(--ac)' : '#2d2d38',
              color: msg.trim() && git.status.length > 0 ? '#fff' : '#8c8c9e',
              border: 'none',
              borderRadius: '4px',
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: 'bold',
              cursor: msg.trim() && git.status.length > 0 ? 'pointer' : 'not-allowed'
            }}
          >
            {committing ? 'Committing...' : '✓ Commit'}
          </button>
        </form>
      </div>

      {/* File List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px' }}>
        {git.status.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#8c8c9e', fontSize: '11px', marginTop: '24px' }}>
            No changes detected in repository.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Staged Changes */}
            {stagedFiles.length > 0 && (
              <div>
                <div style={{ color: '#fff', fontSize: '11px', fontWeight: 'bold', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Staged Changes ({stagedFiles.length})</div>
                {stagedFiles.map(f => (
                  <GitFileRow 
                    key={f.path} 
                    file={f} 
                    staged={true} 
                    git={git} 
                    onOpenFileDiff={onOpenFileDiff} 
                    rootFolderPath={rootFolderPath} 
                  />
                ))}
              </div>
            )}

            {/* Unstaged Changes */}
            {unstagedFiles.length > 0 && (
              <div>
                <div style={{ color: '#fff', fontSize: '11px', fontWeight: 'bold', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Changes ({unstagedFiles.length})</div>
                {unstagedFiles.map(f => (
                  <GitFileRow 
                    key={f.path} 
                    file={f} 
                    staged={false} 
                    git={git} 
                    onOpenFileDiff={onOpenFileDiff} 
                    rootFolderPath={rootFolderPath} 
                  />
                ))}
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  )
}

function GitFileRow({ file, staged, git, onOpenFileDiff, rootFolderPath }) {
  const filePath = rootFolderPath + '/' + file.path
  const stat = file.status.trim()
  const isUntracked = stat === '??'
  
  let label = 'M'
  let color = '#d97706' // yellow for modified
  if (isUntracked) {
    label = 'U'
    color = '#059669' // green for untracked
  } else if (stat === 'A') {
    label = 'A'
    color = '#38bdf8' // blue for added
  } else if (stat === 'D') {
    label = 'D'
    color = '#dc2626' // red for deleted
  }

  const handleStageClick = (e) => {
    e.stopPropagation()
    staged ? git.unstage(file.path) : git.stage(file.path)
  }

  const handleDiscardClick = (e) => {
    e.stopPropagation()
    if (window.confirm(`Are you sure you want to discard all changes to ${file.path}?`)) {
      git.discard(file.path)
    }
  }

  return (
    <div 
      onClick={() => onOpenFileDiff(filePath)}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '6px 8px',
        borderRadius: '4px',
        cursor: 'pointer',
        background: 'transparent',
        fontSize: '12px',
        color: '#e0e0e8',
        margin: '2px 0',
        transition: 'background 0.2s'
      }}
      onMouseEnter={e => e.currentTarget.style.background = '#1a1a24'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1, paddingRight: '8px' }}>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 'bold' }}>
          {file.path.split('/').pop()}
        </span>
        <span style={{ fontSize: '10px', color: '#8c8c9e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {file.path}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <button 
          onClick={handleStageClick} 
          title={staged ? 'Unstage' : 'Stage'} 
          style={{ background: 'none', border: 'none', color: '#8c8c9e', cursor: 'pointer', padding: '2px', fontSize: '11px' }}
        >
          {staged ? '➖' : '➕'}
        </button>
        
        {!staged && !isUntracked && (
          <button 
            onClick={handleDiscardClick} 
            title="Discard changes" 
            style={{ background: 'none', border: 'none', color: '#8c8c9e', cursor: 'pointer', padding: '2px', fontSize: '11px' }}
          >
            ↺
          </button>
        )}

        <span style={{ 
          fontSize: '9px', 
          fontWeight: 'bold', 
          background: `${color}22`, 
          color: color, 
          border: `1px solid ${color}44`,
          borderRadius: '3px',
          padding: '1px 4px',
          width: '16px',
          textAlign: 'center'
        }}>
          {label}
        </span>
      </div>
    </div>
  )
}

/* ── Extensions ── */
const EXTS = [
  { id:'prettier', name:'Prettier',         desc:'Opinionated code formatter',                 ver:'3.1.0',  dl:'98M', icon:'💅', on:true,  cat:'Formatter' },
  { id:'eslint',   name:'ESLint',            desc:'Find and fix JS/TS problems',                ver:'2.4.4',  dl:'81M', icon:'🔍', on:true,  cat:'Linter' },
  { id:'gitlens',  name:'GitLens',           desc:'Supercharge Git in your editor',             ver:'14.9.1', dl:'32M', icon:'🔭', on:false, cat:'Git' },
  { id:'copilot',  name:'AI Copilot',        desc:'AI-powered inline code completion',          ver:'1.145',  dl:'20M', icon:'🤖', on:false, cat:'AI' },
  { id:'indent',   name:'Indent Rainbow',    desc:'Colorize indentation levels',                ver:'8.3.1',  dl:'12M', icon:'🌈', on:false, cat:'Visual' },
  { id:'icons',    name:'Material Icons',    desc:'Beautiful file and folder icons',            ver:'4.34.0', dl:'55M', icon:'🎨', on:true,  cat:'Theme' },
  { id:'path',     name:'Path Intellisense', desc:'Autocomplete file paths in imports',         ver:'2.8.5',  dl:'28M', icon:'🛤', on:false, cat:'IntelliSense' },
  { id:'bracket',  name:'Rainbow Brackets',  desc:'Colorize matching bracket pairs',            ver:'2.6.0',  dl:'10M', icon:'🔵', on:true,  cat:'Visual' },
  { id:'thunder',  name:'Thunder Client',    desc:'REST API client inside your IDE',            ver:'2.14.1', dl:'4M',  icon:'⚡', on:false, cat:'Testing' },
  { id:'todo',     name:'Todo Highlight',    desc:'Highlight TODO/FIXME/HACK comments',         ver:'1.0.5',  dl:'6M',  icon:'✅', on:false, cat:'Productivity' },
  { id:'docker',   name:'Docker',            desc:'Build, manage containers from your IDE',     ver:'1.28.0', dl:'15M', icon:'🐳', on:false, cat:'DevOps' },
  { id:'restclient',name:'REST Client',      desc:'Send HTTP requests in a .http file',         ver:'0.25.1', dl:'8M',  icon:'📡', on:false, cat:'Testing' },
]

function ExtPane({ notify }) {
  const [inst, setInst] = useState(() => new Set(EXTS.filter(e => e.on).map(e => e.id)))
  const [q,    setQ]    = useState('')
  const [tab,  setTab]  = useState('all')

  const list = EXTS.filter(e =>
    (tab === 'installed' ? inst.has(e.id) : true) &&
    (!q || e.name.toLowerCase().includes(q.toLowerCase()) || e.desc.toLowerCase().includes(q.toLowerCase()))
  )

  const toggle = (id, name) => {
    setInst(prev => {
      const n = new Set(prev)
      if (n.has(id)) { n.delete(id); notify?.('info', `${name} uninstalled`) }
      else { n.add(id); notify?.('success', `${name} installed`) }
      return n
    })
  }

  return (
    <div className={S.pane}>
      <div className={S.hdr}><span className={S.hdrTitle}>EXTENSIONS</span></div>
      <div className={S.searchBox}><input value={q} onChange={e => setQ(e.target.value)} placeholder="Search extensions…" /></div>
      <div className={S.extTabs}>
        {['all','installed'].map(t => (
          <button key={t} className={`${S.extTab} ${tab === t ? S.extTabAct : ''}`} onClick={() => setTab(t)}>
            {t === 'all' ? 'All' : `Installed (${inst.size})`}
          </button>
        ))}
      </div>
      <div className={S.extList}>
        {list.map(e => (
          <div key={e.id} className={S.extCard}>
            <div className={S.extIcon}>{e.icon}</div>
            <div className={S.extInfo}>
              <div className={S.extTop}>
                <span className={S.extName}>{e.name}</span>
                <span className={S.extVer}>v{e.ver}</span>
                <span className={S.extCat}>{e.cat}</span>
              </div>
              <div className={S.extDesc}>{e.desc}</div>
              <div className={S.extDl}>{e.dl} downloads</div>
            </div>
            <button className={`${S.extBtn} ${inst.has(e.id) ? S.extBtnOff : ''}`} onClick={() => toggle(e.id, e.name)}>
              {inst.has(e.id) ? 'Uninstall' : 'Install'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── small icon helpers ── */
const Btn = ({ tip, onClick, children }) => <button className={S.ibtn} title={tip} onClick={onClick}>{children}</button>
const Arrow = ({ open }) => <svg className={`${S.arr} ${open ? S.arrOpen : ''}`} viewBox="0 0 6 9" width="6" fill="none"><path d="M1 1l4 3.5L1 8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
const FolderIcon = ({ open }) => <svg viewBox="0 0 16 16" width="14" fill="none"><path d={open ? 'M1 5h4l2 2h8v7H1V5z' : 'M1 3h4l2 2h8v9H1V3z'} stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/></svg>
const NewFileIcon   = () => <svg viewBox="0 0 14 14" width="13" fill="none"><path d="M8 1H3a1 1 0 00-1 1v10a1 1 0 001 1h8a1 1 0 001-1V5L8 1z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round"/><path d="M8 1v4h4" stroke="currentColor" strokeWidth="1.1"/><path d="M7 8v3M5.5 9.5h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
const NewFolderIcon = () => <svg viewBox="0 0 14 14" width="13" fill="none"><path d="M1 2.5h3.5l1.5 1.5H13v8H1V2.5z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round"/><path d="M7 6.5v3M5.5 8h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
const RefreshIcon   = () => <svg viewBox="0 0 14 14" width="13" fill="none"><path d="M2 7a5 5 0 009.5-2M12 7a5 5 0 01-9.5 2" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/><path d="M2 4.5L2.5 7l2.5-.5M12 9.5L11.5 7l-2.5.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/></svg>
const FolderBigIcon = () => <svg viewBox="0 0 48 48" fill="none" width="40"><path d="M6 8h12l4 4h20v28H6V8z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/></svg>
