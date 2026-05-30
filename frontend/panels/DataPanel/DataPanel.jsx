import React, { useState, useEffect, useRef } from 'react'
import Editor from '@monaco-editor/react'
import S from '../Panel.module.css'
import {
  dbListDatabases,
  dbListCollections,
  dbQueryDocuments,
  dbInsertDocument,
  dbUpdateDocument,
  dbDeleteDocument,
  apiProxyRequest
} from '../../utils/dataApi.js'

export default function DataPanel({ onClose, notify }) {
  const [activeTab, setActiveTab] = useState('db') // 'db' or 'api'
  
  return (
    <div className={S.backdrop} onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className={S.panel} style={{ width: 880, height: '80vh', maxWidth: '95vw' }}>
        {/* Header with Tabs */}
        <div className={S.hdr} style={{ borderBottom: 'none' }}>
          <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
            <div className={S.hdrLeft}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <ellipse cx="12" cy="5" rx="9" ry="3"/>
                <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
                <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"/>
              </svg>
              <span style={{ fontWeight: 700, fontSize: 15 }}>Data Tools</span>
            </div>
            
            <div style={{ display: 'flex', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: 10, padding: 3, gap: 4 }}>
              <button 
                onClick={() => setActiveTab('db')}
                style={{
                  padding: '5px 12px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  background: activeTab === 'db' ? 'var(--acg)' : 'transparent',
                  color: activeTab === 'db' ? 'var(--ac)' : 'var(--t2)',
                  cursor: 'pointer',
                  transition: 'all var(--ease)'
                }}
              >
                MongoDB Explorer
              </button>
              <button 
                onClick={() => setActiveTab('api')}
                style={{
                  padding: '5px 12px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  background: activeTab === 'api' ? 'var(--acg)' : 'transparent',
                  color: activeTab === 'api' ? 'var(--ac)' : 'var(--t2)',
                  cursor: 'pointer',
                  transition: 'all var(--ease)'
                }}
              >
                API Client
              </button>
            </div>
          </div>
          <button className={S.closeBtn} onClick={onClose}>×</button>
        </div>

        {/* Tab Contents */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
          {activeTab === 'db' ? (
            <DbExplorer notify={notify} />
          ) : (
            <ApiClient notify={notify} />
          )}
        </div>
      </div>
    </div>
  )
}

/* ───────────────────────────────────────────────────────────────────────────
   1. MONGODB EXPLORER COMPONENT
   ─────────────────────────────────────────────────────────────────────────── */
function DbExplorer({ notify }) {
  const [databases, setDatabases] = useState([])
  const [expandedDb, setExpandedDb] = useState(null)
  const [collections, setCollections] = useState({})
  
  const [selectedDb, setSelectedDb] = useState('')
  const [selectedCollection, setSelectedCollection] = useState('')
  
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(false)
  const [queryText, setQueryText] = useState('{}')
  const [limit, setLimit] = useState(20)
  const [skip, setSkip] = useState(0)
  const [hasMore, setHasMore] = useState(false)

  // Document Editing
  const [editingDoc, setEditingDoc] = useState(null)
  const [editingDocId, setEditingDocId] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)

  useEffect(() => {
    fetchDatabases()
  }, [])

  const fetchDatabases = async () => {
    const res = await dbListDatabases()
    setDatabases(res.databases || [])
    if (res.databases && res.databases.length > 0) {
      handleToggleDb(res.databases[0])
    }
  }

  const handleToggleDb = async (dbName) => {
    if (expandedDb === dbName) {
      setExpandedDb(null)
      return
    }
    setExpandedDb(dbName)
    if (!collections[dbName]) {
      const res = await dbListCollections(dbName)
      setCollections(prev => ({ ...prev, [dbName]: res.collections || [] }))
    }
  }

  const handleSelectCollection = (dbName, colName) => {
    setSelectedDb(dbName)
    setSelectedCollection(colName)
    setSkip(0)
    fetchDocuments(dbName, colName, '{}', 20, 0)
  }

  const fetchDocuments = async (dbName, colName, queryStr, qLimit, qSkip) => {
    setLoading(true)
    let parsedQuery = {}
    try {
      parsedQuery = JSON.parse(queryStr || '{}')
    } catch (err) {
      notify?.('error', 'Invalid JSON query format.')
      setLoading(false)
      return
    }

    const res = await dbQueryDocuments(dbName, colName, parsedQuery, qLimit, qSkip)
    if (res.ok) {
      const docs = res.documents || []
      if (docs.length > qLimit) {
        setHasMore(true)
        setDocuments(docs.slice(0, qLimit))
      } else {
        setHasMore(false)
        setDocuments(docs)
      }
    } else {
      notify?.('error', res.error || 'Query failed')
    }
    setLoading(false)
  }

  const handleSearch = () => {
    setSkip(0)
    fetchDocuments(selectedDb, selectedCollection, queryText, limit, 0)
  }

  const handleNextPage = () => {
    const nextSkip = skip + limit
    setSkip(nextSkip)
    fetchDocuments(selectedDb, selectedCollection, queryText, limit, nextSkip)
  }

  const handlePrevPage = () => {
    const prevSkip = Math.max(0, skip - limit)
    setSkip(prevSkip)
    fetchDocuments(selectedDb, selectedCollection, queryText, limit, prevSkip)
  }

  const handleDeleteDoc = async (docId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return
    const res = await dbDeleteDocument(selectedDb, selectedCollection, docId)
    if (res.ok) {
      notify?.('success', 'Document deleted.')
      fetchDocuments(selectedDb, selectedCollection, queryText, limit, skip)
    } else {
      notify?.('error', res.error || 'Failed to delete document.')
    }
  }

  const handleOpenEdit = (doc) => {
    if (doc) {
      setEditingDocId(doc._id)
      setEditingDoc(JSON.stringify(doc, null, 2))
    } else {
      setEditingDocId(null)
      setEditingDoc('{\n  \n}')
    }
    setShowEditModal(true)
  }

  const handleSaveDoc = async () => {
    let parsed = null
    try {
      parsed = JSON.parse(editingDoc)
    } catch (e) {
      notify?.('error', 'Failed to parse JSON. Please check formatting.')
      return
    }

    let res
    if (editingDocId) {
      res = await dbUpdateDocument(selectedDb, selectedCollection, editingDocId, parsed)
    } else {
      res = await dbInsertDocument(selectedDb, selectedCollection, parsed)
    }
    
    if (res.ok) {
      notify?.('success', editingDocId ? 'Document updated successfully.' : 'Document inserted successfully.')
      setShowEditModal(false)
      fetchDocuments(selectedDb, selectedCollection, queryText, limit, skip)
    } else {
      notify?.('error', res.detail || res.error || 'Save failed.')
    }
  }

  return (
    <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
      {/* DB Sidebar */}
      <div 
        style={{ 
          width: 220, 
          borderRight: '1px solid rgba(255, 255, 255, 0.05)', 
          background: 'rgba(0, 0, 0, 0.15)', 
          overflowY: 'auto',
          padding: '12px 8px',
          display: 'flex',
          flexDirection: 'column',
          gap: 6
        }}
      >
        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', paddingLeft: 8, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 6 }}>
          Cluster Connection
        </span>
        {databases.map(db => (
          <div key={db} style={{ display: 'flex', flexDirection: 'column' }}>
            <button 
              onClick={() => handleToggleDb(db)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 8px',
                borderRadius: 6,
                background: 'transparent',
                color: 'var(--t2)',
                fontSize: 12.5,
                fontWeight: 600,
                textAlign: 'left',
                cursor: 'pointer'
              }}
            >
              <span style={{ 
                transform: expandedDb === db ? 'rotate(90deg)' : 'none', 
                transition: 'transform 0.15s',
                display: 'inline-block',
                fontSize: 9
              }}>
                ▶
              </span>
              📁 {db}
            </button>
            
            {expandedDb === db && (
              <div style={{ paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 2, marginTop: 2 }}>
                {(collections[db] || []).map(col => (
                  <button
                    key={col}
                    onClick={() => handleSelectCollection(db, col)}
                    style={{
                      padding: '5px 8px',
                      borderRadius: 5,
                      textAlign: 'left',
                      fontSize: 12,
                      background: (selectedDb === db && selectedCollection === col) ? 'var(--acg)' : 'transparent',
                      color: (selectedDb === db && selectedCollection === col) ? 'var(--ac)' : 'var(--t3)',
                      cursor: 'pointer',
                      transition: 'all var(--ease)'
                    }}
                  >
                    ⚡ {col}
                  </button>
                ))}
                {collections[db] && collections[db].length === 0 && (
                  <span style={{ fontSize: 11, color: 'var(--t4)', padding: '4px 8px', fontStyle: 'italic' }}>Empty database</span>
                )}
              </div>
            )}
          </div>
        ))}
        {databases.length === 0 && (
          <span style={{ fontSize: 12, color: 'var(--t3)', fontStyle: 'italic', paddingLeft: 8 }}>Connecting to cluster...</span>
        )}
      </div>

      {/* Main Grid */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg2)' }}>
        {selectedCollection ? (
          <>
            {/* Explorer Toolbar */}
            <div style={{ display: 'flex', gap: 10, padding: 12, borderBottom: '1px solid rgba(255, 255, 255, 0.05)', alignItems: 'center' }}>
              <div style={{ display: 'flex', flex: 1, position: 'relative' }}>
                <input 
                  value={queryText}
                  onChange={e => setQueryText(e.target.value)}
                  placeholder='Enter query filter e.g. {"userId": "user_1"}' 
                  style={{
                    fontFamily: 'var(--fmono)',
                    fontSize: 12,
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 6,
                    padding: '6px 10px',
                    color: 'var(--t1)',
                    width: '100%',
                    outline: 'none'
                  }}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <button 
                className={S.saveBtn} 
                onClick={handleSearch}
                style={{ width: 'auto', padding: '6px 14px', borderRadius: 6, fontSize: 12, margin: 0 }}
              >
                Find
              </button>
              <button 
                onClick={() => handleOpenEdit(null)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  color: 'var(--t1)',
                  cursor: 'pointer',
                  transition: 'all var(--ease)'
                }}
              >
                + Insert Doc
              </button>
            </div>

            {/* Document List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
              {loading ? (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--t3)', fontSize: 13 }}>Querying MongoDB...</div>
              ) : documents.length === 0 ? (
                <div style={{ padding: 60, textAlign: 'center', color: 'var(--t3)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <span style={{ fontSize: 24 }}>📭</span>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>No documents found matching this query.</span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {documents.map(doc => (
                    <div 
                      key={doc._id} 
                      style={{ 
                        background: 'rgba(255, 255, 255, 0.02)', 
                        border: '1px solid rgba(255, 255, 255, 0.05)', 
                        borderRadius: 10,
                        padding: 12
                      }}
                    >
                      {/* Document Item Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 6 }}>
                        <span style={{ fontSize: 11, fontFamily: 'var(--fmono)', color: 'var(--t3)' }}>
                          ID: <strong style={{ color: 'var(--ac)' }}>{doc._id}</strong>
                        </span>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(JSON.stringify(doc, null, 2))
                              notify?.('success', 'Document JSON copied!')
                            }}
                            style={{ padding: '3px 8px', borderRadius: 4, background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255,255,255,0.05)', fontSize: 10, color: 'var(--t2)', cursor: 'pointer', transition: 'all var(--ease)' }}
                          >
                            Copy JSON
                          </button>
                          <button 
                            onClick={() => handleOpenEdit(doc)}
                            style={{ padding: '3px 8px', borderRadius: 4, background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255,255,255,0.05)', fontSize: 10, color: 'var(--t2)', cursor: 'pointer', transition: 'all var(--ease)' }}
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => handleDeleteDoc(doc._id)}
                            style={{ padding: '3px 8px', borderRadius: 4, background: 'rgba(255, 51, 102, 0.1)', border: '1px solid rgba(255, 51, 102, 0.15)', fontSize: 10, color: 'var(--red)', cursor: 'pointer', transition: 'all var(--ease)' }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      
                      {/* Document Snippet */}
                      <pre 
                        style={{ 
                          margin: 0, 
                          fontFamily: 'var(--fmono)', 
                          fontSize: 11, 
                          color: 'var(--t2)', 
                          maxHeight: 120, 
                          overflowY: 'auto',
                          whiteSpace: 'pre-wrap'
                        }}
                      >
                        {JSON.stringify(doc, null, 2)}
                      </pre>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pagination footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderTop: '1px solid rgba(255, 255, 255, 0.05)', background: 'rgba(0, 0, 0, 0.15)', flexShrink: 0 }}>
              <span style={{ fontSize: 11, color: 'var(--t3)' }}>
                Showing skip <strong style={{ color: 'var(--t1)' }}>{skip}</strong> to <strong style={{ color: 'var(--t1)' }}>{skip + documents.length}</strong>
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button 
                  disabled={skip === 0} 
                  onClick={handlePrevPage}
                  style={{
                    padding: '4px 12px',
                    borderRadius: 6,
                    fontSize: 11,
                    background: skip === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.04)',
                    color: skip === 0 ? 'var(--t4)' : 'var(--t2)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    cursor: skip === 0 ? 'not-allowed' : 'pointer',
                    transition: 'all var(--ease)'
                  }}
                >
                  ◀ Prev
                </button>
                <button 
                  disabled={!hasMore} 
                  onClick={handleNextPage}
                  style={{
                    padding: '4px 12px',
                    borderRadius: 6,
                    fontSize: 11,
                    background: !hasMore ? 'transparent' : 'rgba(255, 255, 255, 0.04)',
                    color: !hasMore ? 'var(--t4)' : 'var(--t2)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    cursor: !hasMore ? 'not-allowed' : 'pointer',
                    transition: 'all var(--ease)'
                  }}
                >
                  Next ▶
                </button>
              </div>
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--t3)', gap: 12 }}>
            <span style={{ fontSize: 32 }}>⚡</span>
            <span style={{ fontSize: 13, fontWeight: 500 }}>Select a collection from the cluster to view documents</span>
          </div>
        )}
      </div>

      {/* Edit/Insert Document Modal */}
      {showEditModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1600
        }}>
          <div className={S.panel} style={{ width: 560, height: 480 }}>
            <div className={S.hdr}>
              <div className={S.hdrLeft}>
                <span>{editingDocId ? 'Edit Document' : 'Insert Document'}</span>
              </div>
              <button className={S.closeBtn} onClick={() => setShowEditModal(false)}>×</button>
            </div>
            
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <Editor
                height="100%"
                language="json"
                theme="vs-dark"
                value={editingDoc}
                onChange={val => setEditingDoc(val || '')}
                options={{
                  minimap: { enabled: false },
                  fontSize: 12,
                  automaticLayout: true,
                  formatOnPaste: true,
                  tabSize: 2,
                  scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 }
                }}
              />
            </div>
            
            <div className={S.footer}>
              <button className={S.resetBtn} onClick={() => setShowEditModal(false)}>Cancel</button>
              <button className={S.saveBtn} onClick={handleSaveDoc}>Save Document</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ───────────────────────────────────────────────────────────────────────────
   2. CUSTOM API CLIENT COMPONENT (POSTMAN-STYLE)
   ─────────────────────────────────────────────────────────────────────────── */
