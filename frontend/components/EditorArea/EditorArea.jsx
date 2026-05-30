import React, { useState, useRef, useEffect, useCallback } from 'react'
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
    'editor.background':                '#121218',
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
  editorMode, lintErrors
}) {
  const editorRef = useRef(null)
  const monacoRef = useRef(null)
  const themeSet  = useRef(false)
  const [breakpoints, setBreakpoints] = useState({})
  const breakpointDecorationsRef = useRef({})

  useEffect(() => {
    const handleAction = (e) => {
      const actionId = e.detail;
      const editor = editorRef.current;
      if (!editor) return;

      if (actionId === 'undo') {
        editor.trigger('menu', 'undo');
      } else if (actionId === 'redo') {
        editor.trigger('menu', 'redo');
      } else if (actionId === 'selectAll') {
        editor.trigger('menu', 'editor.action.selectAll');
      } else if (actionId === 'expandSelection') {
        editor.trigger('menu', 'editor.action.smartSelect.expand');
      } else if (actionId === 'shrinkSelection') {
        editor.trigger('menu', 'editor.action.smartSelect.shrink');
      } else if (actionId === 'gotoLine') {
        editor.trigger('menu', 'editor.action.gotoLine');
      } else if (actionId === 'goToDefinition') {
        editor.trigger('menu', 'editor.action.revealDefinition');
      } else if (actionId === 'goToReferences') {
        editor.trigger('menu', 'editor.action.goToReferences');
      } else if (actionId === 'toggleBreakpoint') {
        if (!activeFile) return;
        const pos = editor.getPosition();
        if (!pos) return;
        const line = pos.lineNumber;
        setBreakpoints(prev => {
          const current = prev[activeFile.id] || [];
          const updated = current.includes(line)
            ? current.filter(l => l !== line)
            : [...current, line];
          return { ...prev, [activeFile.id]: updated };
        });
      }
    };
    window.addEventListener('editor-action', handleAction);
    return () => window.removeEventListener('editor-action', handleAction);
  }, [activeFile]);

  useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco || !activeFile) return;

    const activeBreakpoints = breakpoints[activeFile.id] || [];
    const oldDecorations = breakpointDecorationsRef.current[activeFile.id] || [];

    const newDecorations = activeBreakpoints.map(line => ({
      range: new monaco.Range(line, 1, line, 1),
      options: {
        isWholeLine: true,
        className: S.breakpointLineHighlight,
        glyphMarginClassName: S.breakpointGutterIcon,
        glyphMarginHoverMessage: { value: 'Breakpoint' }
      }
    }));

    const newIds = editor.deltaDecorations(oldDecorations, newDecorations);
    breakpointDecorationsRef.current[activeFile.id] = newIds;
  }, [breakpoints, activeFile?.id]);

  useEffect(() => {
    if (editorRef.current && gotoLine) {
      editorRef.current.revealLineInCenter(gotoLine.line)
      editorRef.current.setPosition({ lineNumber: gotoLine.line, column: 1 })
      editorRef.current.focus()
    }
  }, [gotoLine])

  const [editorMounted, setEditorMounted] = useState(false);

  useEffect(() => {
    setEditorMounted(false);
  }, [activeFile?.id]);

  useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco || !activeFile || !editorMounted) return;

    const model = editor.getModel();
    if (!model) return;

    const fileErrors = (lintErrors && lintErrors[activeFile.id]) || [];
    const markers = fileErrors.map(err => {
      const lineContent = model.getLineContent(err.line);
      let endCol = err.col || 1;
      if (lineContent) {
        const sub = lineContent.substring(endCol - 1);
        const match = /^\w+/.exec(sub);
        if (match) {
          endCol += match[0].length;
        } else {
          endCol += 1;
        }
      } else {
        endCol += 1;
      }
      return {
        startLineNumber: err.line,
        startColumn: err.col || 1,
        endLineNumber: err.line,
        endColumn: endCol,
        message: err.msg,
        severity: err.sev === 'error' ? monaco.MarkerSeverity.Error : 
                  err.sev === 'warning' ? monaco.MarkerSeverity.Warning : 
                  monaco.MarkerSeverity.Info
      };
    });

    monaco.editor.setModelMarkers(model, 'linter', markers);
  }, [lintErrors, activeFile?.id, editorMounted]);

  const handleMount = (editor, monaco) => {
    editorRef.current  = editor
    monacoRef.current  = monaco
    setEditorMounted(true)
    if (!themeSet.current) {
      monaco.editor.defineTheme('atmos', THEME)
      monaco.editor.setTheme('atmos')
      themeSet.current = true
    }
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, onSave)
    editor.addCommand(monaco.KeyCode.F5, onRun)
    editor.addCommand(monaco.KeyCode.F9, () => {
      window.dispatchEvent(new CustomEvent('editor-action', { detail: 'toggleBreakpoint' }));
    })
    
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
      }
    })
  }

  const handleChange = useCallback(val => {
    if (activeFile && val !== undefined) {
      const pos = editorRef.current?.getPosition()
      onChangeContent(activeFile.id, val, pos ? { line: pos.lineNumber, col: pos.column } : undefined)
    }
  }, [activeFile, onChangeContent])

  const handleDiffMount = (editor, monaco) => {
    if (!themeSet.current) {
      monaco.editor.defineTheme('atmos', THEME)
      monaco.editor.setTheme('atmos')
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
      const curVal = editorRef.current.getValue()
      if (curVal !== activeFile.content) {
        const pos = editorRef.current.getPosition()
        const scrollTop = editorRef.current.getScrollTop()
        
        const model = editorRef.current.getModel()
        if (model) {
          editorRef.current.executeEdits("collaboration", [
            {
              range: model.getFullModelRange(),
              text: activeFile.content || "",
              forceMoveMarkers: true
            }
          ])
        } else {
          editorRef.current.setValue(activeFile.content || '')
        }
        
        if (pos) {
          editorRef.current.setPosition(pos)
        }
        editorRef.current.setScrollTop(scrollTop)
      }
    }
  }, [activeFile?.content])

  const opts = {
    fontSize:          settings?.fontSize || 14,
    fontFamily:        `'${settings?.fontFamily || 'Consolas'}','Cascadia Code',monospace`,
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
    glyphMargin:       true,
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
                  theme="atmos"
                  language={EL[activeFile.ext] || 'plaintext'}
                  original={activeFile.originalContent || ''}
                  modified={activeFile.content || ''}
                  onMount={handleDiffMount}
                  options={opts}
                  loading={<div className={S.loading}>Loading diff…</div>}
                />
              : editorMode === 'preview'
                ? (
                    <div className={S.previewLayout}>
                      <div className={S.previewLeft}>
                        <Editor
                          key={activeFile.id}
                          height="100%"
                          theme="atmos"
                          language={EL[activeFile.ext] || 'plaintext'}
                          defaultValue={activeFile.content || ''}
                          onChange={handleChange}
                          onMount={handleMount}
                          options={opts}
                          loading={<div className={S.loading}>Loading editor…</div>}
                        />
                      </div>
                      <div className={S.previewRight}>
                        <PreviewPane file={activeFile} />
                      </div>
                    </div>
                  )
                : <Editor
                  key={activeFile.id}
                  height="100%"
                  theme="atmos"
                  language={EL[activeFile.ext] || 'plaintext'}
                  defaultValue={activeFile.content || ''}
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
  const cmdKey = isMac ? 'Cmd' : 'Ctrl';
  const shiftKey = 'Shift';

  const runtimes = [
    { tag: 'JS', name: 'JavaScript', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.05)', border: 'rgba(245, 158, 11, 0.15)' },
    { tag: 'TS', name: 'TypeScript', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.05)', border: 'rgba(59, 130, 246, 0.15)' },
    { tag: 'PY', name: 'Python 3', color: '#10b981', bg: 'rgba(16, 185, 129, 0.05)', border: 'rgba(16, 185, 129, 0.15)' },
    { tag: 'SH', name: 'Bash / Shell', color: '#84cc16', bg: 'rgba(132, 204, 22, 0.05)', border: 'rgba(132, 204, 22, 0.15)' },
    { tag: 'RB', name: 'Ruby', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.05)', border: 'rgba(239, 68, 68, 0.15)' },
    { tag: 'PHP', name: 'PHP', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.05)', border: 'rgba(139, 92, 246, 0.15)' },
    { tag: 'GO', name: 'Go', color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.05)', border: 'rgba(6, 182, 212, 0.15)' },
    { tag: 'RS', name: 'Rust', color: '#f97316', bg: 'rgba(249, 115, 22, 0.05)', border: 'rgba(249, 115, 22, 0.15)' },
    { tag: 'C', name: 'C', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.05)', border: 'rgba(148, 163, 184, 0.15)' },
    { tag: 'CPP', name: 'C++', color: '#ec4899', bg: 'rgba(236, 72, 153, 0.05)', border: 'rgba(236, 72, 153, 0.15)' },
    { tag: 'JV', name: 'Java', color: '#eab308', bg: 'rgba(234, 179, 8, 0.05)', border: 'rgba(234, 179, 8, 0.15)' },
  ];

  const shortcuts = [
    { label: 'Run file', keys: ['F5'] },
    { label: 'Save', keys: [cmdKey, 'S'] },
    { label: 'Command palette', keys: [cmdKey, 'Shift', 'P'] },
    { label: 'Toggle terminal', keys: [cmdKey, '`'] },
    { label: 'Toggle sidebar', keys: [cmdKey, 'Shift', 'E'] },
    { label: 'New file', keys: [cmdKey, 'N'] },
    { label: 'Git Sidebar', keys: [cmdKey, 'Shift', 'G'] },
    { label: 'Open Settings', keys: [cmdKey, ','] },
    { label: 'Atmos Notebooks', keys: [cmdKey, 'Shift', 'M'] },
  ];

  return (
    <div className="w-full h-full overflow-y-auto bg-transparent select-none flex flex-col">
      <div className="min-h-full flex flex-col items-center justify-center py-10 px-6 max-w-[580px] w-full mx-auto text-center gap-6">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center gap-3">
          <div className="p-4 rounded-[20px] bg-white/[0.02] border border-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_8px_32px_rgba(0,0,0,0.25)] backdrop-blur-md">
            <svg viewBox="0 0 24 24" fill="none" width="40" height="40" className="animate-logo-glow">
              <defs>
                <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="var(--ac-start)" />
                  <stop offset="50%" stopColor="var(--ac)" />
                  <stop offset="100%" stopColor="var(--ac-end)" />
                </linearGradient>
              </defs>
              <path d="M8 5 A 8.5 8.5 0 0 0 8 19" stroke="url(#logoGrad)" strokeWidth="2.2" strokeLinecap="round" />
              <path d="M16 5 A 8.5 8.5 0 0 1 16 19" stroke="url(#logoGrad)" strokeWidth="2.2" strokeLinecap="round" />
              <circle cx="12" cy="12" r="2.5" fill="url(#logoGrad)" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-medium tracking-tight text-white bg-gradient-to-r from-white via-white to-accent bg-clip-text text-transparent">Atmos IDE</h1>
            <p className="text-xs text-t2 font-normal tracking-wide mt-1">Hybrid Code Execution Environment</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-3 w-full mt-2">
          <button 
            onClick={() => window.api?.openFile()} 
            className="flex flex-col items-center gap-2 p-3.5 rounded border border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.04] hover:border-accent/20 hover:-translate-y-0.5 transition-all duration-200 group active:scale-[0.97]"
          >
            <div className="p-2 rounded bg-white/[0.03] text-accent group-hover:scale-105 transition-transform">
              <svg viewBox="0 0 24 24" width="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="12" y1="18" x2="12" y2="12" />
                <line x1="9" y1="15" x2="15" y2="15" />
              </svg>
            </div>
            <span className="text-[11.5px] font-medium text-t1">New File</span>
            <span className="text-[9px] font-mono text-t3 tracking-tight">{isMac ? '⌘' : 'Ctrl'}+N</span>
          </button>

          <button 
            onClick={() => window.api?.openFile()} 
            className="flex flex-col items-center gap-2 p-3.5 rounded border border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.04] hover:border-accent/20 hover:-translate-y-0.5 transition-all duration-200 group active:scale-[0.97]"
          >
            <div className="p-2 rounded bg-white/[0.03] text-yellow-500 group-hover:scale-105 transition-transform">
              <svg viewBox="0 0 24 24" width="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                <line x1="12" y1="11" x2="12" y2="17" />
                <line x1="9" y1="14" x2="15" y2="14" />
              </svg>
            </div>
            <span className="text-[11.5px] font-medium text-t1">Open File</span>
            <span className="text-[9px] font-mono text-t3 tracking-tight">{isMac ? '⌘' : 'Ctrl'}+O</span>
          </button>

          <button 
            onClick={() => window.api?.openFolder()} 
            className="flex flex-col items-center gap-2 p-3.5 rounded border border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.04] hover:border-accent/20 hover:-translate-y-0.5 transition-all duration-200 group active:scale-[0.97]"
          >
            <div className="p-2 rounded bg-white/[0.03] text-blue-500 group-hover:scale-105 transition-transform">
              <svg viewBox="0 0 24 24" width="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <span className="text-[11.5px] font-medium text-t1">Open Folder</span>
            <span className="text-[9px] font-mono text-t3 tracking-tight">{isMac ? '⌘' : 'Ctrl'}+Shift+O</span>
          </button>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-8 w-full mt-4 text-left">
          {/* Runtimes Section */}
          <div className="flex flex-col">
            <h3 className="text-[9.5px] font-medium uppercase tracking-widest text-t3 select-none mb-3">Supported Languages</h3>
            <div className="flex flex-wrap gap-2 pt-0.5">
              {runtimes.map(({ tag, name, color, bg, border }) => (
                <div 
                  key={tag} 
                  className="flex items-center gap-1.5 py-1 px-2.5 rounded border transition-all duration-150 cursor-default select-none hover:brightness-110"
                  style={{ borderColor: border, backgroundColor: bg }}
                  title={name}
                >
                  <span 
                    className="w-1.5 h-1.5 rounded-full" 
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-[10.5px] font-medium" style={{ color: color }}>{name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Shortcuts Section */}
          <div className="flex flex-col">
            <h3 className="text-[9.5px] font-medium uppercase tracking-widest text-t3 select-none mb-3">Shortcuts</h3>
            <div className="flex flex-col gap-1.5">
              {shortcuts.map(({ label, keys }) => (
                <div key={label} className="flex items-center justify-between py-1 px-1.5 rounded-lg hover:bg-white/[0.02] transition-colors group">
                  <span className="text-xs text-t2 font-medium group-hover:text-t1 transition-colors">{label}</span>
                  <div className="flex gap-1">
                    {keys.map(key => (
                      <kbd key={key} className="text-[9px] px-1.5 py-0.5 select-none">{key}</kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

function PreviewPane({ file }) {
  if (!file) return null;
  const ext = file.ext;
  const content = file.content || '';

  if (ext === 'html') {
    return (
      <iframe
        title="HTML Preview"
        srcDoc={content}
        sandbox="allow-scripts"
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          background: '#ffffff',
        }}
      />
    );
  }

  if (ext === 'md') {
    return (
      <div className={S.markdownBody}>
        {renderMarkdown(content)}
      </div>
    );
  }

  if (ext === 'css') {
    const cssDoc = `
      <html>
        <head>
          <style>${content}</style>
        </head>
        <body>
          <div class="container" style="padding: 20px; font-family: system-ui, sans-serif;">
            <h1 style="border-bottom: 1px solid #ccc; padding-bottom: 8px;">CSS Style Preview</h1>
            <p>This is a live preview of your CSS styles applied to some sample components.</p>
            <hr />
            
            <section style="margin-top: 20px;">
              <h2>Typography & Headers</h2>
              <h1>Heading 1</h1>
              <h2>Heading 2</h2>
              <h3>Heading 3</h3>
              <p>Paragraph text: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
              <a href="#">Sample Hyperlink</a>
            </section>
            
            <section style="margin-top: 20px;">
              <h2>Buttons & Interactive</h2>
              <button class="btn btn-primary" style="margin-right: 8px; padding: 6px 12px;">Primary Button</button>
              <button class="btn" style="padding: 6px 12px;">Secondary Button</button>
              <br/><br/>
              <input type="text" placeholder="Sample text input..." style="padding: 6px; width: 200px;" />
            </section>
            
            <section style="margin-top: 20px;">
              <h2>Cards & Containers</h2>
              <div class="card" style="border: 1px solid #ddd; padding: 16px; border-radius: 8px; max-width: 300px;">
                <h3>Card Component</h3>
                <p>Use card selectors to style this container structure.</p>
              </div>
            </section>
          </div>
        </body>
      </html>
    `;
    return (
      <iframe
        title="CSS Preview"
        srcDoc={cssDoc}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          background: '#ffffff',
        }}
      />
    );
  }

  return (
    <div className={S.previewUnsupported}>
      <div className={S.unsupportedInner}>
        <svg viewBox="0 0 24 24" width="36" fill="none" stroke="var(--t3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <h3>Live Preview Unsupported</h3>
        <p>Live preview is available for HTML, Markdown (.md), and CSS files.</p>
        <p className={S.fileDetails}>Current File: <code>{file.name}</code></p>
      </div>
    </div>
  );
}

function renderMarkdown(md) {
  if (!md) return null;
  const lines = md.split('\n');
  let insideCodeBlock = false;
  let codeBlockContent = [];
  let codeBlockLang = '';
  const elements = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.trim().startsWith('```')) {
      if (insideCodeBlock) {
        insideCodeBlock = false;
        elements.push(
          <pre key={`code-${i}`} className={S.mdCodeBlock}>
            <code className={codeBlockLang}>{codeBlockContent.join('\n')}</code>
          </pre>
        );
        codeBlockContent = [];
        codeBlockLang = '';
      } else {
        insideCodeBlock = true;
        codeBlockLang = line.trim().slice(3);
      }
      continue;
    }

    if (insideCodeBlock) {
      codeBlockContent.push(line);
      continue;
    }

    if (line.startsWith('# ')) {
      elements.push(<h1 key={i} className={S.mdH1}>{parseInline(line.slice(2))}</h1>);
      continue;
    }
    if (line.startsWith('## ')) {
      elements.push(<h2 key={i} className={S.mdH2}>{parseInline(line.slice(3))}</h2>);
      continue;
    }
    if (line.startsWith('### ')) {
      elements.push(<h3 key={i} className={S.mdH3}>{parseInline(line.slice(4))}</h3>);
      continue;
    }
    if (line.startsWith('#### ')) {
      elements.push(<h4 key={i} className={S.mdH4}>{parseInline(line.slice(5))}</h4>);
      continue;
    }

    if (line.trim() === '---' || line.trim() === '***') {
      elements.push(<hr key={i} className={S.mdHr} />);
      continue;
    }

    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      elements.push(<li key={i} className={S.mdLi}>{parseInline(line.trim().slice(2))}</li>);
      continue;
    }

    const numMatch = line.trim().match(/^(\d+)\.\s(.*)/);
    if (numMatch) {
      elements.push(<li key={i} className={S.mdLiNum}><span className={S.mdNum}>{numMatch[1]}.</span> {parseInline(numMatch[2])}</li>);
      continue;
    }

    if (line.trim() === '') {
      elements.push(<div key={i} style={{ height: '8px' }} />);
      continue;
    }

    if (line.startsWith('> ')) {
      elements.push(<blockquote key={i} className={S.mdBlockquote}>{parseInline(line.slice(2))}</blockquote>);
      continue;
    }

    elements.push(<p key={i} className={S.mdPara}>{parseInline(line)}</p>);
  }

  return elements;
}

function parseInline(text) {
  if (!text) return '';
  let parts = [text];

  const applyRegex = (regex, replacer) => {
    let nextParts = [];
    for (let p of parts) {
      if (typeof p !== 'string') {
        nextParts.push(p);
        continue;
      }
      let lastIndex = 0;
      let match;
      while ((match = regex.exec(p)) !== null) {
        if (match.index > lastIndex) {
          nextParts.push(p.slice(lastIndex, match.index));
        }
        nextParts.push(replacer(match));
        lastIndex = regex.lastIndex;
      }
      if (lastIndex < p.length) {
        nextParts.push(p.slice(lastIndex));
      }
    }
    parts = nextParts;
  };

  applyRegex(/\[([^\]]+)\]\(([^)]+)\)/g, (match) => (
    <a href={match[2]} target="_blank" rel="noopener noreferrer" className={S.mdLink}>
      {match[1]}
    </a>
  ));

  applyRegex(/\*\*([^*]+)\*\*/g, (match) => (
    <strong className={S.mdBold}>{match[1]}</strong>
  ));

  applyRegex(/\*([^*]+)\*/g, (match) => (
    <em className={S.mdItalic}>{match[1]}</em>
  ));

  applyRegex(/`([^`]+)`/g, (match) => (
    <code className={S.mdInlineCode}>{match[1]}</code>
  ));

  return parts;
}
