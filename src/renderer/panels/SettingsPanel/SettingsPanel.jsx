import React, { useState } from 'react'
import S from '../Panel.module.css'

const FONTS   = ['JetBrains Mono','Fira Code','Cascadia Code','Consolas','Source Code Pro','Monaco','Menlo']
const ACCENTS = ['#7C3AED','#2563eb','#0891b2','#059669','#d97706','#dc2626','#db2777','#9333ea']

export default function SettingsPanel({ settings, onUpdate, onClose, notify }) {
  const [tab, setTab] = useState('editor')

  const set = (key, val) => onUpdate({ [key]: val })

  const tabs = [
    { id:'editor',    label:'Editor' },
    { id:'appearance',label:'Appearance' },
    { id:'terminal',  label:'Terminal' },
    { id:'autosave',  label:'Auto Save' },
    { id:'keybinds',  label:'Keybindings' },
    { id:'ai',        label:'AI Settings' },
  ]

  return (
    <div className={S.backdrop} onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className={S.panel} style={{ width: 700, maxHeight: '80vh' }}>
        <div className={S.hdr}>
          <div className={S.hdrLeft}>
            <svg viewBox="0 0 16 16" width="15" fill="none"><circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.2"/><path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.3 3.3l1.4 1.4M11.3 11.3l1.4 1.4M3.3 12.7l1.4-1.4M11.3 4.7l1.4-1.4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
            <span>Settings</span>
          </div>
          <button className={S.closeBtn} onClick={onClose}>×</button>
        </div>

        <div className={S.body}>
          <div className={S.sidebar}>
            {tabs.map(t => (
              <button key={t.id} className={`${S.navItem} ${tab === t.id ? S.navAct : ''}`} onClick={() => setTab(t.id)}>
                {t.label}
              </button>
            ))}
          </div>

          <div className={S.content}>
            {tab === 'editor' && (
              <div className={S.section}>
                <h3 className={S.sectionTitle}>Editor</h3>

                <Row label="Font Size" hint="Editor font size in pixels">
                  <input type="number" min="10" max="32" value={settings.fontSize} onChange={e => set('fontSize', +e.target.value)} className={S.numInput} />
                </Row>

                <Row label="Font Family" hint="Monospace font for the editor">
                  <select value={settings.fontFamily} onChange={e => set('fontFamily', e.target.value)} className={S.select}>
                    {FONTS.map(f => <option key={f}>{f}</option>)}
                  </select>
                </Row>

                <Row label="Tab Size" hint="Number of spaces per tab">
                  <select value={settings.tabSize} onChange={e => set('tabSize', +e.target.value)} className={S.select}>
                    {[2,4,8].map(n => <option key={n} value={n}>{n} spaces</option>)}
                  </select>
                </Row>

                <Row label="Word Wrap" hint="Wrap long lines in the editor">
                  <Toggle val={settings.wordWrap} onChange={v => set('wordWrap', v)} />
                </Row>

                <Row label="Minimap" hint="Show code overview minimap">
                  <Toggle val={settings.minimap} onChange={v => set('minimap', v)} />
                </Row>

                <Row label="Line Numbers" hint="Show line numbers in gutter">
                  <Toggle val={settings.lineNumbers} onChange={v => set('lineNumbers', v)} />
                </Row>

                <Row label="Indent Guides" hint="Show indentation guide lines">
                  <Toggle val={settings.showIndentGuides} onChange={v => set('showIndentGuides', v)} />
                </Row>

                <Row label="Bracket Pair Colors" hint="Colorize matching brackets">
                  <Toggle val={settings.bracketPairColors} onChange={v => set('bracketPairColors', v)} />
                </Row>

                <Row label="Sticky Scroll" hint="Sticky function/class headers while scrolling">
                  <Toggle val={settings.stickyScroll} onChange={v => set('stickyScroll', v)} />
                </Row>

                <Row label="Smooth Scrolling" hint="Animate editor scrolling">
                  <Toggle val={settings.smoothScrolling} onChange={v => set('smoothScrolling', v)} />
                </Row>

                <Row label="Format on Save" hint="Auto-format code when saving">
                  <Toggle val={settings.formatOnSave} onChange={v => set('formatOnSave', v)} />
                </Row>

                <Row label="Render Whitespace" hint="When to render whitespace characters">
                  <select value={settings.renderWhitespace} onChange={e => set('renderWhitespace', e.target.value)} className={S.select}>
                    {['none','boundary','selection','all'].map(o => <option key={o}>{o}</option>)}
                  </select>
                </Row>
              </div>
            )}

            {tab === 'appearance' && (
              <div className={S.section}>
                <h3 className={S.sectionTitle}>Appearance</h3>

                <Row label="Accent Color" hint="Primary UI color">
                  <div className={S.colorGrid}>
                    {ACCENTS.map(c => (
                      <button key={c} className={`${S.colorSwatch} ${settings.accentColor === c ? S.colorActive : ''}`}
                        style={{ background: c }} onClick={() => set('accentColor', c)}>
                        {settings.accentColor === c && <span>✓</span>}
                      </button>
                    ))}
                    <input type="color" value={settings.accentColor} onChange={e => set('accentColor', e.target.value)}
                      className={S.colorPicker} title="Custom color" />
                  </div>
                </Row>

                <div className={S.previewBox} style={{ '--ac': settings.accentColor, '--acl': settings.accentColor }}>
                  <div className={S.previewBar} style={{ background: settings.accentColor }}>
                    <span>⚡ Atmos IDE Preview</span>
                  </div>
                  <div className={S.previewBody}>
                    <div className={S.previewLine} style={{ color: '#c792ea' }}>function</div>
                    <div className={S.previewLine} style={{ color: '#82aaff' }}>  helloWorld</div>
                    <div className={S.previewLine} style={{ color: '#a8ff78' }}>    "Atmos IDE"</div>
                  </div>
                </div>
              </div>
            )}

            {tab === 'terminal' && (
              <div className={S.section}>
                <h3 className={S.sectionTitle}>Terminal</h3>
                <Row label="Font Size" hint="Terminal font size in pixels">
                  <input type="number" min="10" max="24" value={settings.terminalFontSize} onChange={e => set('terminalFontSize', +e.target.value)} className={S.numInput} />
                </Row>
                <div className={S.infoBox}>
                  <b>Full terminal support</b> requires <code>node-pty</code>.<br/>
                  Run <code>npm install node-pty</code> then <code>npm run install:native</code> after installation.
                  Without it, a fallback shell is used.
                </div>
              </div>
            )}

            {tab === 'autosave' && (
              <div className={S.section}>
                <h3 className={S.sectionTitle}>Auto Save</h3>
                <Row label="Enable Auto Save" hint="Automatically save files after changes">
                  <Toggle val={settings.autoSave} onChange={v => set('autoSave', v)} />
                </Row>
                <Row label="Delay (ms)" hint="Milliseconds to wait before auto-saving">
                  <input type="number" min="300" max="10000" step="100" value={settings.autoSaveDelay}
                    onChange={e => set('autoSaveDelay', +e.target.value)} className={S.numInput}
                    disabled={!settings.autoSave} />
                </Row>
              </div>
            )}

            {tab === 'keybinds' && (
              <div className={S.section}>
                <h3 className={S.sectionTitle}>Keyboard Shortcuts</h3>
                <div className={S.kbTable}>
                  {(() => {
                    const isMac = typeof navigator !== 'undefined' && navigator.userAgent.includes('Mac');
                    return [
                      ['Run File',            'F5'],
                      ['Save',                isMac ? '⌘ S' : 'Ctrl + S'],
                      ['Save As',             isMac ? '⌘ ⇧ S' : 'Ctrl + Shift + S'],
                      ['Open File',           isMac ? '⌘ O' : 'Ctrl + O'],
                      ['New File',            isMac ? '⌘ N' : 'Ctrl + N'],
                      ['Command Palette',     isMac ? '⌘ ⇧ P' : 'Ctrl + Shift + P'],
                      ['Toggle Sidebar',      isMac ? '⌘ ⇧ E' : 'Ctrl + Shift + E'],
                      ['Toggle Panel',        isMac ? '⌘ `' : 'Ctrl + `'],
                      ['Toggle Notebooks',    isMac ? '⌘ ⇧ M' : 'Ctrl + Shift + M'],
                      ['Toggle Settings',     isMac ? '⌘ ,' : 'Ctrl + ,'],
                      ['Focus Git Sidebar',   isMac ? '⌘ ⇧ G' : 'Ctrl + Shift + G'],
                      ['Close Tab',           'Middle Click'],
                    ].map(([action, keys]) => (
                      <div key={action} className={S.kbRow}>
                        <span className={S.kbAction}>{action}</span>
                        <kbd className={S.kbKey}>{keys}</kbd>
                      </div>
                    ))
                  })()}
                </div>
              </div>
            )}

            {tab === 'ai' && (
              <div className={S.section}>
                <h3 className={S.sectionTitle}>AI Settings</h3>
                
                <Row label="AI Provider" hint="Choose between local Ollama and Google Gemini">
                  <select value={settings.aiProvider || 'ollama'} onChange={e => set('aiProvider', e.target.value)} className={S.select}>
                    <option value="ollama">Local Ollama (Offline)</option>
                    <option value="gemini">Google Gemini (Cloud)</option>
                  </select>
                </Row>

                {settings.aiProvider === 'gemini' ? (
                  <Row label="Gemini API Key" hint="Used if no .env key is found">
                    <input 
                      type="password" 
                      value={settings.geminiApiKey || ''} 
                      onChange={e => set('geminiApiKey', e.target.value)} 
                      placeholder="Paste your API key here..." 
                      className={S.numInput} 
                      style={{ width: '100%', minWidth: 200 }}
                    />
                  </Row>
                ) : (
                  <Row label="Ollama Model" hint="Name of the model running locally">
                    <input 
                      type="text" 
                      value={settings.ollamaModel || 'codellama'} 
                      onChange={e => set('ollamaModel', e.target.value)} 
                      placeholder="e.g. codellama, llama3, mistral" 
                      className={S.numInput}
                      style={{ width: '100%', minWidth: 200 }}
                    />
                  </Row>
                )}
              </div>
            )}
          </div>
        </div>

        <div className={S.footer}>
          <button className={S.resetBtn} onClick={() => { onUpdate({ accentColor:'#7C3AED', fontSize:14, fontFamily:'JetBrains Mono', tabSize:2 }); notify?.('info','Settings reset to defaults') }}>
            Reset Defaults
          </button>
          <button className={S.saveBtn} onClick={() => { notify?.('success','Settings saved'); onClose() }}>
            Done
          </button>
        </div>
      </div>
    </div>
  )
}

function Row({ label, hint, children }) {
  return (
    <div className={S.row}>
      <div className={S.rowLabel}>
        <span>{label}</span>
        {hint && <span className={S.rowHint}>{hint}</span>}
      </div>
      <div className={S.rowControl}>{children}</div>
    </div>
  )
}

function Toggle({ val, onChange }) {
  return (
    <button className={`${S.toggle} ${val ? S.toggleOn : ''}`} onClick={() => onChange(!val)}>
      <span className={S.toggleThumb} />
    </button>
  )
}
