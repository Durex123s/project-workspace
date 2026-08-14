import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FlaskConical } from 'lucide-react'
import { listAllTests } from './testsService'
import type { TestRow } from '@/types'
import { LoadingState, ErrorState, EmptyState, extractErrorMessage } from '@/components/StateViews'

export default function TestsPage() {
  const [tests, setTests] = useState<(TestRow & { groups: { name: string; code: string | null } | null })[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  function load() {
    setLoading(true)
    setError(null)
    listAllTests()
      .then(setTests)
      .catch((e) => setError(extractErrorMessage(e)))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  return (
    <div className="p-4 sm:p-6 pb-24 max-w-2xl">
      <h1 className="text-xl font-bold mb-1">Tests & mesures</h1>
      <p className="text-sm text-slate-400 mb-4">Vue globale, tous groupes confondus (100 plus récents)</p>

      {loading && <LoadingState />}
      {error && <ErrorState message={error} onRetry={load} />}
      {!loading && !error && tests.length === 0 && (
        <EmptyState message="Aucun test enregistré. Ajoute des tests depuis l'onglet « Tests » de chaque groupe." icon={FlaskConical} />
      )}

      <div className="space-y-2">
        {tests.map((t) => (
          <Link key={t.id} to={`/groups/${t.group_id}/tests`} className="card block">
            <div className="flex items-center gap-2 mb-1">
              <FlaskConical className="w-4 h-4 text-accent-soft shrink-0" />
              <span className="text-sm font-medium truncate">{t.name}</span>
            </div>
            <p className="text-xs text-slate-500">
              {t.groups?.code ? `#${t.groups.code} — ` : ''}{t.groups?.name ?? 'Groupe'}
            </p>
            <div className="flex gap-4 mt-2 text-xs text-slate-400">
              <span>Erreur abs. : {t.absolute_error ?? '—'}</span>
              <span>Erreur rel. : {t.relative_error_pct != null ? `${t.relative_error_pct}%` : '—'}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
