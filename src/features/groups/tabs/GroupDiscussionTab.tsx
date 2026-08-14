import { useEffect, useRef, useState } from 'react'
import { Send, WifiOff, RefreshCw, Loader2 } from 'lucide-react'
import { useOfflineMessages } from '@/features/messages/useOfflineMessages'
import { useAuth } from '@/features/auth/AuthContext'

export default function GroupDiscussionTab({ groupId }: { groupId: string }) {
  const { user, profile } = useAuth()
  const { messages, loading, online, pending, send } = useOfflineMessages(groupId, user?.id)
  const [text, setText] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  async function handleSend() {
    if (!text.trim()) return
    await send(text)
    setText('')
  }

  return (
    <div className="flex flex-col h-[calc(100vh-220px)]">
      {!online && (
        <div className="mx-4 mt-2 bg-status-pending/10 border border-status-pending/30 text-status-pending text-xs rounded-lg px-3 py-2 flex items-center gap-2">
          <WifiOff className="w-3.5 h-3.5" />
          Hors-ligne — tes messages sont enregistrés et seront envoyés dès que la connexion revient.
        </div>
      )}
      {online && pending && (
        <div className="mx-4 mt-2 bg-accent/10 border border-accent/30 text-accent-soft text-xs rounded-lg px-3 py-2 flex items-center gap-2">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          Synchronisation des messages en attente...
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {loading && <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-slate-500" /></div>}
        {!loading && messages.length === 0 && (
          <p className="text-center text-slate-500 text-sm py-8">Aucun message. Démarre la discussion du groupe.</p>
        )}
        {messages.map((m) => {
          const isMine = m.author_id === user?.id
          const isLocalOnly = m.id.startsWith('local-')
          return (
            <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${
                  isMine ? 'bg-accent text-white rounded-br-sm' : 'bg-base-800 text-slate-100 rounded-bl-sm'
                }`}
              >
                <p>{m.content}</p>
                <p className={`text-[10px] mt-1 ${isMine ? 'text-blue-100/70' : 'text-slate-500'}`}>
                  {new Date(m.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  {isLocalOnly && ' · en attente d\'envoi'}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <div className="p-3 border-t border-base-700 flex gap-2 shrink-0">
        <input
          className="input-field flex-1"
          placeholder={online ? 'Écrire un message...' : 'Écrire (sera envoyé hors-ligne)...'}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        />
        <button onClick={handleSend} className="btn-primary px-3.5" disabled={!text.trim() || !profile}>
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
