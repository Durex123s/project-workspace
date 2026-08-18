import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { FileText, FlaskConical, Ruler, ClipboardCheck, MessageSquare, ChevronRight } from 'lucide-react'
import type { Group, GroupProgress } from '@/types'
import { getGroupProgress, getGroupOverviewCounts, type GroupOverviewCounts } from '../groupsService'
import { LoadingState, ErrorState, extractErrorMessage } from '@/components/StateViews'

export default function GroupOverviewTab({ group }: { group: Group }) {
  const { groupId } = useParams<{ groupId: string }>()
  const [progress, setProgress] = useState<GroupProgress | null>(null)
  const [counts, setCounts] = useState<GroupOverviewCounts | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  function load() {
    setLoading(true)
    setError(null)
    Promise.all([getGroupProgress(group.id), getGroupOverviewCounts(group.id)])
      .then(([p, c]) => {
        setProgress(p)
        setCounts(c)
      })
      .catch((e) => setError(extractErrorMessage(e)))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [group.id])

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} onRetry={load} />

  const shortcuts = [
    { to: `/groups/${groupId}/documents`, icon: FileText, label: 'Documents', value: counts ? `${counts.documents}` : '' },
    { to: `/groups/${groupId}/tests`, icon: FlaskConical, label: 'Tests', value: counts ? `${counts.tests}` : '' },
    { to: `/groups/${groupId}/measurements`, icon: Ruler, label: 'Mesures', value: counts ? `${counts.measurements}` : '' },
    { to: `/groups/${groupId}/validation`, icon: ClipboardCheck, label: 'Validation', value: counts?.pendingValidation ? 'En attente' : '' },
    { to: `/groups/${groupId}/discussion`, icon: MessageSquare, label: 'Discussion', value: '' }
  ]

  return (
    <div className="p-4 space-y-4">
      <div className="card">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-slate-400">Progression du groupe</span>
          <span className="text-lg font-bold text-accent-soft">{progress?.progress_percent ?? 0}%</span>
        </div>
        <div className="w-full h-2 bg-base-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-accent transition-all"
            style={{ width: `${progress?.progress_percent ?? 0}%` }}
          />
        </div>
        <p className="text-xs text-slate-500 mt-2">
          {progress?.completed_tasks ?? 0} / {progress?.total_tasks ?? 0} tâches terminées
        </p>
      </div>

      {group.description && (
        <div className="card">
          <h3 className="text-sm font-medium text-slate-300 mb-1">Description</h3>
          <p className="text-sm text-slate-400">{group.description}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        {shortcuts.map((s) => (
          <Link key={s.label} to={s.to} className="card flex items-center justify-between py-3.5">
            <div className="flex items-center gap-2 min-w-0">
              <s.icon className="w-4 h-4 text-accent-soft shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium">{s.label}</p>
                {s.value && <p className="text-xs text-slate-500">{s.value}</p>}
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-600 shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  )
}
