import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { FileText, FlaskConical, ClipboardCheck, MessageSquare, ChevronRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Group, GroupProgress } from '@/types'
import { LoadingState } from '@/components/StateViews'

export default function GroupOverviewTab({ group }: { group: Group }) {
  const { groupId } = useParams<{ groupId: string }>()
  const [progress, setProgress] = useState<GroupProgress | null>(null)
  const [counts, setCounts] = useState<{ documents: number; tests: number; pendingValidation: boolean } | null>(null)

  useEffect(() => {
    supabase.from('group_progress').select('*').eq('group_id', group.id).single()
      .then(({ data }) => setProgress(data as GroupProgress))
  }, [group.id])

  useEffect(() => {
    async function loadCounts() {
      const [docs, tests, validations] = await Promise.all([
        supabase.from('documents').select('id', { count: 'exact', head: true }).eq('group_id', group.id),
        supabase.from('tests').select('id', { count: 'exact', head: true }).eq('group_id', group.id),
        supabase.from('validations').select('status').eq('group_id', group.id).in('status', ['SUBMITTED', 'UNDER_REVIEW'])
      ])
      setCounts({
        documents: docs.count ?? 0,
        tests: tests.count ?? 0,
        pendingValidation: (validations.data?.length ?? 0) > 0
      })
    }
    loadCounts()
  }, [group.id])

  const shortcuts = [
    { to: `/groups/${groupId}/documents`, icon: FileText, label: 'Documents', value: counts ? `${counts.documents}` : '' },
    { to: `/groups/${groupId}/tests`, icon: FlaskConical, label: 'Tests', value: counts ? `${counts.tests}` : '' },
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

      {!counts && <LoadingState />}
      {counts && (
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
      )}
    </div>
  )
}
