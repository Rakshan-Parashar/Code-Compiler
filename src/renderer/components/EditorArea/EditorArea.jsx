import React, { useRef, useEffect, useCallback } from 'react'
import Editor, { DiffEditor } from '@monaco-editor/react'
import S from './EditorArea.module.css'

const FC = { js:'#f7df1e',jsx:'#61dafb',ts:'#3178c6',tsx:'#61dafb',py:'#3776ab',html:'#e34f26',css:'#1572b6',json:'#cbcb41',md:'#519aba',sh:'#89e051',rs:'#dea584',go:'#79d4fd',java:'#f89820',rb:'#cc342d',default:'#6b7280' }
const EL = { js:'javascript',jsx:'javascript',ts:'typescript',tsx:'typescript',py:'python',html:'html',css:'css',json:'json',md:'markdown',sh:'shell',bash:'shell',c:'c',cpp:'cpp',java:'java',go:'go',rs:'rust',rb:'ruby',php:'php',txt:'plaintext',vue:'html',svelte:'html',yaml:'yaml',yml:'yaml',sql:'sql',toml:'ini',xml:'xml' }

const THEME = {
  base: 'vs-dark', inherit: true,
  rules: [
    { token:'comment',    foreground:'4a5568', fontStyle:'italic' },
    { token:'keyword',    foreground:'c792ea' },
    { token:'string',     foreground:'a8ff78' },
    { token:'number',     foreground:'f78c6c' },
    { token:'type',       foreground:'ffcb6b' },
    { token:'function',   foreground:'82aaff' },
    { token:'variable',   foreground:'eeffff' },
    { token:'operator',   foreground:'89ddff' },
    { token:'delimiter',  foreground:'89ddff' },
    { token:'class',      foreground:'ffcb6b' },
    { token:'interface',  foreground:'4ade80' },
    { token:'parameter',  foreground:'f78c6c', fontStyle:'italic' },
    { token:'decorator',  foreground:'c792ea', fontStyle:'italic' },
  ],
  colors: {
    'editor.background':                '#0d0d0f',
    'editor.foreground':                '#e0e0e8',
    'editorLineNumber.foreground':      '#353550',
    'editorLineNumber.activeForeground':'#7C3AED',
    'editor.lineHighlightBackground':   '#17171c',
    'editor.lineHighlightBorder':       '#00000000',
    'editor.selectionBackground':       '#7C3AED33',
    'editor.inactiveSelectionBackground':'#7C3AED1a',
    'editorCursor.foreground':          '#7C3AED',
    'editorCursor.background':          '#0d0d0f',
    'editorIndentGuide.background1':    '#1c1c23',
    'editorIndentGuide.activeBackground1':'#353550',
    'editorBracketMatch.background':    '#7C3AED22',
    'editorBracketMatch.border':        '#7C3AED66',
    'editorWidget.background':          '#17171c',
    'editorWidget.border':              '#3a3a50',
    'editorSuggestWidget.background':   '#17171c',
    'editorSuggestWidget.border':       '#3a3a50',
    'editorSuggestWidget.selectedBackground':'#7C3AED22',
    'editorHoverWidget.background':     '#17171c',
    'editorHoverWidget.border':         '#3a3a50',
    'scrollbarSlider.background':       '#ffffff14',
    'scrollbarSlider.hoverBackground':  '#ffffff22',
    'scrollbarSlider.activeBackground': '#7C3AED66',
    'minimap.background':               '#0d0d0f',
    'editorGutter.background':          '#0d0d0f',
    'peekView.border':                  '#7C3AED',
    'peekViewEditor.background':        '#0d0d0f',
    'peekViewResult.background':        '#17171c',
  },
}

