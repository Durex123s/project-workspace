import { useEffect, useState } from 'react'
import { Send, Loader2, ClipboardCheck } from 'lucide-react'
import { listValidationsForGroup, submitForValidation } from '@/features/validations/validationsService'
import { useAuth } from '@/features/auth/AuthContext'
import type { ValidationRow, ValidationStatus } from '@/types'
import { LoadingState, ErrorState, EmptyState, extractErrorMessage } from '@/components/StateViews'

const STATUS_STYLES: Record<ValidationStatus, string> = {
  DRAFT: 'bg-slate-600/30 text-slate-300',
  SUBMITTED: 'bg-status-pending/20 text-status-pending',
  UNDER_REVIEW: 'bg-status-progress/20 text-status-progress',
  VALIDATED: 'bg-status-ready/20 text-status-ready',
  REJECTED: 'bg-status-blocked/20 text-status-blocked',
  CORRECTION_REQUESTED: 'bg-status-pending/20 text-status-pending'
}

const STATUS_LABEL: Record<ValidationStatus, string> = {
  DRAFT: 'Brouillon',
  SUBMITTED: 'Soumis',
  UNDER_REVIEW: 'En vérification',
  VALIDATED: 'Validé',
  REJECTED: 'Refusé',
  CORRECTION_REQUESTED: 'Correction demandée'
}

export default function GroupValidationTab({ groupId }: { groupId: string }) {
  const { user } = useAuth()
  const [items, setItems] = useState<ValidationRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function load() {
    setLoading(true)
    setError(null)
    listValidationsForGroup(groupId)
      .then(setItems)
      .catch((e) => setError(extractErrorMessage(e)))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [groupId])

  async function handleSubmit() {
    if (!user) return
    setSubmitting(true)
    try {
      await submitForValidation(groupId, user.id)
      load()
    } catch (e) {
      setError(extractErrorMessage(e))
    } finally {
      setSubmitting(false)
    }
  }

  const hasPending = items.some((i) => i.status === 'SUBMITTED' || i.status === 'UNDER_REVIEW')

  return (
    <div className="p-4 space-y-3">
      <div className="card">
        <h3 className="font-medium text-sm text-slate-300 mb-2">Soumettre le travail du groupe</h3>
        <p className="text-xs text-slate-500 mb-3">
          Envoie une demande de validation à l'enseignant. Il pourra valider, refuser, ou demander une correction.
        </p>
        <button
          onClick={handleSubmit}
          disabled={submitting || hasPending}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {hasPending ? 'Déjà en attente de revue' : 'Prêt pour validation'}
        </button>
      </div>

      <h3 className="font-medium text-sm text-slate-300">Historique</h3>
      {loading && <LoadingState />}
      {error && <ErrorState message={error} onRetry={load} />}
      {!loading && !error && items.length === 0 && (
        <EmptyState message="Aucune demande de validation pour l'instant." icon={ClipboardCheck} />
      )}
      <div className="space-y-2">
        {items.map((v) => (
          <div key={v.id} className="card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4 text-slate-500" />
                <span className={`badge ${STATUS_STYLES[v.status]}`}>{STATUS_LABEL[v.status]}</span>
              </div>
              <span className="text-xs text-slate-500">
                {new Date(v.created_at).toLocaleDateString('fr-FR')}
              </span>
            </div>
            {v.review_comment && (
              <p className="text-xs text-slate-400 mt-2 border-t border-base-700 pt-2">« {v.review_comment} »</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
