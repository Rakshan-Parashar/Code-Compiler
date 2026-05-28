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
  editorMode
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

  const handleMount = (editor, monaco) => {
    editorRef.current  = editor
    monacoRef.current  = monaco
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
  const mod = isMac ? '⌘' : 'Ctrl+';
  const shift = isMac ? '⇧' : 'Shift+';

  return (
    <div className={S.welcome}>
      <div className={S.wInner}>
        <div className={S.wLogo}>
          <svg viewBox="0 0 60 60" fill="none" width="52">
            <circle cx="30" cy="30" r="22" stroke="var(--ac)" strokeWidth="3.5" fill="var(--acd)" style={{ filter: 'drop-shadow(0 0 12px var(--ac))' }} />
            <path d="M30 18v24M18 30h24" stroke="var(--ac)" strokeWidth="4.5" strokeLinecap="round" />
          </svg>
        </div>
        <h1 className={S.wTitle}>Atmos IDE</h1>
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
            {[['JS','JavaScript','#f7df1e'],['TS','TypeScript','#3178c6'],['PY','Python 3','#3776ab'],['SH','Bash / Shell','#89e051'],['RB','Ruby','#cc342d'],['PHP','PHP','#7477af'],['GO','Go','#79d4fd'],['RS','Rust','#dea584'],['C','C','#555555'],['CPP','C++','#f34b7d'],['JV','Java','#f89820']].map(([tag,name,c]) => (
              <div key={tag} className={S.rt}><span className={S.rtTag} style={{ color:c, borderColor:`${c}40` }}>{tag}</span><span>{name}</span></div>
            ))}
          </div>
          <div className={S.wSection}>
            <h3>Shortcuts</h3>
            {[[isMac ? 'F5' : 'F5','Run file'],[`${mod}S`,'Save'],[`${mod}${shift}P`,'Command palette'],[`${mod}\``,'Toggle terminal'],[`${mod}${shift}E`,'Toggle sidebar'],[`${mod}N`,'New file'],[`${mod}${shift}G`,'Git Sidebar'],[`${mod},`,'Open Settings'],[`${mod}${shift}M`,'Atmos Notebooks']].map(([k,l]) => (
              <div key={k} className={S.sc}><kbd className={S.kbd}>{k}</kbd><span>{l}</span></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
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