export default function EditorArea({ 
  openFiles, activeFile, settings, language, 
  onSelectTab, onCloseTab, onChangeContent, onRun, onSave, gotoLine,
  onLocalEdit, onLocalCursor
}) {
  const editorRef = useRef(null)
  const monacoRef = useRef(null)
  const themeSet  = useRef(false)

  useEffect(() => {
    if (editorRef.current && gotoLine) {
      editorRef.current.revealLineInCenter(gotoLine.line)
      editorRef.current.setPosition({ lineNumber: gotoLine.line, column: 1 })
      editorRef.current.focus()
    }
  }, [gotoLine])

  const handleMount = (editor, monaco) => {
    editorRef.current  = editor
    monacoRef.current  = monaco
    if (!themeSet.current) {
      monaco.editor.defineTheme('zenith', THEME)
      monaco.editor.setTheme('zenith')
      themeSet.current = true
    }
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, onSave)
    editor.addCommand(monaco.KeyCode.F5, onRun)
    
    // Forward keyboard shortcuts to global window listener
    editor.onKeyDown(e => {
      const m = e.ctrlKey || e.metaKey;
      const key = e.browserEvent.key.toLowerCase();
      if (
        (m && ['s', 'o', 'n', 'e', 'p', 'f', 'k', '`', '\\', ',', 'g', 'm'].includes(key)) ||
        ['f5', 'f11', 'escape'].includes(key)
      ) {
        e.preventDefault();
        e.stopPropagation();
        window.dispatchEvent(new KeyboardEvent('keydown', e.browserEvent));
      }
    });

    editor.onDidChangeCursorPosition(e => {
      if (activeFile) {
        onChangeContent(activeFile.id, editor.getValue(), { line: e.position.lineNumber, col: e.position.column })
        onLocalCursor?.({ line: e.position.lineNumber, col: e.position.column })
      }
    })
  }

  const handleChange = useCallback(val => {
    if (activeFile && val !== undefined) {
      const pos = editorRef.current?.getPosition()
      onChangeContent(activeFile.id, val, pos ? { line: pos.lineNumber, col: pos.column } : undefined)
      onLocalEdit?.(val)
    }
  }, [activeFile, onChangeContent, onLocalEdit])

  const handleDiffMount = (editor, monaco) => {
    if (!themeSet.current) {
      monaco.editor.defineTheme('zenith', THEME)
      monaco.editor.setTheme('zenith')
      themeSet.current = true
    }
    const modifiedEditor = editor.getModifiedEditor()
    modifiedEditor.onDidChangeModelContent(() => {
      if (activeFile) {
        const val = modifiedEditor.getValue()
        const pos = modifiedEditor.getPosition()
        onChangeContent(activeFile.id, val, pos ? { line: pos.lineNumber, col: pos.column } : undefined)
      }
    })
    modifiedEditor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, onSave)
    modifiedEditor.addCommand(monaco.KeyCode.F5, onRun)

    // Forward keyboard shortcuts to global window listener
    modifiedEditor.onKeyDown(e => {
      const m = e.ctrlKey || e.metaKey;
      const key = e.browserEvent.key.toLowerCase();
      if (
        (m && ['s', 'o', 'n', 'e', 'p', 'f', 'k', '`', '\\', ',', 'g', 'm'].includes(key)) ||
        ['f5', 'f11', 'escape'].includes(key)
      ) {
        e.preventDefault();
        e.stopPropagation();
        window.dispatchEvent(new KeyboardEvent('keydown', e.browserEvent));
      }
    });
  }

  useEffect(() => {
    if (editorRef.current && activeFile) {
      const cur = editorRef.current.getValue()
      if (cur !== activeFile.content) editorRef.current.setValue(activeFile.content || '')
    }
  }, [activeFile?.id])

  const opts = {
    fontSize:          settings?.fontSize || 14,
    fontFamily:        `'${settings?.fontFamily || 'JetBrains Mono'}','Cascadia Code',monospace`,
    fontLigatures:     true,
    lineHeight:        22,
    minimap:           { enabled: settings?.minimap !== false },
    lineNumbers:       settings?.lineNumbers !== false ? 'on' : 'off',
    scrollBeyondLastLine: false,
    renderLineHighlight: 'line',
    cursorBlinking:    'smooth',
    cursorSmoothCaretAnimation: 'on',
    smoothScrolling:   settings?.smoothScrolling !== false,
    automaticLayout:   true,
    formatOnPaste:     true,
    wordWrap:          settings?.wordWrap ? 'on' : 'off',
    tabSize:           settings?.tabSize || 2,
    insertSpaces:      true,
    folding:           true,
    bracketPairColorization: { enabled: settings?.bracketPairColors !== false },
    guides:            { bracketPairs: true, indentation: settings?.showIndentGuides !== false },
    renderWhitespace:  settings?.renderWhitespace || 'selection',
    stickyScroll:      { enabled: settings?.stickyScroll !== false },
    padding:           { top: 14, bottom: 14 },
    scrollbar:         { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
    inlineSuggest:     { enabled: true },
    suggest:           { preview: true },
    colorDecorators:   true,
    glyphMargin:       false,
  }

  return (
    <div className={S.area}>
      {/* Tabs */}
      <div className={S.tabs}>
        {openFiles.length === 0 && <div className={S.tabsEmpty} />}
        {openFiles.map(f => (
          <div
            key={f.id}
            className={`${S.tab} ${activeFile?.id === f.id ? S.tabAct : ''}`}
            onClick={() => onSelectTab(f.id)}
            onMouseDown={e => e.button === 1 && (e.preventDefault(), onCloseTab(f.id))}
            title={f.path || f.name}
          >
            <span className={S.tabDot} style={{ background: FC[f.ext] || FC.default }} />
            <span className={S.tabName}>{f.name}</span>
            {f.modified && <span className={S.dot}>●</span>}
            <button className={S.close} onClick={e => { e.stopPropagation(); onCloseTab(f.id) }}>×</button>
          </div>
        ))}
      </div>

      {/* Breadcrumb */}
      {activeFile && (
        <div className={S.bc}>
          {(activeFile.path || activeFile.name).split(/[/\\]/).slice(-3).map((p, i, a) => (
            <span key={i}>
              <span className={i === a.length - 1 ? S.bcCur : S.bcPart}>{p}</span>
              {i < a.length - 1 && <span className={S.bcSlash}> / </span>}
            </span>
          ))}
        </div>
      )}

      {/* Editor */}
      <div className={S.editorWrap}>
        {!openFiles.length
          ? <Welcome />
          : activeFile
            ? activeFile.diffMode
              ? <DiffEditor
                  key={`diff_${activeFile.id}`}
                  height="100%"
                  theme="zenith"
                  language={EL[activeFile.ext] || 'plaintext'}
                  original={activeFile.originalContent || ''}
                  modified={activeFile.content || ''}
                  onMount={handleDiffMount}
                  options={opts}
                  loading={<div className={S.loading}>Loading diff…</div>}
                />
              : <Editor
                  key={activeFile.id}
                  height="100%"
                  theme="zenith"
                  language={EL[activeFile.ext] || 'plaintext'}
                  value={activeFile.content || ''}
                  onChange={handleChange}
                  onMount={handleMount}
                  options={opts}
                  loading={<div className={S.loading}>Loading editor…</div>}
                />
            : null
        }
      </div>
    </div>
  )
}

