import { useEffect, useState } from 'react'
import { Plus, Trash2, GitBranch, X, Loader2 } from 'lucide-react'
import { listDependencies, createDependency, updateDependencyStatus, deleteDependency, type DependencyWithGroups } from './dependenciesService'
import { listGroups } from '@/features/groups/groupsService'
import { useAuth } from '@/features/auth/AuthContext'
import type { Group, DependencyStatus } from '@/types'
import { LoadingState, ErrorState, EmptyState, extractErrorMessage } from '@/components/StateViews'

const STATUS_CONFIG: Record<DependencyStatus, { label: string; dot: string; badge: string }> = {
  READY: { label: 'Prêt', dot: '🟢', badge: 'bg-status-ready/20 text-status-ready' },
  PENDING: { label: 'En attente', dot: '🟡', badge: 'bg-status-pending/20 text-status-pending' },
  BLOCKED: { label: 'Bloqué', dot: '🔴', badge: 'bg-status-blocked/20 text-status-blocked' }
}

export default function AdminDependenciesPage() {
  const { user, profile } = useAuth()
  const isAdmin = profile?.global_role === 'ADMIN'

  const [deps, setDeps] = useState<DependencyWithGroups[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [fromId, setFromId] = useState('')
  const [toId, setToId] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  function load() {
    setLoading(true)
    setError(null)
    Promise.all([listDependencies(), listGroups('ALL')])
      .then(([d, g]) => {
        setDeps(d)
        setGroups(g)
      })
      .catch((e) => setError(extractErrorMessage(e)))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  async function handleCreate() {
    if (!fromId || !toId || !user) return
    if (fromId === toId) {
      setFormError('Un groupe ne peut pas dépendre de lui-même.')
      return
    }
    setSaving(true)
    setFormError(null)
    try {
      await createDependency(fromId, toId, user.id, 'PENDING', note || undefined)
      setFromId('')
      setToId('')
      setNote('')
      setShowForm(false)
      load()
    } catch (e) {
      setFormError(extractErrorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  async function handleStatusChange(id: string, status: DependencyStatus) {
    try {
      await updateDependencyStatus(id, status)
      load()
    } catch (e) {
      setError(extractErrorMessage(e))
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer cette dépendance ?')) return
    try {
      await deleteDependency(id)
      load()
    } catch (e) {
      setError(extractErrorMessage(e))
    }
  }

  if (loading) return <div className="p-4 sm:p-6"><LoadingState /></div>
  if (error) return <div className="p-4 sm:p-6"><ErrorState message={error} onRetry={load} /></div>

  return (
    <div className="p-4 sm:p-6 space-y-4 pb-24 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Dépendances entre groupes</h1>
          <p className="text-sm text-slate-400">{deps.length} dépendance{deps.length > 1 ? 's' : ''}</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowForm(true)} className="btn-primary text-sm flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> Ajouter
          </button>
        )}
      </div>

      {!isAdmin && (
        <p className="text-xs text-slate-500">Lecture seule — seul un administrateur peut créer ou modifier des dépendances.</p>
      )}

      {deps.length === 0 && (
        <EmptyState message="Aucune dépendance définie entre les groupes." icon={GitBranch} />
      )}

      <div className="space-y-2">
        {deps.map((d) => {
          const cfg = STATUS_CONFIG[d.status]
          return (
            <div key={d.id} className="card">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0 text-sm">
                  <span className="font-medium truncate">{d.from_group?.code ? `#${d.from_group.code}` : d.from_group?.name}</span>
                  <GitBranch className="w-3.5 h-3.5 text-slate-600 rotate-90 shrink-0" />
                  <span className="font-medium truncate">{d.to_group?.code ? `#${d.to_group.code}` : d.to_group?.name}</span>
                </div>
                {isAdmin && (
                  <button onClick={() => handleDelete(d.id)} className="p-1 text-slate-500 hover:text-status-blocked shrink-0" aria-label="Supprimer la dépendance">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              {d.note && <p className="text-xs text-slate-500 mt-1">{d.note}</p>}
              <div className="mt-2 flex items-center gap-2">
                {isAdmin ? (
                  <select
                    value={d.status}
                    onChange={(e) => handleStatusChange(d.id, e.target.value as DependencyStatus)}
                    className={`text-xs rounded-full px-2 py-0.5 border-0 ${cfg.badge}`}
                  >
                    {(Object.keys(STATUS_CONFIG) as DependencyStatus[]).map((s) => (
                      <option key={s} value={s}>{cfg.dot} {STATUS_CONFIG[s].label}</option>
                    ))}
                  </select>
                ) : (
                  <span className={`badge ${cfg.badge}`}>{cfg.dot} {cfg.label}</span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-base-800 border border-base-600 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm">
            <div className="flex items-center justify-between p-4 border-b border-base-700">
              <h2 className="font-semibold">Nouvelle dépendance</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white" aria-label="Fermer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              {formError && (
                <div className="bg-status-blocked/10 border border-status-blocked/30 text-status-blocked text-sm rounded-lg px-3 py-2">
                  {formError}
                </div>
              )}
              <div>
                <label className="block text-xs text-slate-500 mb-1">Groupe (dépend de)</label>
                <select className="input-field" value={fromId} onChange={(e) => setFromId(e.target.value)}>
                  <option value="">Sélectionner...</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>{g.code ? `#${g.code} — ` : ''}{g.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Dépend de ce groupe</label>
                <select className="input-field" value={toId} onChange={(e) => setToId(e.target.value)}>
                  <option value="">Sélectionner...</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>{g.code ? `#${g.code} — ` : ''}{g.name}</option>
                  ))}
                </select>
              </div>
              <input
                className="input-field"
                placeholder="Note (optionnel)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              <button
                onClick={handleCreate}
                disabled={saving || !fromId || !toId}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Créer la dépendance
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
