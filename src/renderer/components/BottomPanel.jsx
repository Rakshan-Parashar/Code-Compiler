import React, { useRef, useEffect, useState } from 'react'
import S from './BottomPanel.module.css'

export default function BottomPanel({ height, activeTab, onTabChange, lines, running, canRun, rootFolderPath, onRun, onStop, onClear }) {
  return (
    <div className={S.panel} style={{ height }}>
      <div className={S.bar}>
        <div className={S.tabs}>
          {[['output','Output'],['terminal','Terminal']].map(([id, label]) => (
            <button key={id} className={`${S.tab} ${activeTab === id ? S.tabAct : ''}`} onClick={() => onTabChange(id)}>
              {id === 'terminal' && (
                <svg viewBox="0 0 14 14" width="11" fill="none">
                  <path d="M2 4l4 3-4 3M7 10h5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
              {label}
            </button>
          ))}
        </div>
        <div className={S.actions}>
          {activeTab === 'output' && (
            running
              ? <button className={S.stopBtn} onClick={onStop}>■ Stop</button>
              : <button className={S.runBtn} onClick={onRun} disabled={!canRun}>▶ Run</button>
          )}
          {activeTab === 'output' && (
            <button className={S.iconBtn} onClick={onClear} title="Clear output">
              <svg viewBox="0 0 14 14" width="12" fill="none">
                <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
            </button>
          )}
          <span className={`${S.dot} ${running ? S.dotRun : ''}`} />
        </div>
      </div>

      <div className={S.body}>
        {activeTab === 'output'   && <OutputPane lines={lines} running={running} />}
        {activeTab === 'terminal' && <TerminalPane rootFolderPath={rootFolderPath} />}
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

/* ── xterm.js Terminal pane ── */
function TerminalPane({ rootFolderPath }) {
  const containerRef = useRef()
  const termRef      = useRef(null)
  const fitRef       = useRef(null)
  const [status, setStatus] = useState('init')

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

        // Try real PTY
        const res = await window.api?.ptyCreate(rootFolderPath)
        if (dead) return

        if (res?.ok) {
          setStatus('ready')
          const u1 = window.api.onPtyData(d  => term.write(d))
          const u2 = window.api.onPtyExit(code => {
            term.write(`\r\n\x1b[33m[Process exited: ${code}]\x1b[0m\r\n`)
            setStatus('exited')
          })
          term.onData(d => window.api.ptyWrite(d))
          term.onResize(({ cols, rows }) => window.api.ptyResize(cols, rows))
          return () => { u1(); u2() }
        } else {
          // Fallback simulated shell
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
      window.api?.ptyKill()
    }
  }, [rootFolderPath])

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
