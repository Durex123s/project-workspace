import { useCallback, useEffect, useState } from 'react'
import { loadMessages, sendMessage, syncQueue, isOnline, hasPendingMessages } from './messagesService'
import type { GroupMessage } from '@/types'

export function useOfflineMessages(groupId: string, authorId: string | undefined) {
  const [messages, setMessages] = useState<GroupMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [online, setOnline] = useState(isOnline())
  const [pending, setPending] = useState(false)

  const reload = useCallback(async () => {
    const data = await loadMessages(groupId)
    setMessages(data)
    setPending(hasPendingMessages(groupId))
  }, [groupId])

  useEffect(() => {
    setLoading(true)
    reload().finally(() => setLoading(false))
  }, [reload])

  // Détecte les changements de connexion et synchronise automatiquement.
  useEffect(() => {
    async function handleOnline() {
      setOnline(true)
      const synced = await syncQueue(groupId)
      if (synced > 0) await reload()
      else setPending(hasPendingMessages(groupId))
    }
    function handleOffline() {
      setOnline(false)
    }
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [groupId, reload])

  const send = useCallback(
    async (content: string) => {
      if (!authorId || !content.trim()) return
      const optimistic = await sendMessage(groupId, authorId, content.trim())
      setMessages((prev) => [...prev, optimistic])
      setPending(hasPendingMessages(groupId))
    },
    [groupId, authorId]
  )

  return { messages, loading, online, pending, send, reload }
}
