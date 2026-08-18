import { useEffect, useState } from 'react'
import { Plus, X, Loader2, AlertCircle } from 'lucide-react'
import { listTasksForGroup, updateTaskStatus, createTask } from './tasksService'
import { listGroupMembers } from '@/features/groups/groupsService'
import type { GroupTask, TaskStatus, TaskPriority, GroupMember } from '@/types'
import { useAuth } from '@/features/auth/AuthContext'
import { LoadingState, ErrorState, extractErrorMessage } from '@/components/StateViews'

const COLUMNS: { status: TaskStatus; label: string }[] = [
  { status: 'TODO', label: 'À faire' },
  { status: 'IN_PROGRESS', label: 'En cours' },
  { status: 'IN_TEST', label: 'En test' },
  { status: 'DONE', label: 'Terminé' },
  { status: 'VALIDATED', label: 'Validé' }
]

const PRIORITIES: TaskPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']

const PRIORITY_COLOR: Record<string, string> = {
  LOW: 'bg-slate-600/30 text-slate-300',
  MEDIUM: 'bg-status-progress/20 text-status-progress',
  HIGH: 'bg-status-pending/20 text-status-pending',
  URGENT: 'bg-status-blocked/20 text-status-blocked'
}

const EMPTY_FORM = { title: '', description: '', priority: 'MEDIUM' as TaskPriority, due_date: '', assignee_id: '' }

function isOverdue(task: GroupTask) {
  if (!task.due_date) return false
  if (task.status === 'DONE' || task.status === 'VALIDATED') return false
  return new Date(task.due_date) < new Date(new Date().toDateString())
}

// Kanban générique — même composant pour n'importe quel groupId.
export default function GroupTasksTab({ groupId }: { groupId: string }) {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<GroupTask[]>([])
  const [members, setMembers] = useState<GroupMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  function load() {
    setLoading(true)
    setError(null)
    Promise.all([listTasksForGroup(groupId), listGroupMembers(groupId)])
      .then(([t, m]) => {
        setTasks(t)
        setMembers(m)
      })
      .catch((e) => setError(extractErrorMessage(e)))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [groupId])

  async function handleMove(task: GroupTask, status: TaskStatus) {
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status } : t)))
    try {
      await updateTaskStatus(task.id, groupId, status)
    } catch (e) {
      setError(extractErrorMessage(e))
      load()
    }
  }

  async function handleCreate() {
    if (!form.title.trim() || !user) return
    setSaving(true)
    setFormError(null)
    try {
      await createTask(
        {
          group_id: groupId,
          title: form.title,
          description: form.description || undefined,
          priority: form.priority,
          due_date: form.due_date || null,
          assignee_id: form.assignee_id || null
        },
        user.id
      )
      setForm(EMPTY_FORM)
      setShowForm(false)
      load()
    } catch (e) {
      setFormError(extractErrorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  function assigneeName(id: string | null) {
    if (!id) return null
    return members.find((m) => m.user_id === id)?.profile?.full_name ?? null
  }

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} onRetry={load} />

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-sm text-slate-300">Tâches ({tasks.length})</h3>
        <button onClick={() => setShowForm(true)} className="btn-secondary text-sm flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> Nouvelle tâche
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-base-800 border border-base-600 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-base-700">
              <h2 className="font-semibold">Nouvelle tâche</h2>
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
              <input
                autoFocus
                className="input-field"
                placeholder="Titre *"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
              <textarea
                className="input-field min-h-[70px]"
                placeholder="Description"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
              <div>
                <label className="block text-xs text-slate-500 mb-1">Priorité</label>
                <select
                  className="input-field"
                  value={form.priority}
                  onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as TaskPriority }))}
                >
                  {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Échéance</label>
                <input
                  type="date"
                  className="input-field"
                  value={form.due_date}
                  onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Responsable</label>
                <select
                  className="input-field"
                  value={form.assignee_id}
                  onChange={(e) => setForm((f) => ({ ...f, assignee_id: e.target.value }))}
                >
                  <option value="">Non assigné</option>
                  {members.map((m) => (
                    <option key={m.user_id} value={m.user_id}>{m.profile?.full_name ?? 'Membre'}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleCreate}
                disabled={saving || !form.title.trim()}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Créer la tâche
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
        {COLUMNS.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.status)
          return (
            <div key={col.status} className="min-w-[240px] flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">{col.label}</span>
                <span className="text-xs text-slate-600">{colTasks.length}</span>
              </div>
              <div className="space-y-2">
                {colTasks.map((task) => {
                  const overdue = isOverdue(task)
                  const assignee = assigneeName(task.assignee_id)
                  return (
                    <div key={task.id} className={`card !p-3 ${overdue ? 'border-status-blocked/50' : ''}`}>
                      <p className="text-sm font-medium">{task.title}</p>
                      {task.description && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{task.description}</p>}
                      <div className="flex items-center gap-1.5 flex-wrap mt-2">
                        <span className={`badge ${PRIORITY_COLOR[task.priority]}`}>{task.priority}</span>
                        {task.due_date && (
                          <span className={`badge ${overdue ? 'bg-status-blocked/20 text-status-blocked' : 'bg-base-700 text-slate-400'}`}>
                            {overdue && <AlertCircle className="w-3 h-3" />}
                            {new Date(task.due_date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                          </span>
                        )}
                        {assignee && <span className="badge bg-base-700 text-slate-400">{assignee}</span>}
                      </div>
                      <select
                        value={task.status}
                        onChange={(e) => handleMove(task, e.target.value as TaskStatus)}
                        className="text-xs bg-base-900 border border-base-600 rounded px-1.5 py-0.5 mt-2 w-full"
                      >
                        {COLUMNS.map((c) => (
                          <option key={c.status} value={c.status}>{c.label}</option>
                        ))}
                      </select>
                    </div>
                  )
                })}
                {colTasks.length === 0 && (
                  <div className="text-xs text-slate-600 text-center py-4 border border-dashed border-base-700 rounded-lg">
                    Vide
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