function Welcome() {
  const isMac = typeof navigator !== 'undefined' && navigator.userAgent.includes('Mac');
  const mod = isMac ? '⌘' : 'Ctrl+';
  const shift = isMac ? '⇧' : 'Shift+';

  return (
    <div className={S.welcome}>
      <div className={S.wInner}>
        <div className={S.wLogo}>
          <svg viewBox="0 0 60 60" fill="none" width="52"><polygon points="30,4 56,50 4,50" stroke="#7C3AED" strokeWidth="2.5" strokeLinejoin="round" fill="rgba(124,58,237,.08)"/><path d="M21 40l9-20 9 20" stroke="#9461f7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M24 34h12" stroke="#9461f7" strokeWidth="1.5" strokeLinecap="round"/></svg>
        </div>
        <h1 className={S.wTitle}>Zenith IDE</h1>
        <p className={S.wSub}>Hybrid Code Execution Environment</p>

        <div className={S.wActions}>
          {[['📄','New File',`${mod}N`,() => window.api?.openFile()],['📂','Open File',`${mod}O`,() => window.api?.openFile()],['🗂','Open Folder',`${mod}${shift}O`,() => window.api?.openFolder()]].map(([icon,label,hint,fn]) => (
            <button key={label} className={S.wBtn} onClick={fn}>
              <span className={S.wBtnIcon}>{icon}</span>
              <span className={S.wBtnLabel}>{label}</span>
              <span className={S.wBtnHint}>{hint}</span>
            </button>
          ))}
        </div>

        <div className={S.wGrid}>
          <div className={S.wSection}>
            <h3>Runtimes</h3>
            {[['JS','JavaScript','#f7df1e'],['TS','TypeScript','#3178c6'],['PY','Python 3','#3776ab'],['SH','Bash / Shell','#89e051'],['RB','Ruby','#cc342d'],['PHP','PHP','#7477af']].map(([tag,name,c]) => (
              <div key={tag} className={S.rt}><span className={S.rtTag} style={{ color:c, borderColor:`${c}40` }}>{tag}</span><span>{name}</span></div>
            ))}
          </div>
          <div className={S.wSection}>
            <h3>Shortcuts</h3>
            {[[isMac ? 'F5' : 'F5','Run file'],[`${mod}S`,'Save'],[`${mod}${shift}P`,'Command palette'],[`${mod}\``,'Toggle terminal'],[`${mod}${shift}E`,'Toggle sidebar'],[`${mod}N`,'New file'],[`${mod}${shift}G`,'Git Sidebar'],[`${mod},`,'Open Settings'],[`${mod}${shift}M`,'Zenith Notebooks']].map(([k,l]) => (
              <div key={k} className={S.sc}><kbd className={S.kbd}>{k}</kbd><span>{l}</span></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
