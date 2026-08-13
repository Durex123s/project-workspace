import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Group, GroupProgress } from '@/types'

export default function GroupOverviewTab({ group }: { group: Group }) {
  const [progress, setProgress] = useState<GroupProgress | null>(null)

  useEffect(() => {
    supabase.from('group_progress').select('*').eq('group_id', group.id).single()
      .then(({ data }) => setProgress(data as GroupProgress))
  }, [group.id])

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
        <p className="text-xs text-slate-600 mt-1">
          Calculée automatiquement à partir des tâches réellement terminées — jamais saisie manuellement.
        </p>
      </div>

      {group.description && (
        <div className="card">
          <h3 className="text-sm font-medium text-slate-300 mb-1">Description</h3>
          <p className="text-sm text-slate-400">{group.description}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        {['Documents', 'Mesures', 'Tests', 'Validation'].map((label) => (
          <div key={label} className="card text-center py-6 text-slate-500 text-sm">
            {label}
            <div className="text-xs mt-1">Module à connecter à ce groupe</div>
          </div>
        ))}
      </div>
    </div>
  )
}
