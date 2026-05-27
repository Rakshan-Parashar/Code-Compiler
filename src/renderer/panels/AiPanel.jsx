import React,{useState}from'react'
import S from'./Panel.module.css'

export default function AiPanel({ activeFile,onClose,notify,onInsert }){
  const[query,setQuery]=useState('')

  const handleSubmit=e=>{
    e.preventDefault()
    if(!query.trim()){notify?.('error','Enter a prompt');return}
    onInsert(query)
    notify?.('success','AI code inserted')
    setQuery('')
  }

  return(
    <div className={S.backdrop} onMouseDown={e=>e.target===e.currentTarget&&onClose()}>
      <div className={S.panel} style={{ width: 520, maxHeight: '80vh' }}>
        <div className={S.hdr}>
          <div className={S.hdrLeft}><span>AI Assistant</span></div>
          <button className={S.closeBtn} onClick={onClose}>×</button>
        </div>
        <div className={S.body}>
          <p style={{ marginBottom: 12 }}>
            Generate or insert code snippets for the current file.
          </p>
          <form onSubmit={handleSubmit}>
            <textarea
              value={query}
              onChange={e=>setQuery(e.target.value)}
              placeholder="Ask the AI to generate code..."
              className={S.textArea}
              style={{ width: '100%', minHeight: 160, marginBottom: 12 }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button type="button" className={S.resetBtn} onClick={onClose}>Cancel</button>
              <button type="submit" className={S.saveBtn}>Insert</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
