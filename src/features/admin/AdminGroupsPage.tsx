import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Pencil, Archive, ArchiveRestore, Trash2, Users, Loader2 } from 'lucide-react'
import { useGroups } from '@/features/groups/useGroups'
import GroupFormModal from '@/features/groups/GroupFormModal'
import { archiveGroup, restoreGroup, deleteGroup, getGroup } from '@/features/groups/groupsService'
import type { Group, GroupStatus } from '@/types'

// ADMIN → GROUPES → GÉRER LES GROUPES
// Aucune liste de groupes n'est codée en dur : tout vient de useGroups().
export default function AdminGroupsPage() {
  const [statusFilter, setStatusFilter] = useState<GroupStatus | 'ALL'>('ALL')
  const { groups, loading, reload, count } = useGroups(statusFilter)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Group | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [loadingEdit, setLoadingEdit] = useState(false)

  async function handleEdit(groupId: string) {
    setLoadingEdit(true)
    try {
      const full = await getGroup(groupId)
      setEditing(full)
      setModalOpen(true)
    } finally {
      setLoadingEdit(false)
    }
  }

  async function handleArchive(id: string) {
    setBusyId(id)
    try {
      await archiveGroup(id)
      await reload()
    } finally {
      setBusyId(null)
    }
  }

  async function handleRestore(id: string) {
    setBusyId(id)
    try {
      await restoreGroup(id)
      await reload()
    } finally {
      setBusyId(null)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer définitivement ce groupe et toutes ses données ? Cette action est irréversible.\n\nConseil : préférez « Archiver » pour conserver les données.')) return
    setBusyId(id)
    try {
      await deleteGroup(id)
      await reload()
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="p-4 space-y-4 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Gestion des groupes</h1>
          <p className="text-sm text-slate-400">{count} groupe{count > 1 ? 's' : ''} {statusFilter !== 'ALL' ? `(${statusFilter === 'ACTIVE' ? 'actifs' : 'archivés'})` : ''}</p>
        </div>
        <button
          onClick={() => { setEditing(null); setModalOpen(true) }}
          className="btn-primary flex items-center gap-1.5 text-sm"
        >
          <Plus className="w-4 h-4" /> Créer un groupe
        </button>
      </div>

      <div className="flex gap-2">
        {(['ALL', 'ACTIVE', 'ARCHIVED'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-full text-sm ${statusFilter === s ? 'bg-accent text-white' : 'bg-base-800 text-slate-400'}`}
          >
            {s === 'ALL' ? 'Tous' : s === 'ACTIVE' ? 'Actifs' : 'Archivés'}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex justify-center py-12 text-slate-500">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      )}

      {!loading && groups.length === 0 && (
        <div className="card text-center py-10 text-slate-500">
          Aucun groupe pour l'instant. Créez le premier groupe pour démarrer.
        </div>
      )}

      <div className="space-y-2">
        {groups.map((g) => (
          <div key={g.group_id} className="card flex items-center justify-between gap-3">
            <Link to={`/groups/${g.group_id}`} className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                {g.code && <span className="badge bg-base-700 text-slate-300">#{g.code}</span>}
                <span className="font-medium truncate">{g.name}</span>
                {g.status === 'ARCHIVED' && <span className="badge bg-slate-600/30 text-slate-400">Archivé</span>}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {g.completed_tasks}/{g.total_tasks} tâches — {g.progress_percent}%
              </div>
            </Link>
            <div className="flex items-center gap-1">
              <Link to={`/groups/${g.group_id}`} className="p-2 text-slate-400 hover:text-white" title="Membres" aria-label="Voir les membres">
                <Users className="w-4 h-4" />
              </Link>
              <button
                onClick={() => handleEdit(g.group_id)}
                disabled={loadingEdit}
                className="p-2 text-slate-400 hover:text-white disabled:opacity-50"
                title="Modifier"
                aria-label="Modifier le groupe"
              >
                <Pencil className="w-4 h-4" />
              </button>
              {g.status === 'ACTIVE' ? (
                <button disabled={busyId === g.group_id} onClick={() => handleArchive(g.group_id)} className="p-2 text-slate-400 hover:text-status-pending" title="Archiver" aria-label="Archiver le groupe">
                  <Archive className="w-4 h-4" />
                </button>
              ) : (
                <button disabled={busyId === g.group_id} onClick={() => handleRestore(g.group_id)} className="p-2 text-slate-400 hover:text-status-ready" title="Restaurer" aria-label="Restaurer le groupe">
                  <ArchiveRestore className="w-4 h-4" />
                </button>
              )}
              <button disabled={busyId === g.group_id} onClick={() => handleDelete(g.group_id)} className="p-2 text-slate-400 hover:text-status-blocked" title="Supprimer" aria-label="Supprimer le groupe">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {modalOpen && (
        <GroupFormModal
          group={editing}
          onClose={() => setModalOpen(false)}
          onSaved={reload}
        />
      )}
    </div>
  )
}
