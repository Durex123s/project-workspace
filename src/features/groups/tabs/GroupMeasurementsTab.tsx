import { useEffect, useState } from 'react'
import { Plus, Trash2, Loader2, Ruler } from 'lucide-react'
import { listMeasurementsForGroup, createMeasurement, deleteMeasurement, computeError } from '@/features/measurements/measurementsService'
import { useAuth } from '@/features/auth/AuthContext'
import type { Measurement } from '@/types'
import { LoadingState, ErrorState, EmptyState, extractErrorMessage } from '@/components/StateViews'

const EMPTY_FORM = { label: '', theoretical_value: '', measured_value: '', unit: '', comment: '' }

// Distinct de "Tests" : ici on journalise des relevés bruts au fil
// de l'eau (plusieurs mesures d'une même grandeur, ex. plusieurs
// prises de vitesse), sans notion de conformité PASS/FAIL — c'est
// le rôle du module Tests.
export default function GroupMeasurementsTab({ groupId }: { groupId: string }) {
  const { user } = useAuth()
  const [items, setItems] = useState<Measurement[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  function load() {
    setLoading(true)
    setLoadError(null)
    listMeasurementsForGroup(groupId)
      .then(setItems)
      .catch((e) => setLoadError(extractErrorMessage(e)))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [groupId])

  async function handleCreate() {
    if (!form.label.trim() || !user) return
    setSaving(true)
    setFormError(null)
    try {
      await createMeasurement(
        {
          group_id: groupId,
          label: form.label,
          theoretical_value: form.theoretical_value ? Number(form.theoretical_value) : null,
          measured_value: form.measured_value ? Number(form.measured_value) : null,
          unit: form.unit || undefined,
          comment: form.comment || undefined
        },
        user.id
      )
      setForm(EMPTY_FORM)
      setShowForm(false)
      load()
    } catch (e) {
      setFormError(extractErrorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer cette mesure ?')) return
    try {
      await deleteMeasurement(id, groupId)
      load()
    } catch (e) {
      setLoadError(extractErrorMessage(e))
    }
  }

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-sm text-slate-300">Mesures ({items.length})</h3>
        <button onClick={() => setShowForm((s) => !s)} className="btn-secondary text-sm flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> Nouvelle mesure
        </button>
      </div>

      {showForm && (
        <div className="card space-y-2.5">
          {formError && (
            <div className="bg-status-blocked/10 border border-status-blocked/30 text-status-blocked text-sm rounded-lg px-3 py-2">
              {formError}
            </div>
          )}
          <input className="input-field" placeholder="Grandeur mesurée (ex : vitesse axe X) *" value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} />
          <div className="grid grid-cols-3 gap-2">
            <input className="input-field" placeholder="Théorique" inputMode="decimal" value={form.theoretical_value} onChange={(e) => setForm((f) => ({ ...f, theoretical_value: e.target.value }))} />
            <input className="input-field" placeholder="Mesurée" inputMode="decimal" value={form.measured_value} onChange={(e) => setForm((f) => ({ ...f, measured_value: e.target.value }))} />
            <input className="input-field" placeholder="Unité" value={form.unit} onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))} />
          </div>
          <textarea className="input-field min-h-[50px]" placeholder="Commentaire" value={form.comment} onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))} />
          <button onClick={handleCreate} disabled={saving || !form.label.trim()} className="btn-primary w-full flex items-center justify-center gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Enregistrer la mesure
          </button>
        </div>
      )}

      {loading && <LoadingState />}
      {loadError && <ErrorState message={loadError} onRetry={load} />}
      {!loading && !loadError && items.length === 0 && (
        <EmptyState message="Aucune mesure enregistrée pour ce groupe." icon={Ruler} />
      )}

      <div className="space-y-2">
        {items.map((m) => {
          const { absolute, relativePct } = computeError(m.theoretical_value, m.measured_value)
          return (
            <div key={m.id} className="card">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Ruler className="w-4 h-4 text-accent-soft shrink-0" />
                  <p className="text-sm font-medium truncate">{m.label}</p>
                </div>
                <button onClick={() => handleDelete(m.id)} className="p-1 text-slate-500 hover:text-status-blocked shrink-0">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 text-xs">
                <span className="text-slate-500">Théorique : <span className="text-slate-300">{m.theoretical_value ?? '—'} {m.unit}</span></span>
                <span className="text-slate-500">Mesurée : <span className="text-slate-300">{m.measured_value ?? '—'} {m.unit}</span></span>
                {absolute != null && (
                  <>
                    <span className="text-slate-500">Écart : <span className="text-slate-300">{absolute.toFixed(3)}</span></span>
                    <span className="text-slate-500">Écart relatif : <span className="text-slate-300">{relativePct != null ? `${relativePct.toFixed(1)}%` : '—'}</span></span>
                  </>
                )}
              </div>
              {m.comment && <p className="text-xs text-slate-500 mt-2 border-t border-base-700 pt-2">{m.comment}</p>}
              <p className="text-[11px] text-slate-600 mt-1.5">{new Date(m.measured_at).toLocaleString('fr-FR')}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
