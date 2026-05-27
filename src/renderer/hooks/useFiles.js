import { useState, useCallback } from 'react'
import { EXT_LANG } from '../utils/language.js'

let _id = 0
const mkId = () => `f_${++_id}`

export function useFiles(notify) {
  const [openFiles,      setOpenFiles]      = useState([])
  const [activeFileId,   setActiveFileId]   = useState(null)
  const [splitFileId,    setSplitFileId]    = useState(null)
  const [folderTree,     setFolderTree]     = useState([])
  const [folderName,     setFolderName]     = useState('')
  const [rootFolderPath, setRootFolderPath] = useState('')
  const [lintErrors,     setLintErrors]     = useState({})

  const activeFile = openFiles.find(f => f.id === activeFileId) || null
  const splitFile  = openFiles.find(f => f.id === splitFileId)  || null

  const openFile = useCallback((fileObj) => {
    const existing = openFiles.find(f => f.path && f.path === fileObj.path)
    if (existing) { setActiveFileId(existing.id); return }
    if (fileObj.path && fileObj.content === undefined) {
      window.api.readFile(fileObj.path).then(res => {
        if (res?.error) { notify?.('error', res.error); return }
        const f = { id: mkId(), name: res.name, path: res.path, ext: res.ext, content: res.content, _saved: res.content, modified: false, cursor: { line: 1, col: 1 } }
        setOpenFiles(p => [...p, f]); setActiveFileId(f.id)
        runLint(f)
      })
      return
    }
    const f = { id: mkId(), name: fileObj.name, path: fileObj.path || null, ext: fileObj.ext || '', content: fileObj.content || '', _saved: fileObj.content || '', modified: false, cursor: { line: 1, col: 1 } }
    setOpenFiles(p => [...p, f]); setActiveFileId(f.id)
  }, [openFiles, notify])

  const openFileDiff = useCallback(async (filePath) => {
    if (!rootFolderPath) return
    const headRes = await window.api.gitShowHead(rootFolderPath, filePath)
    const originalContent = headRes.ok ? headRes.out : ''

    const fileRes = await window.api.readFile(filePath)
    if (fileRes?.error) { notify?.('error', fileRes.error); return }

    const existing = openFiles.find(f => f.path && f.path === filePath)
    if (existing) {
      setOpenFiles(prev => prev.map(f => f.id === existing.id ? { ...f, diffMode: true, originalContent } : f))
      setActiveFileId(existing.id)
      return
    }

    const f = { 
      id: mkId(), 
      name: fileRes.name + ' (Diff)', 
      path: fileRes.path, 
      ext: fileRes.ext, 
      content: fileRes.content, 
      _saved: fileRes.content, 
      modified: false, 
      cursor: { line: 1, col: 1 },
      diffMode: true,
      originalContent
    }
    setOpenFiles(p => [...p, f])
    setActiveFileId(f.id)
  }, [openFiles, rootFolderPath, notify])

  const closeFile = useCallback((fileId) => {
    setOpenFiles(prev => {
      const idx  = prev.findIndex(f => f.id === fileId)
      const next = prev.filter(f => f.id !== fileId)
      if (activeFileId === fileId) setActiveFileId(next[Math.min(idx, next.length - 1)]?.id || null)
      if (splitFileId  === fileId) setSplitFileId(null)
      return next
    })
    setLintErrors(e => { const n = { ...e }; delete n[fileId]; return n })
  }, [activeFileId, splitFileId])

  const setActiveFile = useCallback(id => setActiveFileId(id), [])
  const setSplitFile  = useCallback(id => setSplitFileId(id),  [])

  const runLint = useCallback(async (file) => {
    if (!file || !['js','jsx','ts','tsx'].includes(file.ext)) return
    const res = await window.api?.lintJS(file.content)
    if (res?.ok) setLintErrors(e => ({ ...e, [file.id]: res.errors }))
  }, [])

  const updateFileContent = useCallback((fileId, content, cursor) => {
    setOpenFiles(prev => prev.map(f =>
      f.id !== fileId ? f : { ...f, content, modified: content !== f._saved, cursor: cursor || f.cursor }
    ))
  }, [])

  const openFolder = useCallback(async () => {
    const res = await window.api.openFolder(); if (!res) return
    setFolderTree(res.tree); setFolderName(res.folderName); setRootFolderPath(res.folderPath)
  }, [])

  const openFileFromDisk = useCallback(async () => {
    const res = await window.api.openFile(); if (!res) return; openFile(res)
  }, [openFile])

  const saveFile = useCallback(async () => {
    if (!activeFile) return
    if (!activeFile.path) { await saveFileAs(); return }
    const res = await window.api.saveFile(activeFile.path, activeFile.content)
    if (res?.error) { notify?.('error', 'Save failed: ' + res.error); return }
    setOpenFiles(prev => prev.map(f => f.id === activeFile.id ? { ...f, modified: false, _saved: f.content, mtime: res.mtime } : f))
    await window.api.historyPush(activeFile.path, activeFile.content)
    notify?.('success', `Saved ${activeFile.name}`)
  }, [activeFile, notify])

  const saveFileAs = useCallback(async () => {
    if (!activeFile) return
    const res = await window.api.saveFileAs(activeFile.content, activeFile.name); if (!res) return
    setOpenFiles(prev => prev.map(f =>
      f.id === activeFile.id ? { ...f, path: res.path, name: res.name, ext: res.ext, modified: false, _saved: f.content } : f
    ))
    notify?.('success', `Saved as ${res.name}`)
  }, [activeFile, notify])

  const newFile = useCallback(async (folderPath) => {
    const target = folderPath || rootFolderPath
    const name = window.prompt?.('File name:', 'untitled.js'); if (!name) return
    if (target) {
      const res = await window.api.newFile(target, name)
      if (res?.error) { notify?.('error', res.error); return }
      openFile(res); refreshTree()
    } else {
      const f = { id: mkId(), name, path: null, ext: name.split('.').pop() || '', content: '', _saved: '', modified: false, cursor: { line: 1, col: 1 } }
      setOpenFiles(p => [...p, f]); setActiveFileId(f.id)
    }
  }, [rootFolderPath, openFile, notify])

  const newFolder = useCallback(async (folderPath) => {
    const target = folderPath || rootFolderPath; if (!target) return
    const name = window.prompt?.('Folder name:', 'new-folder'); if (!name) return
    const res = await window.api.newFolder(target, name)
    if (res?.error) { notify?.('error', res.error); return }
    refreshTree()
  }, [rootFolderPath, notify])

  const deleteItem = useCallback(async (itemPath) => {
    if (!window.confirm?.(`Delete "${itemPath.split(/[/\\]/).pop()}"?`)) return
    const res = await window.api.deleteItem(itemPath)
    if (res?.error) { notify?.('error', res.error); return }
    setOpenFiles(prev => {
      const next = prev.filter(f => !f.path?.startsWith(itemPath))
      if (!next.find(f => f.id === activeFileId)) setActiveFileId(next[next.length - 1]?.id || null)
      return next
    })
    refreshTree()
  }, [rootFolderPath, activeFileId, notify])

  const renameItem = useCallback(async (oldPath, newName) => {
    if (!newName || newName === oldPath.split(/[/\\]/).pop()) return
    const res = await window.api.renameItem(oldPath, newName)
    if (res?.error) { notify?.('error', res.error); return }
    setOpenFiles(prev => prev.map(f =>
      f.path === oldPath ? { ...f, path: res.newPath, name: newName, ext: newName.split('.').pop() || '' } : f
    ))
    refreshTree()
  }, [rootFolderPath, notify])

  const refreshTree = useCallback(async () => {
    if (!rootFolderPath) return
    const tree = await window.api.refreshDir(rootFolderPath); setFolderTree(tree || [])
  }, [rootFolderPath])

  const formatFile = useCallback(async () => {
    if (!activeFile) return
    const lang = EXT_LANG[activeFile.ext] || 'plaintext'
    const res = await window.api.formatCode(activeFile.content, lang)
    if (res?.ok && res.formatted !== activeFile.content) {
      updateFileContent(activeFile.id, res.formatted)
      notify?.('success', 'Formatted')
    }
  }, [activeFile, updateFileContent, notify])

  return {
    openFiles, activeFile, splitFile, folderTree, folderName, rootFolderPath, lintErrors,
    openFile, openFileDiff, closeFile, setActiveFile, setSplitFile, updateFileContent,
    openFolder, openFileFromDisk, saveFile, saveFileAs,
    newFile, newFolder, deleteItem, renameItem, refreshTree, formatFile, runLint,
  }
}