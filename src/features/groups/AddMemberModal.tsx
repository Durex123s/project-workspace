import { useEffect, useMemo, useState } from 'react'
import { X, UserPlus, Loader2, Search } from 'lucide-react'
import { listAllProfiles } from '@/features/profile/profilesService'
import { addGroupMember } from '../groupsService'
import type { Profile, GroupMember } from '@/types'

interface Props {
  groupId: string
  existingMembers: GroupMember[]
  onClose: () => void
  onAdded: () => void
}

export default function AddMemberModal({ groupId, existingMembers, onClose, onAdded }: Props) {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [addingId, setAddingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listAllProfiles().then(setProfiles).finally(() => setLoading(false))
  }, [])

  const existingIds = useMemo(() => new Set(existingMembers.map((m) => m.user_id)), [existingMembers])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    return profiles
      .filter((p) => !existingIds.has(p.id))
      .filter((p) => !q || p.full_name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q))
  }, [profiles, existingIds, query])

  async function handleAdd(userId: string) {
    setAddingId(userId)
    setError(null)
    try {
      await addGroupMember(groupId, userId, 'MEMBER')
      onAdded()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur lors de l'ajout")
    } finally {
      setAddingId(null)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-base-800 border border-base-600 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-base-700 shrink-0">
          <h2 className="font-semibold">Ajouter un membre</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 shrink-0">
          {error && (
            <div className="bg-status-blocked/10 border border-status-blocked/30 text-status-blocked text-sm rounded-lg px-3 py-2 mb-3">
              {error}
            </div>
          )}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              autoFocus
              className="input-field pl-9"
              placeholder="Rechercher par nom ou email"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-1.5">
          {loading && (
            <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-slate-500" /></div>
          )}
          {!loading && results.length === 0 && (
            <p className="text-sm text-slate-500 text-center py-8">Aucun utilisateur trouvé.</p>
          )}
          {results.map((p) => (
            <div key={p.id} className="flex items-center justify-between bg-base-900 rounded-lg px-3 py-2.5">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{p.full_name}</p>
                <p className="text-xs text-slate-500 truncate">{p.email}</p>
              </div>
              <button
                onClick={() => handleAdd(p.id)}
                disabled={addingId === p.id}
                className="shrink-0 p-2 text-accent-soft hover:text-white disabled:opacity-50"
              >
                {addingId === p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