function ApiClient({ notify }) {
  const [method, setMethod] = useState('GET')
  const [url, setUrl] = useState('https://jsonplaceholder.typicode.com/todos/1')
  
  // Headers Grid
  const [headers, setHeaders] = useState([
    { key: 'Accept', value: 'application/json', enabled: true },
    { key: 'Content-Type', value: 'application/json', enabled: true }
  ])

  // Request Body
  const [reqBody, setReqBody] = useState('{\n  \n}')
  const [bodyTab, setBodyTab] = useState('json')

  // Response details
  const [resLoading, setResLoading] = useState(false)
  const [response, setResponse] = useState(null)
  
  // Tab within params
  const [paramTab, setParamTab] = useState('headers')

  const handleAddHeader = () => {
    setHeaders(prev => [...prev, { key: '', value: '', enabled: true }])
  }

  const handleRemoveHeader = (idx) => {
    setHeaders(prev => prev.filter((_, i) => i !== idx))
  }

  const handleHeaderChange = (idx, field, value) => {
    setHeaders(prev => prev.map((h, i) => i === idx ? { ...h, [field]: value } : h))
  }

  const handleSendRequest = async () => {
    if (!url.trim()) {
      notify?.('error', 'Please enter a request URL.')
      return
    }

    setResLoading(true)
    setResponse(null)

    const reqHeaders = {}
    headers.forEach(h => {
      if (h.enabled && h.key.trim()) {
        reqHeaders[h.key.trim()] = h.value
      }
    })

    const res = await apiProxyRequest(url.trim(), method, reqHeaders, bodyTab === 'json' ? reqBody : '')
    setResponse(res)
    setResLoading(false)
  }

  return (
    <div style={{ display: 'flex', flex: 1, flexDirection: 'column', overflow: 'hidden', background: 'var(--bg2)' }}>
      {/* URL Selector Toolbar */}
      <div style={{ display: 'flex', gap: 8, padding: 12, borderBottom: '1px solid rgba(255, 255, 255, 0.05)', alignItems: 'center' }}>
        <select 
          value={method} 
          onChange={e => setMethod(e.target.value)}
          className={S.select} 
          style={{ width: 100, height: 34, padding: '0 8px', fontSize: 13, border: '1px solid rgba(255, 255, 255, 0.08)', outline: 'none' }}
        >
          <option>GET</option>
          <option>POST</option>
          <option>PUT</option>
          <option>DELETE</option>
          <option>PATCH</option>
        </select>
        
        <input 
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="https://api.example.com/endpoint"
          style={{
            flex: 1,
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 8,
            padding: '7px 12px',
            fontSize: 13,
            color: 'var(--t1)',
            height: 34,
            outline: 'none'
          }}
          onKeyDown={e => e.key === 'Enter' && handleSendRequest()}
        />
        
        <button 
          className={S.saveBtn} 
          onClick={handleSendRequest}
          disabled={resLoading}
          style={{ width: 100, height: 34, padding: 0, borderRadius: 8, fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          {resLoading ? 'Sending...' : 'Send'}
        </button>
      </div>

      {/* Main content grid splitter */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left: Request Params & Configuration */}
        <div style={{ width: '45%', borderRight: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Subheaders/Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', background: 'rgba(0, 0, 0, 0.15)' }}>
            <button 
              onClick={() => setParamTab('headers')}
              style={{
                flex: 1,
                padding: '10px',
                fontSize: 12.5,
                fontWeight: 600,
                color: paramTab === 'headers' ? 'var(--ac)' : 'var(--t2)',
                borderBottom: paramTab === 'headers' ? '2px solid var(--ac)' : '2px solid transparent',
                background: 'transparent',
                cursor: 'pointer',
                transition: 'all var(--ease)'
              }}
            >
              Headers ({headers.length})
            </button>
            <button 
              onClick={() => setParamTab('body')}
              style={{
                flex: 1,
                padding: '10px',
                fontSize: 12.5,
                fontWeight: 600,
                color: paramTab === 'body' ? 'var(--ac)' : 'var(--t2)',
                borderBottom: paramTab === 'body' ? '2px solid var(--ac)' : '2px solid transparent',
                background: 'transparent',
                cursor: 'pointer',
                transition: 'all var(--ease)'
              }}
            >
              Body Payload
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
            {paramTab === 'headers' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', letterSpacing: '.06em', textTransform: 'uppercase' }}>HTTP Request Headers</span>
                  <button onClick={handleAddHeader} style={{ fontSize: 11, color: 'var(--ac)', background: 'transparent', fontWeight: 600, cursor: 'pointer' }}>+ Add Row</button>
                </div>
                {headers.map((h, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <input 
                      type="checkbox" 
                      checked={h.enabled} 
                      onChange={e => handleHeaderChange(idx, 'enabled', e.target.checked)}
                      style={{ cursor: 'pointer' }}
                    />
                    <input 
                      value={h.key}
                      onChange={e => handleHeaderChange(idx, 'key', e.target.value)}
                      placeholder="Header Name"
                      style={{ flex: 1, background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 6, padding: '6px 10px', fontSize: 12, color: 'var(--t1)', outline: 'none' }}
                    />
                    <input 
                      value={h.value}
                      onChange={e => handleHeaderChange(idx, 'value', e.target.value)}
                      placeholder="Value"
                      style={{ flex: 1, background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 6, padding: '6px 10px', fontSize: 12, color: 'var(--t1)', outline: 'none' }}
                    />
                    <button onClick={() => handleRemoveHeader(idx)} style={{ color: 'var(--red)', background: 'transparent', fontSize: 18, padding: '0 4px', cursor: 'pointer' }}>×</button>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div style={{ display: 'flex', gap: 10, marginBottom: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', letterSpacing: '.06em', textTransform: 'uppercase' }}>Body Type:</span>
                  <div style={{ display: 'flex', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: 8, padding: 2, gap: 2 }}>
                    <button onClick={() => setBodyTab('none')} style={{ fontSize: 10, padding: '3px 8px', borderRadius: 6, background: bodyTab === 'none' ? 'var(--acg)' : 'transparent', color: bodyTab === 'none' ? 'var(--ac)' : 'var(--t2)', cursor: 'pointer', transition: 'all var(--ease)' }}>none</button>
                    <button onClick={() => setBodyTab('json')} style={{ fontSize: 10, padding: '3px 8px', borderRadius: 6, background: bodyTab === 'json' ? 'var(--acg)' : 'transparent', color: bodyTab === 'json' ? 'var(--ac)' : 'var(--t2)', cursor: 'pointer', transition: 'all var(--ease)' }}>JSON</button>
                  </div>
                </div>
                {bodyTab === 'json' ? (
                  <div style={{ flex: 1, minHeight: 180, border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: 8, overflow: 'hidden' }}>
                    <Editor
                      height="100%"
                      language="json"
                      theme="vs-dark"
                      value={reqBody}
                      onChange={val => setReqBody(val || '')}
                      options={{
                        minimap: { enabled: false },
                        fontSize: 11,
                        automaticLayout: true,
                        scrollbar: { verticalScrollbarSize: 4, horizontalScrollbarSize: 4 }
                      }}
                    />
                  </div>
                ) : (
                  <div style={{ padding: 20, textAlign: 'center', border: '1px dashed rgba(255, 255, 255, 0.1)', borderRadius: 8, color: 'var(--t3)', fontSize: 12 }}>
                    This request does not send an HTTP body payload.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Response Viewer */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 12 }}>
          {resLoading ? (
            <div style={{ display: 'flex', flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--t3)', gap: 8 }}>
              <span style={{ fontSize: 24, animation: 'spin 2s linear infinite' }}>⏳</span>
              <span style={{ fontSize: 13 }}>Sending HTTP Request...</span>
            </div>
          ) : response ? (
            <div style={{ display: 'flex', flex: 1, flexDirection: 'column', overflow: 'hidden' }}>
              {/* Response Stats */}
              <div style={{ display: 'flex', gap: 14, alignItems: 'center', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: 8, padding: '8px 12px', marginBottom: 10 }}>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 12 }}>
                  <span style={{ color: 'var(--t3)' }}>Status:</span>
                  <span 
                    style={{ 
                      padding: '2px 8px', 
                      borderRadius: 4, 
                      fontWeight: 700,
                      background: response.status >= 200 && response.status < 300 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 51, 102, 0.15)',
                      color: response.status >= 200 && response.status < 300 ? 'var(--green)' : 'var(--red)'
                    }}
                  >
                    {response.status} {response.status_text || ''}
                  </span>
                </div>

                {response.time_ms !== undefined && (
                  <div style={{ fontSize: 12 }}>
                    <span style={{ color: 'var(--t3)' }}>Time: </span>
                    <strong style={{ color: 'var(--t2)' }}>{response.time_ms} ms</strong>
                  </div>
                )}

                {response.size_bytes !== undefined && (
                  <div style={{ fontSize: 12 }}>
                    <span style={{ color: 'var(--t3)' }}>Size: </span>
                    <strong style={{ color: 'var(--t2)' }}>{(response.size_bytes / 1024).toFixed(2)} KB</strong>
                  </div>
                )}
              </div>

              {/* Response Body Monaco */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 6 }}>Response Body</span>
                <div style={{ flex: 1, border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: 8, overflow: 'hidden' }}>
                  <Editor
                    height="100%"
                    language={typeof response.body === 'object' ? 'json' : 'plaintext'}
                    theme="vs-dark"
                    value={typeof response.body === 'object' ? JSON.stringify(response.body, null, 2) : response.body || ''}
                    options={{
                      readOnly: true,
                      minimap: { enabled: false },
                      fontSize: 12,
                      automaticLayout: true,
                      scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 }
                    }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--t3)', gap: 10, border: '1px dashed rgba(255, 255, 255, 0.1)', borderRadius: 8 }}>
              <span style={{ fontSize: 32 }}>📡</span>
              <span style={{ fontSize: 13, fontWeight: 500 }}>Enter an endpoint and hit Send to test API responses</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
