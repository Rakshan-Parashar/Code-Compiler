import { useState, useEffect, useCallback } from 'react'

const DEF = {
  fontSize: 14, fontFamily: 'JetBrains Mono', tabSize: 2,
  wordWrap: false, minimap: true, lineNumbers: true,
  autoSave: false, autoSaveDelay: 1500, formatOnSave: false,
  terminalFontSize: 13, accentColor: '#7C3AED',
  showIndentGuides: true, renderWhitespace: 'selection',
  smoothScrolling: true, stickyScroll: true, bracketPairColors: true,
  zenMode: false, liveErrors: true,
}
export function useSettings() {
  const [settings, setSettings] = useState(DEF)
  useEffect(() => {
    window.api?.loadSettings().then(s => { if (s) setSettings({ ...DEF, ...s }) })
  }, [])
  const updateSettings = useCallback(patch => {
    setSettings(prev => {
      const next = { ...prev, ...patch }
      window.api?.saveSettings(next)
      return next
    })
  }, [])
  return { settings, updateSettings }
}
