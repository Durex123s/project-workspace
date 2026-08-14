import { useEffect, useState } from 'react'
import { Plus, Trash2, Loader2, FlaskConical } from 'lucide-react'
import { listTestsForGroup, createTest, deleteTest } from '@/features/tests/testsService'
import { useAuth } from '@/features/auth/AuthContext'
import type { TestRow } from '@/types'

const EMPTY_FORM = { name: '', objective: '', theoretical_value: '', measured_value: '', unit: '', comment: '' }

export default function GroupTestsTab({ groupId }: { groupId: string }) {
  const { user } = useAuth()
  const [tests, setTests] = useState<TestRow[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function load() {
    setLoading(true)
    listTestsForGroup(groupId).then(setTests).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [groupId])

  async function handleCreate() {
    if (!form.name.trim() || !user) return
    setSaving(true)
    setError(null)
    try {
      await createTest(
        {
          group_id: groupId,
          name: form.name,
          objective: form.objective || undefined,
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
      setError(e instanceof Error ? e.message : 'Erreur lors de l\'enregistrement')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer ce test ?')) return
    await deleteTest(id, groupId)
    load()
  }

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-sm text-slate-300">Tests & mesures ({tests.length})</h3>
        <button onClick={() => setShowForm((s) => !s)} className="btn-secondary text-sm flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> Nouveau test
        </button>
      </div>

      {showForm && (
        <div className="card space-y-2.5">
          {error && (
            <div className="bg-status-blocked/10 border border-status-blocked/30 text-status-blocked text-sm rounded-lg px-3 py-2">
              {error}
            </div>
          )}
          <input className="input-field" placeholder="Nom du test *" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          <input className="input-field" placeholder="Objectif" value={form.objective} onChange={(e) => setForm((f) => ({ ...f, objective: e.target.value }))} />
          <div className="grid grid-cols-3 gap-2">
            <input className="input-field" placeholder="Val. théorique" inputMode="decimal" value={form.theoretical_value} onChange={(e) => setForm((f) => ({ ...f, theoretical_value: e.target.value }))} />
            <input className="input-field" placeholder="Val. mesurée" inputMode="decimal" value={form.measured_value} onChange={(e) => setForm((f) => ({ ...f, measured_value: e.target.value }))} />
            <input className="input-field" placeholder="Unité" value={form.unit} onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))} />
          </div>
          <textarea className="input-field min-h-[60px]" placeholder="Commentaire" value={form.comment} onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))} />
          <button onClick={handleCreate} disabled={saving} className="btn-primary w-full flex items-center justify-center gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Enregistrer le test
          </button>
        </div>
      )}

      {loading && <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-slate-500" /></div>}
      {!loading && tests.length === 0 && (
        <div className="card text-center py-8 text-slate-500 text-sm">Aucun test enregistré pour ce groupe.</div>
      )}

      <div className="space-y-2">
        {tests.map((t) => (
          <div key={t.id} className="card">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <FlaskConical className="w-4 h-4 text-accent-soft shrink-0" />
                <p className="text-sm font-medium truncate">{t.name}</p>
              </div>
              <button onClick={() => handleDelete(t.id)} className="p-1 text-slate-500 hover:text-status-blocked shrink-0">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            {t.objective && <p className="text-xs text-slate-500 mt-1">{t.objective}</p>}
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 text-xs">
              <span className="text-slate-500">Théorique : <span className="text-slate-300">{t.theoretical_value ?? '—'} {t.unit}</span></span>
              <span className="text-slate-500">Mesurée : <span className="text-slate-300">{t.measured_value ?? '—'} {t.unit}</span></span>
              <span className="text-slate-500">Erreur absolue : <span className="text-slate-300">{t.absolute_error ?? '—'}</span></span>
              <span className="text-slate-500">Erreur relative : <span className="text-slate-300">{t.relative_error_pct != null ? `${t.relative_error_pct}%` : '—'}</span></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
