import { useState, useCallback } from 'react'

export function useTerminal() {
  const [lines, setLines] = useState([])
  const [running, setRunning] = useState(false)
  const [lastMs, setLastMs] = useState(null)

  const appendLine = useCallback(line => setLines(p => [...p, line]), [])
  const clearTerminal = useCallback(() => setLines([]), [])
  const setDone = useCallback(({ code, ms }) => {
    setRunning(false)
    setLastMs(ms)
  }, [])

  return { lines, running, lastMs, setRunning, setDone, appendLine, clearTerminal }
}
