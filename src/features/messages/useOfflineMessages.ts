import { useCallback, useEffect, useState } from 'react'
import { loadMessages, sendMessage, syncQueue, isOnline, hasPendingMessages, subscribeToGroupMessages } from './messagesService'
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

  // Souscription Realtime : les messages des autres membres du groupe
  // apparaissent en direct, sans attendre un rechargement manuel.
  useEffect(() => {
    const unsubscribe = subscribeToGroupMessages(groupId, (incoming) => {
      setMessages((prev) => {
        const idx = prev.findIndex((m) => m.client_id && m.client_id === incoming.client_id)
        if (idx >= 0) {
          // Remplace la version optimiste locale par la version confirmée du serveur.
          const next = [...prev]
          next[idx] = incoming
          return next
        }
        if (prev.some((m) => m.id === incoming.id)) return prev
        return [...prev, incoming]
      })
      setPending(hasPendingMessages(groupId))
    })
    return unsubscribe
  }, [groupId])

  return { messages, loading, online, pending, send, reload }
}
