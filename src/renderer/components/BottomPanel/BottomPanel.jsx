import React, { useRef, useEffect, useState } from 'react'
import S from './BottomPanel.module.css'

export default function BottomPanel({
  height,
  activeTab,
  onTabChange,
  lines,
  running,
  canRun,
  rootFolderPath,
  onRun,
  onStop,
  onClear,
  lintErrors,
  openFiles,
  activeFile,
  panelMaximized,
  onToggleMaximize,
  onClosePanel,
  onJumpToProblem
}) {
  const [splitTerminal, setSplitTerminal] = useState(false)
  const [debugHistory, setDebugHistory] = useState([])

  useEffect(() => {
    const handleAction = (e) => {
      if (e.detail === 'splitTerminal') {
        setSplitTerminal(s => !s)
      }
    }
    window.addEventListener('editor-action', handleAction)
    return () => window.removeEventListener('editor-action', handleAction)
  }, [])

  const handleSplitToggle = () => {
    setSplitTerminal(s => !s)
  }

  const handleClearAction = () => {
    if (activeTab === 'output' || activeTab === 'terminal') {
      onClear()
    } else if (activeTab === 'debug') {
      setDebugHistory([])
    }
  }

  const totalProblems = Object.values(lintErrors || {}).reduce(
    (sum, errs) => sum + (errs?.length || 0),
    0
  )

  const tabs = [
    ['problems', 'Problems'],
    ['output', 'Output'],
    ['debug', 'Debug Console'],
    ['terminal', 'Terminal'],
    ['system', 'System Monitor']
  ]

  const isWin = navigator.platform.includes('Win')

  return (
    <div className={S.panel} style={{ height }}>
      <div className={S.bar}>
        <div className={S.tabs}>
          {tabs.map(([id, label]) => (
            <button
              key={id}
              className={`${S.tab} ${activeTab === id ? S.tabAct : ''}`}
              onClick={() => onTabChange(id)}
            >
              {id === 'terminal' && (
                <svg viewBox="0 0 14 14" width="11" fill="none" style={{ marginRight: '4px' }}>
                  <path d="M2 4l4 3-4 3M7 10h5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
              {label}
              {id === 'problems' && totalProblems > 0 && (
                <span className={S.badge}>{totalProblems}</span>
              )}
            </button>
          ))}
        </div>
        <div className={S.actions}>
          {activeTab === 'output' && (
            running
              ? <button className={S.stopBtn} onClick={onStop}>■ Stop</button>
              : <button className={S.runBtn} onClick={onRun} disabled={!canRun}>▶ Run</button>
          )}

          {activeTab === 'terminal' && (
            <>
              <select className={S.shellSelect} defaultValue="default">
                <option value="default">{isWin ? 'powershell' : 'bash'}</option>
                {splitTerminal && <option value="split-term">{isWin ? 'powershell' : 'bash'} (split)</option>}
              </select>

              {totalProblems > 0 && (
                <button className={S.iconBtn} onClick={() => onTabChange('problems')} title={`${totalProblems} Problems detected`} style={{ color: '#ef4444' }}>
                  <svg viewBox="0 0 16 16" width="12" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M8 2L1 14h14L8 2zM8 6v4M8 12h.01" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              )}

              <button className={S.iconBtn} onClick={handleSplitToggle} title="New Terminal (Split)">
                <svg viewBox="0 0 16 16" width="12" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M8 3v10M3 8h10" strokeLinecap="round"/>
                </svg>
              </button>

              <button className={`${S.iconBtn} ${splitTerminal ? S.iconBtnAct : ''}`} onClick={handleSplitToggle} title="Split Terminal">
                <svg viewBox="0 0 16 16" width="12" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="2" y="2" width="12" height="12" rx="1.5" />
                  <path d="M8 2v12" />
                </svg>
              </button>
            </>
          )}

          {(activeTab === 'output' || activeTab === 'terminal' || activeTab === 'debug') && (
            <button className={S.iconBtn} onClick={handleClearAction} title="Clear">
              <svg viewBox="0 0 14 14" width="12" fill="none">
                <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
            </button>
          )}

          <button className={S.iconBtn} onClick={onToggleMaximize} title={panelMaximized ? "Restore panel size" : "Maximize panel size"}>
            {panelMaximized ? (
              <svg viewBox="0 0 16 16" width="12" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M3 5l5 5 5-5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            ) : (
              <svg viewBox="0 0 16 16" width="12" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M3 11l5-5 5 5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>

          <button className={S.iconBtn} onClick={onClosePanel} title="Close Panel">
            <svg viewBox="0 0 16 16" width="12" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 3l10 10M13 3L3 13" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      </div>

      <div className={S.body}>
        {activeTab === 'problems' && (
          <ProblemsPane
            lintErrors={lintErrors}
            openFiles={openFiles}
            onJumpToProblem={onJumpToProblem}
          />
        )}
        {activeTab === 'output' && (
          <OutputPane lines={lines} running={running} />
        )}
        {activeTab === 'debug' && (
          <DebugConsolePane
            history={debugHistory}
            onAddHistory={h => setDebugHistory(p => [...p, h])}
            onClearHistory={() => setDebugHistory([])}
          />
        )}
        {activeTab === 'terminal' && (
          <div style={{ display: 'flex', width: '100%', height: '100%', gap: '8px' }}>
            <div style={{ flex: 1, height: '100%', minWidth: 0 }}>
              <TerminalPane rootFolderPath={rootFolderPath} terminalId="default" />
            </div>
            {splitTerminal && (
              <div style={{ flex: 1, height: '100%', minWidth: 0, borderLeft: '1px solid var(--b1)', paddingLeft: '8px' }}>
                <TerminalPane rootFolderPath={rootFolderPath} terminalId="split-term" />
              </div>
            )}
          </div>
        )}
        {activeTab === 'system' && (
          <SystemPane />
        )}
      </div>
    </div>
  )
}

/* ── Problems pane ── */
function ProblemsPane({ lintErrors, openFiles, onJumpToProblem }) {
  const filesWithProblems = openFiles.filter(f => lintErrors[f.id] && lintErrors[f.id].length > 0)

  if (filesWithProblems.length === 0) {
    return (
      <div className={S.problemsWrap}>
        <div className={S.empty}>
          <span>No problems have been detected in the workspace.</span>
        </div>
      </div>
    )
  }

  return (
    <div className={S.problemsWrap}>
      <div className={S.problemsList}>
        {filesWithProblems.map(file => (
          <div key={file.id}>
            <div className={S.probFile} style={{ fontWeight: 600, padding: '4px 8px', color: 'var(--t2)' }}>
              {file.name} <span style={{ opacity: 0.5, fontSize: '11px', fontWeight: 400 }}>{file.path}</span>
            </div>
            {lintErrors[file.id].map((err, idx) => {
              const sevClass = err.sev === 'error' ? S.probError : (err.sev === 'warning' ? S.probWarning : S.probInfo)
              const iconColor = err.sev === 'error' ? '#ef4444' : (err.sev === 'warning' ? '#f59e0b' : '#3b82f6')
              return (
                <div key={idx} className={`${S.problemItem} ${sevClass}`} onClick={() => onJumpToProblem(file.path, err.line)}>
                  <span className={S.probIcon} style={{ color: iconColor }}>
                    {err.sev === 'error' ? '●' : '▲'}
                  </span>
                  <div className={S.probText}>
                    <span className={S.probMsg}>{err.msg}</span>
                    <span className={S.probLoc}>[{err.line}, {err.col}]</span>
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Output pane ── */
function OutputPane({ lines, running }) {
  const ref = useRef()
  useEffect(() => { if (ref.current) ref.current.scrollTop = ref.current.scrollHeight }, [lines])
  return (
    <div ref={ref} className={S.output}>
      {!lines.length && !running && (
        <span className={S.empty}>Press <kbd>F5</kbd> or click ▶ Run to execute your file</span>
      )}
      {lines.map((l, i) => <Line key={i} line={l} />)}
      {running && (
        <div className={S.spinner}>
          <span className={S.spinDot} />
          <span>Running…</span>
        </div>
      )}
    </div>
  )
}

function Line({ line }) {
  const cls = { out: S.stdout, err: S.stderr, sys: S.system }[line.t] || S.stdout
  return <pre className={`${S.line} ${cls}`} dangerouslySetInnerHTML={{ __html: ansi(line.d) }} />
}

function ansi(text) {
  if (!text) return ''
  const s = text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
  return s
    .replace(/\x1b\[0m/g,  '</span>')
    .replace(/\x1b\[1m/g,  '<span style="font-weight:700">')
    .replace(/\x1b\[2m/g,  '<span style="opacity:.5">')
    .replace(/\x1b\[3m/g,  '<span style="font-style:italic">')
    .replace(/\x1b\[31m/g, '<span style="color:#ef4444">')
    .replace(/\x1b\[32m/g, '<span style="color:#22c55e">')
    .replace(/\x1b\[33m/g, '<span style="color:#f59e0b">')
    .replace(/\x1b\[34m/g, '<span style="color:#3b82f6">')
    .replace(/\x1b\[36m/g, '<span style="color:#06b6d4">')
    .replace(/\x1b\[[\d;]+m/g, '')
}

/* ── Debug Console pane ── */
function DebugConsolePane({ history, onAddHistory, onClearHistory }) {
  const [val, setVal] = useState('')
  const scrollRef = useRef()

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [history])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      const trimmed = val.trim()
      if (!trimmed) return
      setVal('')
      onAddHistory({ type: 'in', text: trimmed })

      if (trimmed.toLowerCase() === 'clear') {
        onClearHistory()
        return
      }
      if (trimmed.toLowerCase() === 'help') {
        onAddHistory({ type: 'sys', text: 'Atmos JS Console Help:\n- Type any JS expression to evaluate (e.g. `2 + 2` or `Math.random()`)\n- Type `clear` to clear the history logs\n- Type `help` to display this message' })
        return
      }

      try {
        const result = eval(trimmed)
        let output = ''
        if (result === undefined) output = 'undefined'
        else if (result === null) output = 'null'
        else if (typeof result === 'object') output = JSON.stringify(result, null, 2)
        else output = result.toString()
        onAddHistory({ type: 'out', text: output })
      } catch (err) {
        onAddHistory({ type: 'err', text: err.message })
      }
    }
  }

  return (
    <div className={S.debugWrap}>
      <div ref={scrollRef} className={S.debugLogs}>
        {history.map((h, i) => {
          const typeClass = h.type === 'in' ? S.debugIn : (h.type === 'out' ? S.debugOut : (h.type === 'err' ? S.debugErr : S.debugSys))
          const prefix = h.type === 'in' ? '› ' : ''
          return (
            <pre key={i} className={`${S.debugLogLine} ${typeClass}`}>
              {prefix}{h.text}
            </pre>
          )
        })}
        {history.length === 0 && (
          <div className={S.empty}>
            <span>JavaScript Debug Console</span>
            <span style={{ opacity: 0.5, fontSize: '11px' }}>Type any JS expression or `help` to begin</span>
          </div>
        )}
      </div>
      <div className={S.debugInputLine}>
        <span className={S.debugPrompt}>›</span>
        <input
          type="text"
          className={S.debugInput}
          value={val}
          onChange={e => setVal(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type JS expression here..."
        />
      </div>
    </div>
  )
}

/* ── xterm.js Terminal pane ── */
function TerminalPane({ rootFolderPath, terminalId = 'default' }) {
  const containerRef = useRef()
  const termRef      = useRef(null)
  const fitRef       = useRef(null)
  const [status, setStatus] = useState('init')

  useEffect(() => {
    const handleClear = () => {
      if (termRef.current) {
        termRef.current.clear()
        window.api?.ptyWrite(terminalId, '\x0c')
      }
    }
    window.addEventListener('terminal-clear', handleClear)
    return () => window.removeEventListener('terminal-clear', handleClear)
  }, [terminalId])

  useEffect(() => {
    let dead = false

    async function boot() {
      try {
        const [{ Terminal }, { FitAddon }, { WebLinksAddon }] = await Promise.all([
          import('@xterm/xterm'),
          import('@xterm/addon-fit'),
          import('@xterm/addon-web-links'),
        ])
        await import('@xterm/xterm/css/xterm.css')
        if (dead || !containerRef.current) return

        const term = new Terminal({
          theme: {
            background:'#0d0d0f', foreground:'#e0e0e8',
            cursor:'#7C3AED', cursorAccent:'#0d0d0f',
            selectionBackground:'rgba(124,58,237,.3)',
            black:'#1c1c23',   brightBlack:'#3a3a50',
            red:'#ef4444',     brightRed:'#f87171',
            green:'#22c55e',   brightGreen:'#4ade80',
            yellow:'#f59e0b',  brightYellow:'#fbbf24',
            blue:'#3b82f6',    brightBlue:'#60a5fa',
            magenta:'#a855f7', brightMagenta:'#c084fc',
            cyan:'#06b6d4',    brightCyan:'#22d3ee',
            white:'#e0e0e8',   brightWhite:'#f0f0f6',
          },
          fontFamily:"'JetBrains Mono','Cascadia Code','Fira Code',monospace",
          fontSize: 13, lineHeight: 1.5,
          cursorBlink: true, cursorStyle: 'bar',
          allowTransparency: true, scrollback: 5000,
        })

        const fit  = new FitAddon()
        term.loadAddon(fit)
        term.loadAddon(new WebLinksAddon())
        term.open(containerRef.current)
        setTimeout(() => fit.fit(), 50)

        termRef.current = term
        fitRef.current  = fit

        const res = await window.api?.ptyCreate(terminalId, rootFolderPath)
        if (dead) return

        if (res?.ok) {
          setStatus('ready')
          const u1 = window.api.onPtyData(terminalId, d => term.write(d))
          const u2 = window.api.onPtyExit(terminalId, code => {
            term.write(`\r\n\x1b[33m[Process exited: ${code}]\x1b[0m\r\n`)
            setStatus('exited')
          })
          term.onData(d => window.api.ptyWrite(terminalId, d))
          term.onResize(({ cols, rows }) => window.api.ptyResize(terminalId, cols, rows))
          return () => { u1(); u2() }
        } else {
          setStatus('fallback')
          term.writeln('\x1b[33mℹ node-pty not available — using fallback shell\x1b[0m')
          term.writeln('\x1b[2mInstall node-pty and rebuild for full terminal support\x1b[0m\r\n')
          term.write('\x1b[32m$\x1b[0m ')
          let buf = ''
          term.onData(data => {
            if (data === '\r') {
              term.write('\r\n')
              runFallback(buf.trim(), term)
              buf = ''
              term.write('\x1b[32m$\x1b[0m ')
            } else if (data === '\u007F') {
              if (buf.length) { buf = buf.slice(0,-1); term.write('\b \b') }
            } else {
              buf += data; term.write(data)
            }
          })
        }
      } catch (e) {
        setStatus('error')
        console.error('Terminal boot error', e)
      }
    }

    boot()

    const ro = new ResizeObserver(() => { if (fitRef.current) try { fitRef.current.fit() } catch {} })
    if (containerRef.current) ro.observe(containerRef.current)

    return () => {
      dead = true
      ro.disconnect()
      if (termRef.current) { termRef.current.dispose(); termRef.current = null }
      window.api?.ptyKill(terminalId)
    }
  }, [rootFolderPath, terminalId])

  return (
    <div className={S.termWrap}>
      {status === 'init' && <div className={S.termMsg}>Connecting…</div>}
      {status === 'error' && <div className={S.termMsg} style={{color:'var(--red)'}}>Terminal failed to load</div>}
      <div ref={containerRef} className={S.xterm} style={{ visibility: status === 'init' ? 'hidden' : 'visible' }} />
    </div>
  )
}

function runFallback(cmd, term) {
  if (!cmd) return
  const [c, ...args] = cmd.split(' ')
  const handlers = {
    echo:   () => term.writeln(args.join(' ')),
    clear:  () => term.clear(),
    date:   () => term.writeln(new Date().toString()),
    pwd:    () => term.writeln(window.location?.href || '/'),
    help:   () => term.writeln('Commands: echo, clear, date, pwd, help\r\nRun JS/Python via ▶ Run button'),
    node:   () => term.writeln('\x1b[33mRun .js files via the ▶ Run button (F5)\x1b[0m'),
    python3:() => term.writeln('\x1b[33mRun .py files via the ▶ Run button (F5)\x1b[0m'),
    python: () => term.writeln('\x1b[33mRun .py files via the ▶ Run button (F5)\x1b[0m'),
    ls:     () => term.writeln('\x1b[2m(filesystem not available in fallback mode)\x1b[0m'),
  }
  if (handlers[c]) handlers[c]()
  else term.writeln(`\x1b[31mcommand not found: ${c}\x1b[0m`)
}

/* ── System Monitor pane ── */
function SystemPane() {
  const [sysInfo, setSysInfo] = useState(null)
  const [envVars, setEnvVars] = useState({})
  const [filter, setFilter] = useState('')
  const [loading, setLoading] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [info, envs] = await Promise.all([
        window.api?.sysInfo(),
        window.api?.sysEnv()
      ])
      setSysInfo(info)
      setEnvVars(envs || {})
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const totalMem = sysInfo?.memory?.total || 1
  const freeMem = sysInfo?.memory?.free || 0
  const usedMem = totalMem - freeMem
  const memPct = Math.round((usedMem / totalMem) * 100)
  const formatGB = (bytes) => (bytes / (1024 * 1024 * 1024)).toFixed(2)

  const filteredKeys = Object.keys(envVars).filter(k => 
    k.toLowerCase().includes(filter.toLowerCase()) || 
    envVars[k].toLowerCase().includes(filter.toLowerCase())
  ).sort()

  return (
    <div className={S.sysWrap}>
      <div className={S.sysDashboard}>
        <div className={S.sysCard}>
          <span className={S.sysTitle}>Operating System</span>
          <span className={S.sysValue}>
            {sysInfo?.platform === 'win32' ? 'Windows' : sysInfo?.platform === 'darwin' ? 'macOS' : 'Linux'} ({sysInfo?.arch})
          </span>
          <span style={{ fontSize: '11px', opacity: 0.6 }}>Node: {sysInfo?.node} | Shell: {sysInfo?.shell}</span>
        </div>

        <div className={S.sysCard}>
          <span className={S.sysTitle}>CPU Cores</span>
          <span className={S.sysValue}>{sysInfo?.cpus} Logicals</span>
          <span style={{ fontSize: '11px', opacity: 0.6 }}>Architecture: {sysInfo?.arch}</span>
        </div>

        <div className={S.sysCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className={S.sysTitle}>System Memory (RAM)</span>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--ac)' }}>{memPct}% Used</span>
          </div>
          <span className={S.sysValue}>{formatGB(usedMem)} GB / {formatGB(totalMem)} GB</span>
          <div className={S.sysBarOuter}>
            <div className={S.sysBarInner} style={{ width: `${memPct}%` }} />
          </div>
        </div>
      </div>

      <div className={S.envSection}>
        <div className={S.envHeader}>
          <span className={S.envTitle}>Process Environment Variables</span>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Search variables..."
              className={S.envFilterInput}
              value={filter}
              onChange={e => setFilter(e.target.value)}
            />
            <button className={S.refreshBtn} onClick={fetchData} disabled={loading} title="Scan system stats">
              <svg viewBox="0 0 16 16" width="10" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ animation: loading ? 'spin 1s linear' : 'none' }}>
                <path d="M1.5 8a6.5 6.5 0 0110-5.5L14 5m.5 3a6.5 6.5 0 01-10 5.5L2 11" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Refresh
            </button>
          </div>
        </div>
        <div className={S.envTableWrap}>
          {filteredKeys.length === 0 ? (
            <div className={S.empty} style={{ height: '100px' }}>
              <span>No environment variables match your search</span>
            </div>
          ) : (
            <table className={S.envTable}>
              <thead>
                <tr>
                  <th className={S.envTh} style={{ width: '40%' }}>Variable Key</th>
                  <th className={S.envTh} style={{ width: '60%' }}>Value</th>
                </tr>
              </thead>
              <tbody>
                {filteredKeys.map(k => (
                  <tr key={k}>
                    <td className={S.envTd}><span className={S.envKey}>{k}</span></td>
                    <td className={S.envTd} title={envVars[k]}><span className={S.envVal}>{envVars[k]}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
