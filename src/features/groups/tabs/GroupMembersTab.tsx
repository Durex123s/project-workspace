import { useEffect, useState } from 'react'
import { UserMinus, UserPlus, Users } from 'lucide-react'
import { listGroupMembers, removeGroupMember } from '../groupsService'
import AddMemberModal from '../AddMemberModal'
import type { GroupMember } from '@/types'
import { LoadingState, ErrorState, EmptyState, extractErrorMessage } from '@/components/StateViews'

export default function GroupMembersTab({ groupId }: { groupId: string }) {
  const [members, setMembers] = useState<GroupMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)

  function load() {
    setLoading(true)
    setError(null)
    listGroupMembers(groupId)
      .then(setMembers)
      .catch((e) => setError(extractErrorMessage(e)))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [groupId])

  async function handleRemove(memberId: string) {
    if (!confirm('Retirer ce membre du groupe ?')) return
    try {
      await removeGroupMember(memberId, groupId)
      load()
    } catch (e) {
      setError(extractErrorMessage(e))
    }
  }

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} onRetry={load} />

  return (
    <div className="p-4 space-y-2">
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-medium text-sm text-slate-300">Membres ({members.length})</h3>
        <button onClick={() => setShowAdd(true)} className="btn-secondary text-sm flex items-center gap-1.5">
          <UserPlus className="w-4 h-4" /> Ajouter
        </button>
      </div>

      {members.length === 0 && <EmptyState message="Aucun membre pour l'instant." icon={Users} />}
      {members.map((m) => (
        <div key={m.id} className="card flex items-center justify-between">
          <div>
            <p className="font-medium text-sm">{m.profile?.full_name ?? 'Utilisateur'}</p>
            <p className="text-xs text-slate-500">{m.role_in_group}</p>
          </div>
          <button onClick={() => handleRemove(m.id)} className="p-2 text-slate-400 hover:text-status-blocked" aria-label="Retirer ce membre">
            <UserMinus className="w-4 h-4" />
          </button>
        </div>
      ))}

      {showAdd && (
        <AddMemberModal
          groupId={groupId}
          existingMembers={members}
          onClose={() => setShowAdd(false)}
          onAdded={load}
        />
      )}
    </div>
  )
}
