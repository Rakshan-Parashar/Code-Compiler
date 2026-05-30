import { useState, useCallback, useEffect } from 'react'
export function useGit(rootFolderPath, notify) {
  const [branch, setBranch] = useState('')
  const [status, setStatus] = useState([])
  const [log, setLog] = useState([])
  const [loading, setLoading] = useState(false)
  const [hasGit, setHasGit] = useState(false)

  const refresh = useCallback(async () => {
    if (!rootFolderPath) return
    setLoading(true)
    const [b, s, l] = await Promise.all([
      window.api.gitBranch(rootFolderPath),
      window.api.gitStatus(rootFolderPath),
      window.api.gitLog(rootFolderPath),
    ])
    setHasGit(b.ok)
    if (b.ok) setBranch(b.out || 'main')
    if (s.ok) setStatus(s.files)
    if (l.ok) setLog(l.commits)
    setLoading(false)
  }, [rootFolderPath])

  useEffect(() => {
    refresh()
  }, [refresh])

  const stage = useCallback(async f => {
    await window.api.gitStage(rootFolderPath, f)
    refresh()
  }, [rootFolderPath, refresh])

  const unstage = useCallback(async f => {
    await window.api.gitUnstage(rootFolderPath, f)
    refresh()
  }, [rootFolderPath, refresh])

  const discard = useCallback(async f => {
    await window.api.gitDiscard(rootFolderPath, f)
    refresh()
    notify?.('info', `Discarded ${f}`)
  }, [rootFolderPath, refresh, notify])

  const commit = useCallback(async msg => {
    if (!msg.trim()) {
      notify?.('error', 'Commit message required')
      return
    }
    const res = await window.api.gitCommit(rootFolderPath, msg)
    if (res.ok) {
      notify?.('success', `Committed: ${msg}`)
      refresh()
    } else notify?.('error', res.err || 'Commit failed')
  }, [rootFolderPath, refresh, notify])

  const push = useCallback(async () => {
    notify?.('info', 'Pushing...')
    const res = await window.api.gitPush(rootFolderPath)
    if (res.ok) notify?.('success', 'Pushed to remote')
    else notify?.('error', res.err || 'Push failed')
  }, [rootFolderPath, notify])

  const pull = useCallback(async () => {
    notify?.('info', 'Pulling...')
    const res = await window.api.gitPull(rootFolderPath)
    if (res.ok) notify?.('success', 'Pulled from remote')
    else notify?.('error', res.err || 'Pull failed')
  }, [rootFolderPath, notify])

  const init = useCallback(async () => {
    const res = await window.api.gitInit(rootFolderPath)
    if (res.ok) {
      notify?.('success', 'Git repo initialized')
      refresh()
    } else notify?.('error', res.err || 'Init failed')
  }, [rootFolderPath, refresh, notify])

  const getDiff = useCallback(async f => {
    const res = await window.api.gitDiff(rootFolderPath, f)
    return res.ok ? res.out : null
  }, [rootFolderPath])

  return {
    branch, status, log, loading, hasGit,
    refresh, stage, unstage, discard,
    commit, push, pull, init, getDiff,
  }
}
