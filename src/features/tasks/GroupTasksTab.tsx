import { useEffect, useState } from 'react'
import { Plus, Loader2 } from 'lucide-react'
import { listTasksForGroup, updateTaskStatus, createTask } from './tasksService'
import type { GroupTask, TaskStatus } from '@/types'
import { useAuth } from '@/features/auth/AuthContext'

const COLUMNS: { status: TaskStatus; label: string }[] = [
  { status: 'TODO', label: 'À faire' },
  { status: 'IN_PROGRESS', label: 'En cours' },
  { status: 'IN_TEST', label: 'En test' },
  { status: 'DONE', label: 'Terminé' },
  { status: 'VALIDATED', label: 'Validé' }
]

const PRIORITY_COLOR: Record<string, string> = {
  LOW: 'bg-slate-600/30 text-slate-300',
  MEDIUM: 'bg-status-progress/20 text-status-progress',
  HIGH: 'bg-status-pending/20 text-status-pending',
  URGENT: 'bg-status-blocked/20 text-status-blocked'
}

// Kanban générique — même composant pour n'importe quel groupId.
export default function GroupTasksTab({ groupId }: { groupId: string }) {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<GroupTask[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')

  function load() {
    setLoading(true)
    listTasksForGroup(groupId).then(setTasks).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [groupId])

  async function handleMove(task: GroupTask, status: TaskStatus) {
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status } : t)))
    await updateTaskStatus(task.id, groupId, status)
  }

  async function handleCreate() {
    if (!title.trim() || !user) return
    await createTask({ group_id: groupId, title }, user.id)
    setTitle('')
    setShowForm(false)
    load()
  }

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-slate-500" /></div>
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-sm text-slate-300">Tâches ({tasks.length})</h3>
        <button onClick={() => setShowForm((s) => !s)} className="btn-secondary text-sm flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> Nouvelle tâche
        </button>
      </div>

      {showForm && (
        <div className="card mb-3 flex gap-2">
          <input
            className="input-field flex-1"
            placeholder="Titre de la tâche"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          />
          <button onClick={handleCreate} className="btn-primary text-sm">Ajouter</button>
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
                {colTasks.map((task) => (
                  <div key={task.id} className="card !p-3">
                    <p className="text-sm font-medium">{task.title}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className={`badge ${PRIORITY_COLOR[task.priority]}`}>{task.priority}</span>
                      <select
                        value={task.status}
                        onChange={(e) => handleMove(task, e.target.value as TaskStatus)}
                        className="text-xs bg-base-900 border border-base-600 rounded px-1.5 py-0.5"
                      >
                        {COLUMNS.map((c) => (
                          <option key={c.status} value={c.status}>{c.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
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
