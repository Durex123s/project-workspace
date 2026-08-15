import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, Users, ListChecks, FlaskConical, FileText, ClipboardCheck, LayoutGrid } from 'lucide-react'
import type { ProjectDashboardStats } from '@/types'
import { useGroups } from '@/features/groups/useGroups'
import { getDashboardStats } from './dashboardService'
import { ErrorState, EmptyState, extractErrorMessage } from '@/components/StateViews'

// Dashboard 100% dynamique : chaque chiffre vient d'une requête
// SQL (vue project_dashboard_stats). Aucun total n'est écrit en dur.
export default function DashboardPage() {
  const [stats, setStats] = useState<ProjectDashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { groups, loading: groupsLoading } = useGroups('ACTIVE')

  function loadStats() {
    setLoading(true)
    setError(null)
    getDashboardStats()
      .then(setStats)
      .catch((e) => setError(extractErrorMessage(e)))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadStats() }, [])

  const cards = stats ? [
    { icon: LayoutGrid, label: 'Groupes actifs', value: stats.active_groups, sub: `${stats.archived_groups} archivé(s)` },
    { icon: Users, label: 'Participants', value: stats.total_participants },
    { icon: ListChecks, label: 'Tâches', value: `${stats.completed_tasks}/${stats.total_tasks}`, sub: `${stats.in_progress_tasks} en cours` },
    { icon: FlaskConical, label: 'Tests réalisés', value: stats.total_tests },
    { icon: FileText, label: 'Documents', value: stats.total_documents },
    { icon: ClipboardCheck, label: 'Validations en attente', value: stats.pending_validations }
  ] : []

  return (
    <div className="p-4 space-y-5 pb-24">
      <div>
        <h1 className="text-xl font-bold">Tableau de bord</h1>
        <p className="text-sm text-slate-400">Vue d'ensemble du projet</p>
      </div>

      {loading && <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-slate-500" /></div>}
      {error && <ErrorState message={error} onRetry={loadStats} />}

      {stats && (
        <>
          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">Progression globale du projet</span>
              <span className="text-2xl font-bold text-accent-soft">{stats.global_progress_percent}%</span>
            </div>
            <div className="w-full h-3 bg-base-700 rounded-full overflow-hidden">
              <div className="h-full bg-accent transition-all" style={{ width: `${stats.global_progress_percent}%` }} />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {cards.map((c) => (
              <div key={c.label} className="card">
                <c.icon className="w-4 h-4 text-accent-soft mb-2" />
                <div className="text-lg font-bold">{c.value}</div>
                <div className="text-xs text-slate-400">{c.label}</div>
                {c.sub && <div className="text-[11px] text-slate-600 mt-0.5">{c.sub}</div>}
              </div>
            ))}
          </div>
        </>
      )}

      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-medium text-sm text-slate-300">Groupes</h2>
          <Link to="/admin/groups" className="text-xs text-accent-soft">Gérer</Link>
        </div>
        {groupsLoading && <Loader2 className="w-4 h-4 animate-spin text-slate-500" />}
        <div className="space-y-2">
          {groups.map((g) => (
            <Link key={g.group_id} to={`/groups/${g.group_id}`} className="card flex items-center justify-between block">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  {g.code && <span className="text-xs text-slate-500">#{g.code}</span>}
                  <span className="font-medium text-sm truncate">{g.name}</span>
                </div>
              </div>
              <span className="text-sm font-semibold text-accent-soft shrink-0">{g.progress_percent}%</span>
            </Link>
          ))}
          {!groupsLoading && groups.length === 0 && (
            <EmptyState message="Aucun groupe actif. Crée le premier groupe depuis Administration." icon={LayoutGrid} />
          )}
        </div>
      </div>
    </div>
  )
}
