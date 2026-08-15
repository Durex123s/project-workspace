import { useEffect, useRef, useState } from 'react'
import { Bell, Check, CheckCheck } from 'lucide-react'
import { listMyNotifications, getUnreadCount, markAsRead, markAllAsRead, type AppNotification } from './notificationsService'

function timeAgo(dateStr: string) {
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const min = Math.floor(diffMs / 60000)
  if (min < 1) return "à l'instant"
  if (min < 60) return `il y a ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `il y a ${h} h`
  return `il y a ${Math.floor(h / 24)} j`
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [unread, setUnread] = useState(0)
  const [items, setItems] = useState<AppNotification[]>([])
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  function refreshCount() {
    getUnreadCount().then(setUnread).catch(() => {})
  }

  useEffect(() => {
    refreshCount()
    function handleFocus() { refreshCount() }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleOpen() {
    const next = !open
    setOpen(next)
    if (next) {
      setLoading(true)
      try {
        const data = await listMyNotifications()
        setItems(data)
      } finally {
        setLoading(false)
      }
    }
  }

  async function handleMarkOne(id: string) {
    await markAsRead(id)
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)))
    setUnread((u) => Math.max(0, u - 1))
  }

  async function handleMarkAll() {
    await markAllAsRead()
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })))
    setUnread(0)
  }

  return (
    <div className="relative" ref={ref}>
      <button onClick={handleOpen} className="relative p-2 text-slate-400 hover:text-white">
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-status-blocked text-white text-[10px] flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 max-w-[90vw] bg-base-800 border border-base-600 rounded-xl shadow-xl z-50 max-h-[70vh] overflow-y-auto">
          <div className="flex items-center justify-between p-3 border-b border-base-700">
            <span className="text-sm font-medium">Notifications</span>
            {unread > 0 && (
              <button onClick={handleMarkAll} className="text-xs text-accent-soft flex items-center gap-1">
                <CheckCheck className="w-3.5 h-3.5" /> Tout marquer lu
              </button>
            )}
          </div>

          {loading && <p className="text-sm text-slate-500 text-center py-6">Chargement...</p>}
          {!loading && items.length === 0 && (
            <p className="text-sm text-slate-500 text-center py-6">Aucune notification.</p>
          )}
          <div className="divide-y divide-base-700">
            {items.map((n) => (
              <div key={n.id} className={`p-3 flex gap-2 ${!n.is_read ? 'bg-accent/5' : ''}`}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{n.title}</p>
                  {n.body && <p className="text-xs text-slate-400 mt-0.5">{n.body}</p>}
                  <p className="text-[11px] text-slate-600 mt-1">{timeAgo(n.created_at)}</p>
                </div>
                {!n.is_read && (
                  <button onClick={() => handleMarkOne(n.id)} className="p-1 text-slate-500 hover:text-accent-soft shrink-0" title="Marquer comme lu">
                    <Check className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
