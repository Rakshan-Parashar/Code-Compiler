import React,{useState,useRef,useEffect}from'react'
import S from'./TitleBar.module.css'

export default function TitleBar({activeFile,running,canRun,onRun,onStop,onOpen,onSave,onSaveAs,onOpenFolder,onNewFile,onToggleSidebar,onTogglePanel,onToggleSplit,onZenMode,onPalette,onFormat,onAI,onData,onClearTerminal,onShowWelcome,onShowShortcuts,onShowAbout,onShowGoToLine,onOpenAccount,onOpenCloud,branch,gitStatus,zenMode,splitMode,errorCount,editorMode,onChangeEditorMode}){

  return(<header className={S.bar}>
    <div className={S.left}>
      <div className={S.logo}>
        <svg viewBox="0 0 24 24" fill="none" width="14" height="14" className="animate-logo-glow">
          <defs>
            <linearGradient id="titleLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--ac-start)" />
              <stop offset="50%" stopColor="var(--ac)" />
              <stop offset="100%" stopColor="var(--ac-end)" />
            </linearGradient>
          </defs>
          <path d="M8 5 A 8.5 8.5 0 0 0 8 19" stroke="url(#titleLogoGrad)" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M16 5 A 8.5 8.5 0 0 1 16 19" stroke="url(#titleLogoGrad)" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="12" cy="12" r="2.8" fill="url(#titleLogoGrad)" />
        </svg>
      </div>
      <MenuBar onOpen={onOpen} onSave={onSave} onSaveAs={onSaveAs} onOpenFolder={onOpenFolder} onNewFile={onNewFile} onToggleSidebar={onToggleSidebar} onTogglePanel={onTogglePanel} onToggleSplit={onToggleSplit} onZenMode={onZenMode} onFormat={onFormat} onAI={onAI} onRun={onRun} onStop={onStop} canRun={canRun} onPalette={onPalette} onClearTerminal={onClearTerminal} onShowWelcome={onShowWelcome} onShowShortcuts={onShowShortcuts} onShowAbout={onShowAbout} onShowGoToLine={onShowGoToLine}/>
      
      <button className={S.pill} onClick={onOpenFolder} title="Open Workspace Folder">
        <span className={S.pillText}>{activeFile ? activeFile.name + (activeFile.modified ? ' ●' : '') : 'Atmos Workspace'}</span>
        {errorCount > 0 && <span className={S.errBadge}>{errorCount}</span>}
      </button>
    </div>

    <div className={S.segments}>
      {['Preview', 'Debug', 'Code'].map(seg => (
        <button 
          key={seg} 
          className={`${S.segmentBtn} ${editorMode === seg.toLowerCase() ? S.segmentBtnAct : ''}`}
          onClick={() => onChangeEditorMode(seg.toLowerCase())}
        >
          {seg}
        </button>
      ))}
    </div>

    <div className={S.right}>
      {branch && (
        <div className={S.branch}>
          <svg viewBox="0 0 14 14" width="10" fill="none">
            <circle cx="4" cy="3" r="1.5" stroke="currentColor" strokeWidth="1.1"/>
            <circle cx="4" cy="11" r="1.5" stroke="currentColor" strokeWidth="1.1"/>
            <circle cx="10" cy="3" r="1.5" stroke="currentColor" strokeWidth="1.1"/>
            <path d="M4 4.5V9.5M5.5 3H8c1 0 1.5.5 1.5 1.5V6" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
          </svg>
          {branch}
          {gitStatus?.length > 0 && <span className={S.gitDot}>{gitStatus.length}</span>}
        </div>
      )}
      
      <div className={S.toolBtns}>
        <Tb tip="Command Palette (Ctrl+Shift+P)" onClick={onPalette}>
          <svg viewBox="0 0 14 14" width="11" fill="none"><circle cx="6" cy="6" r="4" stroke="currentColor" strokeWidth="1.2"/><path d="M9.5 9.5l3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
        </Tb>
        <Tb tip="Data Explorer" onClick={onData}><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"/></svg></Tb>
        <Tb tip="AI Assistant" onClick={onAI}><svg viewBox="0 0 16 16" width="13" fill="none"><rect x="2" y="2" width="12" height="12" rx="3" stroke="currentColor" strokeWidth="1.2"/><circle cx="6" cy="8" r="1.2" fill="currentColor"/><circle cx="10" cy="8" r="1.2" fill="currentColor"/><path d="M5 5.5q0-1.5 1.5-2" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/></svg></Tb>
        <Tb tip="Split Editor" active={splitMode} onClick={onToggleSplit}><svg viewBox="0 0 16 16" width="13" fill="none"><rect x="1" y="1" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.2"/><path d="M8 1v14" stroke="currentColor" strokeWidth="1.2"/></svg></Tb>
        <Tb tip="Format" onClick={onFormat}><svg viewBox="0 0 16 16" width="13" fill="none"><path d="M3 4h10M3 8h6M3 12h8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg></Tb>
        <Tb tip="Zen Mode" active={zenMode} onClick={onZenMode}><svg viewBox="0 0 16 16" width="13" fill="none"><circle cx="8" cy="8" r="5" stroke="currentColor" strokeWidth="1.2"/><circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.2"/></svg></Tb>
      </div>

      {running ? (
        <button className={`${S.runBtn} ${S.stop}`} onClick={onStop}>
          <svg viewBox="0 0 10 10" width="8" fill="currentColor" style={{ marginRight: '4px' }}><rect width="10" height="10" rx="1.5"/></svg>Stop
        </button>
      ) : (
        <button className={S.runBtn} onClick={onRun} disabled={!canRun} title="Run F5">
          <svg viewBox="0 0 10 12" width="8" fill="currentColor" style={{ marginRight: '4px' }}><path d="M0 0L10 6L0 12V0Z"/></svg>Run
        </button>
      )}

      <button className={S.panelBtn} onClick={onOpenCloud} title="Cloud Snippets">
        <svg viewBox="0 0 16 16" width="13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 10a3.5 3.5 0 01.5-6.9 4 4 0 017.5 0A3.5 3.5 0 0113 10H3z" />
        </svg>
        <span>Snippets</span>
      </button>

      <button className={S.panelBtn} onClick={onOpenAccount} title="Account Profile">
        <svg viewBox="0 0 16 16" width="13" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="8" cy="5.5" r="2.5" />
          <path d="M2 13.5c0-2.5 2.5-4 6-4s6 1.5 6 4" strokeLinecap="round" />
        </svg>
        <span>Account</span>
      </button>

      <div className={S.winBtns}>
        <button className={S.wb} onClick={()=>window.api?.winMin()}>—</button>
        <button className={S.wb} onClick={()=>window.api?.winMax()}>⬜</button>
        <button className={S.wb+' '+S.wbX} onClick={()=>window.api?.winClose()}>✕</button>
      </div>
    </div>
  </header>)
}

function Tb({tip,onClick,active,children}){return<button className={S.toolBtn+(active?' '+S.toolBtnAct:'')} title={tip} onClick={onClick}>{children}</button>}

function MenuBar({onOpen,onSave,onSaveAs,onOpenFolder,onNewFile,onToggleSidebar,onTogglePanel,onToggleSplit,onZenMode,onFormat,onAI,onRun,onStop,canRun,onPalette,onClearTerminal,onShowWelcome,onShowShortcuts,onShowAbout,onShowGoToLine}){
  const trigger = (actionId) => {
    window.dispatchEvent(new CustomEvent('editor-action', { detail: actionId }));
  };

  const menus=[
    {label:'File',items:[{l:'New File',s:'Ctrl+N',a:onNewFile},{l:'Open File…',s:'Ctrl+O',a:onOpen},{l:'Open Folder…',s:'Ctrl+Shift+O',a:onOpenFolder},null,{l:'Save',s:'Ctrl+S',a:onSave},{l:'Save As…',s:'Ctrl+Shift+S',a:onSaveAs}]},
    {label:'Edit',items:[{l:'Undo',s:'Ctrl+Z',a:()=>trigger('undo')},{l:'Redo',s:'Ctrl+Y',a:()=>trigger('redo')},null,{l:'Cut',s:'Ctrl+X',a:()=>trigger('cut')},{l:'Copy',s:'Ctrl+C',a:()=>trigger('copy')},{l:'Paste',s:'Ctrl+V',a:()=>trigger('paste')},null,{l:'Format Document',s:'Ctrl+Shift+F',a:onFormat},{l:'AI Assistant',s:'Ctrl+Shift+K',a:onAI}]},
    {label:'Selection',items:[{l:'Select All',s:'Ctrl+A',a:()=>trigger('selectAll')},{l:'Expand Selection',s:'Shift+Alt+Right',a:()=>trigger('expandSelection')},{l:'Shrink Selection',s:'Shift+Alt+Left',a:()=>trigger('shrinkSelection')}]},
    {label:'View',items:[{l:'Command Palette...',s:'Ctrl+Shift+P',a:onPalette},null,{l:'Toggle Sidebar',s:'Ctrl+Shift+E',a:onToggleSidebar},{l:'Toggle Panel',s:'Ctrl+`',a:onTogglePanel},{l:'Split Editor',s:"Ctrl+\\",a:onToggleSplit},{l:'Zen Mode',a:onZenMode},{l:'Full Screen',s:'F11',a:()=>window.api?.winFullscreen()}]},
    {label:'Go',items:[{l:'Go to File...',s:'Ctrl+P',a:onPalette},{l:'Go to Line/Column...',s:'Ctrl+G',a:onShowGoToLine},null,{l:'Go to Definition',s:'F12',a:()=>trigger('goToDefinition')},{l:'Go to References',s:'Shift+F12',a:()=>trigger('goToReferences')}]},
    {label:'Run',items:[{l:'Run Code',s:'F5',a:onRun},{l:'Stop Run',s:'Shift+F5',a:onStop},null,{l:'Run Active File',a:onRun},{l:'Toggle Breakpoint',s:'F9',a:()=>trigger('toggleBreakpoint')}]},
    {label:'Terminal',items:[{l:'New Terminal',s:'Ctrl+Shift+`',a:onTogglePanel},{l:'Split Terminal',a:()=>trigger('splitTerminal')},{l:'Clear Terminal Output',a:onClearTerminal}]},
    {label:'Help',items:[{l:'Welcome',a:onShowWelcome},{l:'Keyboard Shortcuts Reference',a:onShowShortcuts},{l:'About Atmos IDE',a:onShowAbout}]},
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
