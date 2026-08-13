import { Link } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useGroups } from './useGroups'

// Liste "Mon groupe" / tous les groupes visibles pour l'utilisateur.
// Rendue entièrement à partir des données — aucun groupe en dur.
export default function GroupsListPage() {
  const { groups, loading } = useGroups('ACTIVE')

  return (
    <div className="p-4 space-y-3 pb-24">
      <h1 className="text-xl font-bold">Groupes</h1>

      {loading && <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-slate-500" /></div>}

      <div className="space-y-2">
        {groups.map((g) => (
          <Link key={g.group_id} to={`/groups/${g.group_id}`} className="card block">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  {g.code && <span className="text-xs text-slate-500">#{g.code}</span>}
                  <span className="font-medium truncate">{g.name}</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{g.completed_tasks}/{g.total_tasks} tâches</p>
              </div>
              <span className="text-sm font-semibold text-accent-soft">{g.progress_percent}%</span>
            </div>
          </Link>
        ))}
        {!loading && groups.length === 0 && (
          <div className="card text-center py-10 text-slate-500 text-sm">Aucun groupe visible pour le moment.</div>
        )}
      </div>
    </div>
  )
}
