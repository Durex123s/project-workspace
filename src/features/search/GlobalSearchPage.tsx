import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Search, LayoutGrid, ListChecks, FlaskConical, FileText, Users, Loader2 } from 'lucide-react'
import { globalSearch, type SearchResults } from './searchService'
import { extractErrorMessage } from '@/components/StateViews'

const EMPTY_RESULTS: SearchResults = { groups: [], tasks: [], tests: [], documents: [], members: [] }

export default function GlobalSearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResults>(EMPTY_RESULTS)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) {
      setResults(EMPTY_RESULTS)
      setError(null)
      return
    }
    setLoading(true)
    setError(null)
    const timer = setTimeout(() => {
      globalSearch(q)
        .then(setResults)
        .catch((e) => setError(extractErrorMessage(e)))
        .finally(() => setLoading(false))
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  const totalCount =
    results.groups.length + results.tasks.length + results.tests.length + results.documents.length + results.members.length

  return (
    <div className="p-4 sm:p-6 pb-24 max-w-2xl">
      <h1 className="text-xl font-bold mb-3">Recherche</h1>

      <div className="relative mb-4">
        <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          autoFocus
          className="input-field pl-9"
          placeholder="Rechercher un groupe, une tâche, un test, un document, un membre..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {loading && <Loader2 className="w-4 h-4 animate-spin text-slate-500 absolute right-3 top-1/2 -translate-y-1/2" />}
      </div>

      {error && (
        <div className="bg-status-blocked/10 border border-status-blocked/30 text-status-blocked text-sm rounded-lg px-3 py-2 mb-3">
          {error}
        </div>
      )}

      {query.trim().length >= 2 && !loading && !error && totalCount === 0 && (
        <p className="text-sm text-slate-500 text-center py-8">Aucun résultat pour « {query} ».</p>
      )}

      {query.trim().length > 0 && query.trim().length < 2 && (
        <p className="text-xs text-slate-600">Continue à taper (2 caractères minimum)...</p>
      )}

      <div className="space-y-5">
        {results.groups.length > 0 && (
          <ResultSection icon={LayoutGrid} label="Groupes">
            {results.groups.map((g) => (
              <Link key={g.id} to={`/groups/${g.id}`} className="card block">
                <span className="text-sm font-medium">{g.code ? `#${g.code} — ` : ''}{g.name}</span>
              </Link>
            ))}
          </ResultSection>
        )}

        {results.tasks.length > 0 && (
          <ResultSection icon={ListChecks} label="Tâches">
            {results.tasks.map((t) => (
              <Link key={t.id} to={`/groups/${t.group_id}/tasks`} className="card block">
                <p className="text-sm font-medium">{t.title}</p>
                {t.group_name && <p className="text-xs text-slate-500 mt-0.5">{t.group_name}</p>}
              </Link>
            ))}
          </ResultSection>
        )}

        {results.tests.length > 0 && (
          <ResultSection icon={FlaskConical} label="Tests">
            {results.tests.map((t) => (
              <Link key={t.id} to={`/groups/${t.group_id}/tests`} className="card block">
                <p className="text-sm font-medium">{t.name}</p>
                {t.group_name && <p className="text-xs text-slate-500 mt-0.5">{t.group_name}</p>}
              </Link>
            ))}
          </ResultSection>
        )}

        {results.documents.length > 0 && (
          <ResultSection icon={FileText} label="Documents">
            {results.documents.map((d) => (
              <Link key={d.id} to={`/groups/${d.group_id}/documents`} className="card block">
                <p className="text-sm font-medium truncate">{d.file_name}</p>
                {d.group_name && <p className="text-xs text-slate-500 mt-0.5">{d.group_name}</p>}
              </Link>
            ))}
          </ResultSection>
        )}

        {results.members.length > 0 && (
          <ResultSection icon={Users} label="Membres">
            {results.members.map((m) => (
              <div key={m.id} className="card">
                <p className="text-sm font-medium">{m.full_name}</p>
                <p className="text-xs text-slate-500">{m.email}</p>
              </div>
            ))}
          </ResultSection>
        )}
      </div>
    </div>
  )
}

function ResultSection({ icon: Icon, label, children }: { icon: typeof Search; label: string; children: ReactNode }) {
  return (
    <div>
      <h2 className="flex items-center gap-1.5 text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
        <Icon className="w-3.5 h-3.5" /> {label}
      </h2>
      <div className="space-y-1.5">{children}</div>
    </div>
  )
}
