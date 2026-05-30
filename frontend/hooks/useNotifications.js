import { useState, useCallback } from 'react'

let _id = 0
export function useNotifications() {
  const [items, setItems] = useState([])

  const notify = useCallback((type, message, duration = 3800) => {
    const id = ++_id
    setItems(p => [...p.slice(-4), { id, type, message }])
    setTimeout(() => setItems(p => p.filter(n => n.id !== id)), duration)
  }, [])

  const dismiss = useCallback(id => setItems(p => p.filter(n => n.id !== id)), [])

  return { notify, notifications: items, dismiss }
}
