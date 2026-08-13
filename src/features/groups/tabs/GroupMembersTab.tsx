import { useEffect, useState } from 'react'
import { UserMinus, Loader2 } from 'lucide-react'
import { listGroupMembers, removeGroupMember } from '../groupsService'
import type { GroupMember } from '@/types'

export default function GroupMembersTab({ groupId }: { groupId: string }) {
  const [members, setMembers] = useState<GroupMember[]>([])
  const [loading, setLoading] = useState(true)

  function load() {
    setLoading(true)
    listGroupMembers(groupId).then(setMembers).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [groupId])

  async function handleRemove(memberId: string) {
    if (!confirm('Retirer ce membre du groupe ?')) return
    await removeGroupMember(memberId, groupId)
    load()
  }

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-slate-500" /></div>
  }

  return (
    <div className="p-4 space-y-2">
      {members.length === 0 && (
        <div className="card text-center py-8 text-slate-500">Aucun membre pour l'instant.</div>
      )}
      {members.map((m) => (
        <div key={m.id} className="card flex items-center justify-between">
          <div>
            <p className="font-medium text-sm">{m.profile?.full_name ?? 'Utilisateur'}</p>
            <p className="text-xs text-slate-500">{m.role_in_group}</p>
          </div>
          <button onClick={() => handleRemove(m.id)} className="p-2 text-slate-400 hover:text-status-blocked">
            <UserMinus className="w-4 h-4" />
          </button>
        </div>
      ))}
      <p className="text-xs text-slate-600 pt-2">
        L'ajout de membres se fait depuis Administration → Utilisateurs, ou par le responsable du groupe.
      </p>
    </div>
  )
}
