import React, { useState, useEffect, useRef } from 'react'
import S from '../Panel.module.css'
import { ragQueryCodebase } from '../../utils/dataApi.js'

export default function AiPanel({ activeFile, rootFolderPath, onClose, notify, onInsert, settings, onJumpToLine, updateSettings }) {
  const [tab, setTab] = useState('review') // 'chat' or 'review'
  const [hasEnvKey, setHasEnvKey] = useState(false)
  
  useEffect(() => {
    if (window.api && window.api.hasEnvKey) {
      window.api.hasEnvKey().then(setHasEnvKey)
    }
  }, [])

  // AI Chat State
  const [chatQuery, setChatQuery] = useState('')
  const [enableRag, setEnableRag] = useState(false)
  const [chatHistory, setChatHistory] = useState([
    { role: 'assistant', content: 'Hello! I am your AI Coding Assistant. Ask me to write, explain, or optimize code for you.' }
  ])
  const [chatLoading, setChatLoading] = useState(false)
  const chatEndRef = useRef(null)

  // AI Review State
  const [reviewLoading, setReviewLoading] = useState(false)
  const [reviewStatus, setReviewStatus] = useState({
    syntax: { status: 'idle', data: '', msg: '' },
    detailed: { status: 'idle', data: '', msg: '', current: 0, total: 0 }
  })
  
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [chatHistory])

  // Listen to IPC progress events
  useEffect(() => {
    if (window.api && window.api.onAiProgress) {
      const unsubscribe = window.api.onAiProgress((progress) => {
        const { phase, status, msg, data, current, total, error } = progress
        
        setReviewStatus(prev => {
          const next = { ...prev }
          if (phase === 'syntax') {
            next.syntax = { status, data: data || prev.syntax.data, msg: msg || '' }
          } else if (phase === 'detailed') {
            next.detailed = { 
              status, 
              data: data || prev.detailed.data, 
              msg: msg || '', 
              current: current || prev.detailed.current, 
              total: total || prev.detailed.total 
            }
          } else if (phase === 'canceled') {
            if (next.syntax.status === 'running') next.syntax.status = 'canceled'
            if (next.detailed.status === 'running' || next.detailed.status === 'chunk') next.detailed.status = 'canceled'
            notify?.('info', msg || 'Review canceled')
          } else if (phase === 'error') {
            if (next.syntax.status === 'running') next.syntax.status = 'error'
            if (next.detailed.status === 'running' || next.detailed.status === 'chunk') next.detailed.status = 'error'
            notify?.('error', error || 'An error occurred during review')
          }
          return next
        })
      })
      return () => unsubscribe()
    }
  }, [notify])

  // Handle Chat Submit
  const handleChatSubmit = async (e) => {
    e.preventDefault()
    if (!chatQuery.trim()) return
    
    const userMsg = chatQuery.trim()
    setChatQuery('')
    setChatHistory(prev => [...prev, { role: 'user', content: userMsg }])
    setChatLoading(true)

    try {
      let prompt = userMsg
      let sources = []

      if (enableRag && rootFolderPath) {
        setChatHistory(prev => [...prev, { role: 'assistant', content: '🔍 Querying codebase context (RAG)...' }])
        
        const ragRes = await ragQueryCodebase(
          userMsg,
          rootFolderPath,
          settings.aiProvider || 'ollama',
          settings.geminiApiKey || '',
          settings.ollamaModel || 'codellama'
        )

        // Remove the searching message
        setChatHistory(prev => prev.slice(0, -1))

        if (ragRes.ok && ragRes.snippets && ragRes.snippets.length > 0) {
          let contextStr = "Here is the relevant codebase context retrieved from the workspace:\n\n"
          ragRes.snippets.forEach(snippet => {
            contextStr += `=== File: ${snippet.path} (Lines ${snippet.start_line}-${snippet.end_line}) ===\n${snippet.text}\n\n`
            sources.push(`${snippet.path} (L${snippet.start_line}-${snippet.end_line})`)
          })
          
          prompt = `You are an expert developer assistant. ${contextStr}Based on the above codebase context, answer the user's question. If the context does not contain the answer, use your general knowledge but mention it is not in the context.\n\nUser Question:\n${userMsg}`
        } else {
          prompt = `You are an expert developer assistant. Note: No specific context was found in the workspace for this query. Answer based on your general knowledge.\n\nUser Question:\n${userMsg}`
        }
      } else if (activeFile) {
        prompt = `You are an expert developer assistant. Here is the active file context:\n\nLanguage: ${activeFile.ext}\nPath: ${activeFile.path || 'untitled'}\nCode:\n\`\`\`\n${activeFile.content}\n\`\`\`\n\nUser Question:\n${userMsg}`
        sources.push(`${activeFile.name} (Active File)`)
      }

      const res = await window.api.aiChat(
        prompt, 
        settings.aiProvider || 'ollama', 
        settings.geminiApiKey || '', 
        settings.ollamaModel || 'codellama'
      )
      
      if (res.ok) {
        setChatHistory(prev => [...prev, { role: 'assistant', content: res.response, sources }])
      } else if (res.canceled) {
        notify?.('info', 'Chat request canceled')
      } else {
        setChatHistory(prev => [...prev, { role: 'assistant', content: `❌ Error: ${res.error || 'Failed to generate response'}` }])
        notify?.('error', res.error || 'Failed to contact AI')
      }
    } catch (err) {
      setChatHistory(prev => [...prev, { role: 'assistant', content: `❌ Error: ${err.message}` }])
    } finally {
      setChatLoading(false)
    }
  }

  // Start AI Code Review
  const startCodeReview = async () => {
    if (!activeFile || !activeFile.content.trim()) {
      notify?.('error', 'Open a file with some code first!')
      return
    }
    
    setReviewLoading(true)
    setReviewStatus({
      syntax: { status: 'idle', data: '', msg: '' },
      detailed: { status: 'idle', data: '', msg: '', current: 0, total: 0 }
    })

    notify?.('info', 'Starting two-phase code review...')
    const res = await window.api.aiReview(
      activeFile.content,
      activeFile.ext,
      settings.aiProvider || 'ollama',
      settings.geminiApiKey || '',
      settings.ollamaModel || 'codellama'
    )

    if (res.ok) {
      notify?.('success', 'Code review completed!')
    }
    setReviewLoading(false)
  }

  // Cancel Code Review
  const cancelReview = async () => {
    await window.api.aiCancel()
    setReviewLoading(false)
  }

  // Parse review findings for clickable [Line X] tags
  const renderFindingsText = (text) => {
    if (!text) return null
    
    const lines = text.split('\n')
    return lines.map((lineText, idx) => {
      // RegEx matching [Line X] or [line X] or Line X:
      const match = lineText.match(/\[(?:Line|line)\s+(\d+)\]/i) || lineText.match(/(?:Line|line)\s+(\d+):?/i)
      if (match && match[1]) {
        const lineNum = parseInt(match[1])
        const parts = lineText.split(match[0])
        return (
          <div key={idx} style={{ margin: '6px 0', fontSize: '13px', lineHeight: '1.5', color: '#e0e0e8' }}>
            {parts[0]}
            <button 
              onClick={() => onJumpToLine?.(lineNum)}
              title={`Jump to line ${lineNum} in editor`}
              style={{
                background: 'rgba(124, 58, 237, 0.15)',
                color: '#9461f7',
                border: '1px solid rgba(124, 58, 237, 0.4)',
                borderRadius: '3px',
                padding: '1px 5px',
                fontSize: '11px',
                cursor: 'pointer',
                margin: '0 4px',
                fontWeight: 'bold',
                fontFamily: 'monospace'
              }}
            >
              Line {lineNum}
            </button>
            {parts.slice(1).join(match[0])}
          </div>
        )
      }
      return <div key={idx} style={{ margin: '4px 0', fontSize: '13px', color: '#b5b5c0' }}>{lineText}</div>
    })
  }

  return (
    <div className={S.backdrop} onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className={S.panel} style={{ width: 620, height: '85vh', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div className={S.hdr}>
          <div className={S.hdrLeft}>
            <svg viewBox="0 0 16 16" width="15" fill="none" style={{ color: 'var(--ac)' }}>
              <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.5 3.5l1.5 1.5M11 11l1.5 1.5M3.5 12.5l1.5-1.5M11 5l1.5-1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              <circle cx="8" cy="8" r="2.5" fill="currentColor"/>
            </svg>
            <span style={{ fontWeight: 'bold' }}>AI Coding Assistant</span>
          </div>
          <button className={S.closeBtn} onClick={onClose}>×</button>
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #1c1c24', background: '#0a0a0d', padding: '0 16px' }}>
          <button 
            onClick={() => setTab('review')}
            style={{
              padding: '12px 16px',
              background: 'none',
              border: 'none',
              borderBottom: tab === 'review' ? '2px solid var(--ac)' : '2px solid transparent',
              color: tab === 'review' ? '#fff' : '#8c8c9e',
              cursor: 'pointer',
              fontWeight: tab === 'review' ? 'bold' : 'normal',
              fontSize: '13px'
            }}
          >
            📋 AI Code Reviewer
          </button>
          <button 
            onClick={() => setTab('chat')}
            style={{
              padding: '12px 16px',
              background: 'none',
              border: 'none',
              borderBottom: tab === 'chat' ? '2px solid var(--ac)' : '2px solid transparent',
              color: tab === 'chat' ? '#fff' : '#8c8c9e',
              cursor: 'pointer',
              fontWeight: tab === 'chat' ? 'bold' : 'normal',
              fontSize: '13px'
            }}
          >
            💬 AI Copilot Chat
          </button>
        </div>

        {/* Tab Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', background: '#0d0d12', display: 'flex', flexDirection: 'column' }}>
          
          {/* TAB 1: CODE REVIEWER */}
          {tab === 'review' && (
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              {/* Target info & AI Config */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: '#121218', padding: '12px 14px', borderRadius: '6px', border: '1px solid #1c1c24', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ color: '#8c8c9e', fontSize: '12px' }}>Reviewing: </span>
                    <span style={{ color: '#fff', fontSize: '13px', fontWeight: 'bold', fontFamily: 'monospace' }}>
                      {activeFile ? activeFile.name : 'No active file open'}
                    </span>
                  </div>
                  <div>
                    <select 
                      value={settings.aiProvider || 'ollama'} 
                      onChange={e => updateSettings({ aiProvider: e.target.value })}
                      style={{ 
                        background: '#0d0d12', 
                        border: '1px solid #2d2d38', 
                        color: '#fff', 
                        fontSize: '11px', 
                        padding: '4px 8px', 
                        borderRadius: '4px',
                        outline: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="ollama">Local Ollama</option>
                      <option value="gemini">Google Gemini</option>
                    </select>
                  </div>
                </div>

                {/* Conditional Model / API Key Input */}
                {settings.aiProvider === 'gemini' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ color: '#8c8c9e', fontSize: '11px' }}>Gemini API Key:</span>
                    <input 
                      type="password"
                      placeholder={hasEnvKey ? "Loaded from .env (Active)" : "Enter API Key here..."}
                      value={settings.geminiApiKey || ''}
                      onChange={e => updateSettings({ geminiApiKey: e.target.value })}
                      style={{
                        background: '#0d0d12',
                        border: '1px solid #2d2d38',
                        borderRadius: '4px',
                        padding: '5px 8px',
                        color: '#fff',
                        fontSize: '11px',
                        outline: 'none'
                      }}
                    />
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ color: '#8c8c9e', fontSize: '11px' }}>Ollama Model:</span>
                    <input 
                      type="text"
                      placeholder="e.g. codellama, llama3, mistral..."
                      value={settings.ollamaModel || 'codellama'}
                      onChange={e => updateSettings({ ollamaModel: e.target.value })}
                      style={{
                        background: '#0d0d12',
                        border: '1px solid #2d2d38',
                        borderRadius: '4px',
                        padding: '5px 8px',
                        color: '#fff',
                        fontSize: '11px',
                        outline: 'none'
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Progress Steps */}
              {reviewLoading || reviewStatus.syntax.status !== 'idle' || reviewStatus.detailed.status !== 'idle' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
                  
                  {/* Step 1: Syntax */}
                  <div style={{ background: '#121218', padding: '12px', borderRadius: '6px', border: '1px solid #1c1c24' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '16px' }}>
                          {reviewStatus.syntax.status === 'running' && '🔄'}
                          {reviewStatus.syntax.status === 'done' && '✅'}
                          {reviewStatus.syntax.status === 'canceled' && '⚠️'}
                          {reviewStatus.syntax.status === 'error' && '❌'}
                          {reviewStatus.syntax.status === 'idle' && '⚪'}
                        </span>
                        <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff' }}>Phase 1: Quick Syntax Check</span>
                      </div>
                      <span style={{ fontSize: '11px', color: '#8c8c9e' }}>
                        {reviewStatus.syntax.status === 'running' ? 'Scanning...' : reviewStatus.syntax.status}
                      </span>
                    </div>
                    {reviewStatus.syntax.msg && <div style={{ fontSize: '12px', color: '#8c8c9e', marginTop: '6px', fontStyle: 'italic' }}>{reviewStatus.syntax.msg}</div>}
                    {reviewStatus.syntax.data && (
                      <div style={{ marginTop: '10px', background: '#0a0a0d', padding: '8px 12px', borderRadius: '4px', borderLeft: '3px solid #7c3aed', overflowX: 'auto', maxHeight: '150px' }}>
                        {renderFindingsText(reviewStatus.syntax.data)}
                      </div>
                    )}
                  </div>

                  {/* Step 2: Detailed Chunked Review */}
                  <div style={{ background: '#121218', padding: '12px', borderRadius: '6px', border: '1px solid #1c1c24' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '16px' }}>
                          {(reviewStatus.detailed.status === 'running' || reviewStatus.detailed.status === 'chunk') && '🔄'}
                          {reviewStatus.detailed.status === 'done' && '✅'}
                          {reviewStatus.detailed.status === 'canceled' && '⚠️'}
                          {reviewStatus.detailed.status === 'error' && '❌'}
                          {reviewStatus.detailed.status === 'idle' && '⚪'}
                        </span>
                        <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff' }}>Phase 2: Detailed Code Analysis</span>
                      </div>
                      <span style={{ fontSize: '11px', color: '#8c8c9e' }}>
                        {reviewStatus.detailed.status === 'chunk' 
                          ? `Chunk ${reviewStatus.detailed.current}/${reviewStatus.detailed.total}` 
                          : reviewStatus.detailed.status
                        }
                      </span>
                    </div>
                    {reviewStatus.detailed.msg && <div style={{ fontSize: '12px', color: '#8c8c9e', marginTop: '6px', fontStyle: 'italic' }}>{reviewStatus.detailed.msg}</div>}
                    
                    {/* Chunk Progress Bar */}
                    {(reviewStatus.detailed.status === 'running' || reviewStatus.detailed.status === 'chunk') && reviewStatus.detailed.total > 1 && (
                      <div style={{ height: '4px', background: '#1c1c24', borderRadius: '2px', marginTop: '10px', overflow: 'hidden' }}>
                        <div style={{ 
                          height: '100%', 
                          background: 'var(--ac)', 
                          width: `${(reviewStatus.detailed.current / reviewStatus.detailed.total) * 100}%`,
                          transition: 'width 0.3s ease'
                        }} />
                      </div>
                    )}

                    {reviewStatus.detailed.data && (
                      <div style={{ marginTop: '10px', background: '#0a0a0d', padding: '8px 12px', borderRadius: '4px', borderLeft: '3px solid #059669', overflowX: 'auto', maxHeight: '250px' }}>
                        {renderFindingsText(reviewStatus.detailed.data)}
                      </div>
                    )}
                  </div>

                </div>
              ) : (
                <div style={{ textAlign: 'center', margin: '40px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '40px' }}>🔍</span>
                  <div style={{ color: '#fff', fontSize: '15px', fontWeight: 'bold' }}>Ready to review code</div>
                  <p style={{ color: '#8c8c9e', fontSize: '13px', maxWidth: '340px', lineHeight: '1.4' }}>
                    Clicking review will trigger a quick syntax check first, followed by a detailed chunk-by-chunk logic review.
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ marginTop: 'auto', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                {reviewLoading ? (
                  <button 
                    onClick={cancelReview}
                    style={{
                      background: '#d32f2f',
                      color: '#fff',
                      border: 'none',
                      padding: '10px 18px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: '13px'
                    }}
                  >
                    ⏹ Cancel Review
                  </button>
                ) : (
                  <button 
                    onClick={startCodeReview}
                    disabled={!activeFile}
                    style={{
                      background: activeFile ? 'var(--ac)' : '#2d2d38',
                      color: activeFile ? '#fff' : '#5a5a6e',
                      border: 'none',
                      padding: '10px 18px',
                      borderRadius: '4px',
                      cursor: activeFile ? 'pointer' : 'not-allowed',
                      fontWeight: 'bold',
                      fontSize: '13px'
                    }}
                  >
                    🔍 Run Two-Phase Review
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: AI CHAT */}
          {tab === 'chat' && (
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, height: '100%' }}>
              
              {/* Message List */}
              <div style={{ flex: 1, minHeight: '260px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px', paddingRight: '4px' }}>
                {chatHistory.map((msg, idx) => (
                  <div 
                    key={idx} 
                    style={{
                      alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                      background: msg.role === 'user' ? 'var(--ac)' : '#121218',
                      color: '#fff',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      maxWidth: '85%',
                      border: msg.role === 'user' ? 'none' : '1px solid #1c1c24',
                      fontSize: '13px',
                      lineHeight: '1.5',
                      whiteSpace: 'pre-wrap',
                      fontFamily: msg.content.startsWith('```') ? 'monospace' : 'inherit'
                    }}
                  >
                    {msg.content}
                    {msg.sources && msg.sources.length > 0 && (
                      <div style={{ fontSize: '11px', color: '#8c8c9e', marginTop: '8px', borderTop: '1px solid #1c1c24', paddingTop: '6px', display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                        <span style={{ fontWeight: 'bold' }}>Context Sources:</span>
                        {msg.sources.map((src, sidx) => (
                          <span key={sidx} style={{ background: '#1c1c24', color: 'var(--acl)', padding: '1px 5px', borderRadius: '3px', fontFamily: 'monospace', border: '1px solid #2d2d3d' }}>
                            {src}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {chatLoading && (
                  <div style={{ alignSelf: 'flex-start', background: '#121218', color: '#8c8c9e', padding: '10px 14px', borderRadius: '8px', border: '1px solid #1c1c24', fontSize: '13px', fontStyle: 'italic' }}>
                    Thinking...
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* RAG Toggle Toolbar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', padding: '6px 10px', background: '#121218', borderRadius: '4px', border: '1px solid #1c1c24', alignSelf: 'stretch' }}>
                <input 
                  type="checkbox" 
                  id="enable-rag"
                  checked={enableRag} 
                  onChange={e => setEnableRag(e.target.checked)}
                  style={{ cursor: 'pointer' }}
                  disabled={!rootFolderPath}
                />
                <label htmlFor="enable-rag" style={{ fontSize: '12px', color: rootFolderPath ? '#fff' : '#5a5a6e', cursor: rootFolderPath ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: '4px', userSelect: 'none' }}>
                  🔍 <strong>Codebase RAG</strong> (Search entire workspace)
                  {!rootFolderPath && <span style={{ fontSize: '10px', color: '#8c8c9e', fontStyle: 'italic' }}>(Open a folder first)</span>}
                </label>
              </div>

              {/* Chat Input */}
              <form onSubmit={handleChatSubmit} style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                <input 
                  type="text"
                  value={chatQuery}
                  onChange={e => setChatQuery(e.target.value)}
                  placeholder="Ask your AI Copilot a question..."
                  disabled={chatLoading}
                  style={{
                    flex: 1,
                    background: '#121218',
                    border: '1px solid #1c1c24',
                    borderRadius: '4px',
                    padding: '10px 14px',
                    color: '#fff',
                    fontSize: '13px'
                  }}
                />
                <button 
                  type="submit" 
                  disabled={chatLoading || !chatQuery.trim()}
                  style={{
                    background: chatQuery.trim() && !chatLoading ? 'var(--ac)' : '#2d2d38',
                    color: chatQuery.trim() && !chatLoading ? '#fff' : '#5a5a6e',
                    border: 'none',
                    padding: '0 16px',
                    borderRadius: '4px',
                    cursor: chatQuery.trim() && !chatLoading ? 'pointer' : 'not-allowed',
                    fontWeight: 'bold',
                    fontSize: '13px'
                  }}
                >
                  Send
                </button>
              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
