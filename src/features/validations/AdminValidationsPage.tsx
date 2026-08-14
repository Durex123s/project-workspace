import { useEffect, useState } from 'react'
import { Check, X, RotateCcw, ClipboardCheck } from 'lucide-react'
import { listPendingValidations, reviewValidation } from './validationsService'
import { useAuth } from '@/features/auth/AuthContext'
import type { ValidationRow } from '@/types'
import { LoadingState, ErrorState, EmptyState, extractErrorMessage } from '@/components/StateViews'

type PendingValidation = ValidationRow & { groups: { name: string; code: string | null } | null }

export default function AdminValidationsPage() {
  const { user } = useAuth()
  const [items, setItems] = useState<PendingValidation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [commentFor, setCommentFor] = useState<string | null>(null)
  const [comment, setComment] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)

  function load() {
    setLoading(true)
    setError(null)
    listPendingValidations()
      .then(setItems)
      .catch((e) => setError(extractErrorMessage(e)))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  async function handleReview(v: PendingValidation, status: 'VALIDATED' | 'REJECTED' | 'CORRECTION_REQUESTED') {
    if (!user) return
    if ((status === 'REJECTED' || status === 'CORRECTION_REQUESTED') && commentFor !== v.id) {
      setCommentFor(v.id)
      return
    }
    setBusyId(v.id)
    try {
      await reviewValidation(v.id, v.group_id, status, user.id, comment || undefined)
      setCommentFor(null)
      setComment('')
      load()
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="p-4 sm:p-6 space-y-3 pb-24 max-w-2xl">
      <h1 className="text-xl font-bold">Validations en attente</h1>
      <p className="text-sm text-slate-400 -mt-2">{items.length} demande{items.length > 1 ? 's' : ''}</p>

      {loading && <LoadingState />}
      {error && <ErrorState message={error} onRetry={load} />}
      {!loading && !error && items.length === 0 && (
        <EmptyState message="Aucune validation en attente. 🎉" icon={ClipboardCheck} />
      )}

      <div className="space-y-2">
        {items.map((v) => (
          <div key={v.id} className="card space-y-3">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4 text-status-pending" />
              <div>
                <p className="text-sm font-medium">
                  {v.groups?.code ? `#${v.groups.code} — ` : ''}{v.groups?.name ?? 'Groupe'}
                </p>
                <p className="text-xs text-slate-500">
                  Soumis le {v.submitted_at ? new Date(v.submitted_at).toLocaleDateString('fr-FR') : '—'}
                </p>
              </div>
            </div>

            {commentFor === v.id && (
              <textarea
                autoFocus
                className="input-field min-h-[60px]"
                placeholder="Commentaire (obligatoire pour refus/correction)"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            )}

            <div className="flex gap-2">
              <button
                onClick={() => handleReview(v, 'VALIDATED')}
                disabled={busyId === v.id}
                className="flex-1 bg-status-ready/20 text-status-ready rounded-lg py-2 text-sm flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" /> Valider
              </button>
              <button
                onClick={() => handleReview(v, 'CORRECTION_REQUESTED')}
                disabled={busyId === v.id || (commentFor === v.id && !comment.trim())}
                className="flex-1 bg-status-pending/20 text-status-pending rounded-lg py-2 text-sm flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" /> Correction
              </button>
              <button
                onClick={() => handleReview(v, 'REJECTED')}
                disabled={busyId === v.id || (commentFor === v.id && !comment.trim())}
                className="flex-1 bg-status-blocked/20 text-status-blocked rounded-lg py-2 text-sm flex items-center justify-center gap-1.5"
              >
                <X className="w-4 h-4" /> Refuser
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
