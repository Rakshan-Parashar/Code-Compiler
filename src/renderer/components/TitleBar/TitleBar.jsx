import React,{useState,useRef,useEffect}from'react'
import S from'./TitleBar.module.css'

export default function TitleBar({activeFile,running,canRun,onRun,onStop,onOpen,onSave,onSaveAs,onOpenFolder,onNewFile,onToggleSidebar,onTogglePanel,onToggleSplit,onZenMode,onPalette,onFormat,onAI,onData,branch,gitStatus,zenMode,splitMode,errorCount}){
  return(<header className={S.bar}>
    <div className={S.left}>
      <div className={S.logo}><svg viewBox="0 0 20 20" fill="none" width="13"><polygon points="10,2 18,16 2,16" stroke="#fff" strokeWidth="2" strokeLinejoin="round" fill="rgba(255,255,255,.1)"/><path d="M7 13l3-6 3 6" stroke="rgba(255,255,255,.8)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M8.5 11h3" stroke="rgba(255,255,255,.8)" strokeWidth="1.2" strokeLinecap="round"/></svg></div>
      <MenuBar onOpen={onOpen} onSave={onSave} onSaveAs={onSaveAs} onOpenFolder={onOpenFolder} onNewFile={onNewFile} onToggleSidebar={onToggleSidebar} onTogglePanel={onTogglePanel} onToggleSplit={onToggleSplit} onZenMode={onZenMode} onFormat={onFormat} onAI={onAI}/>
    </div>
    <button className={S.pill} onClick={onPalette} title="Command Palette (Ctrl+Shift+P)">
      <svg viewBox="0 0 14 14" width="11" fill="none"><circle cx="6" cy="6" r="4" stroke="currentColor" strokeWidth="1.2"/><path d="M9.5 9.5l3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
      <span className={S.pillText}>{activeFile?activeFile.name+(activeFile.modified?' ●':''):'Zenith IDE'}</span>
      {errorCount>0&&<span className={S.errBadge}>{errorCount}</span>}
      <span className={S.pillHint}>Ctrl+Shift+P</span>
    </button>
    <div className={S.right}>
      {branch&&<div className={S.branch}><svg viewBox="0 0 14 14" width="10" fill="none"><circle cx="4" cy="3" r="1.5" stroke="currentColor" strokeWidth="1.1"/><circle cx="4" cy="11" r="1.5" stroke="currentColor" strokeWidth="1.1"/><circle cx="10" cy="3" r="1.5" stroke="currentColor" strokeWidth="1.1"/><path d="M4 4.5V9.5M5.5 3H8c1 0 1.5.5 1.5 1.5V6" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/></svg>{branch}{gitStatus?.length>0&&<span className={S.gitDot}>{gitStatus.length}</span>}</div>}
      <div className={S.toolBtns}>
        <Tb tip="Data Explorer & API Client" onClick={onData}><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"/></svg></Tb>
        <Tb tip="AI Assistant" onClick={onAI}><svg viewBox="0 0 16 16" width="14" fill="none"><rect x="2" y="2" width="12" height="12" rx="3" stroke="currentColor" strokeWidth="1.2"/><circle cx="6" cy="8" r="1.2" fill="currentColor"/><circle cx="10" cy="8" r="1.2" fill="currentColor"/><path d="M5 5.5q0-1.5 1.5-2" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/></svg></Tb>
        <Tb tip="Split Editor" active={splitMode} onClick={onToggleSplit}><svg viewBox="0 0 16 16" width="14" fill="none"><rect x="1" y="1" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.2"/><path d="M8 1v14" stroke="currentColor" strokeWidth="1.2"/></svg></Tb>
        <Tb tip="Format" onClick={onFormat}><svg viewBox="0 0 16 16" width="14" fill="none"><path d="M3 4h10M3 8h6M3 12h8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg></Tb>
        <Tb tip="Zen Mode" active={zenMode} onClick={onZenMode}><svg viewBox="0 0 16 16" width="14" fill="none"><circle cx="8" cy="8" r="5" stroke="currentColor" strokeWidth="1.2"/><circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.2"/></svg></Tb>
      </div>
      {running?<button className={S.runBtn+' '+S.stop} onClick={onStop}><svg viewBox="0 0 10 10" width="9" fill="currentColor"><rect width="10" height="10" rx="2"/></svg>Stop</button>:<button className={S.runBtn} onClick={onRun} disabled={!canRun} title="Run F5"><svg viewBox="0 0 10 12" width="9" fill="currentColor"><path d="M0 0L10 6L0 12V0Z"/></svg>Run</button>}
      <div className={S.winBtns}>
        <button className={S.wb} onClick={()=>window.api?.winMin()}>—</button>
        <button className={S.wb} onClick={()=>window.api?.winMax()}>⬜</button>
        <button className={S.wb+' '+S.wbX} onClick={()=>window.api?.winClose()}>✕</button>
      </div>
    </div>
  </header>)
}

function Tb({tip,onClick,active,children}){return<button className={S.toolBtn+(active?' '+S.toolBtnAct:'')} title={tip} onClick={onClick}>{children}</button>}

function MenuBar({onOpen,onSave,onSaveAs,onOpenFolder,onNewFile,onToggleSidebar,onTogglePanel,onToggleSplit,onZenMode,onFormat,onAI}){
  const menus=[
    {label:'File',items:[{l:'New File',s:'Ctrl+N',a:onNewFile},{l:'Open File…',s:'Ctrl+O',a:onOpen},{l:'Open Folder…',s:'Ctrl+Shift+O',a:onOpenFolder},null,{l:'Save',s:'Ctrl+S',a:onSave},{l:'Save As…',s:'Ctrl+Shift+S',a:onSaveAs}]},
    {label:'Edit',items:[{l:'Format Document',s:'Ctrl+Shift+F',a:onFormat},{l:'AI Assistant',s:'Ctrl+Shift+K',a:onAI}]},
    {label:'View',items:[{l:'Toggle Sidebar',s:'Ctrl+Shift+E',a:onToggleSidebar},{l:'Toggle Panel',s:'Ctrl+`',a:onTogglePanel},{l:'Split Editor',s:"Ctrl+\\",a:onToggleSplit},{l:'Zen Mode',a:onZenMode},{l:'Full Screen',s:'F11',a:()=>window.api?.winFullscreen()}]},
  ]
  return<nav className={S.nav}>{menus.map(m=><DM key={m.label} label={m.label} items={m.items}/>)}</nav>
}

function DM({label,items}){
  const[open,setOpen]=useState(false)
  const ref=useRef()
  useEffect(()=>{const fn=e=>{if(ref.current&&!ref.current.contains(e.target))setOpen(false)};document.addEventListener('mousedown',fn);return()=>document.removeEventListener('mousedown',fn)},[])
  return(<div className={S.mg} ref={ref}>
    <button className={S.mt} onClick={()=>setOpen(o=>!o)}>{label}</button>
    {open&&<div className={S.dd}>{items.map((it,i)=>it===null?<div key={i} className={S.sep}/>:<button key={i} className={S.mi} onClick={()=>{it.a?.();setOpen(false)}}><span>{it.l}</span>{it.s&&<span className={S.sc}>{it.s}</span>}</button>)}</div>}
  </div>)
}
