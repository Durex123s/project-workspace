import { useState, type FormEvent } from 'react'
import { X, Loader2 } from 'lucide-react'
import type { Group } from '@/types'
import { createGroup, updateGroup, type CreateGroupInput } from './groupsService'
import { useAuth } from '@/features/auth/AuthContext'

// Extrait un message lisible d'une erreur Supabase (PostgrestError,
// qui n'est pas une instance d'Error native) ou d'une Error classique.
function extractErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message
  if (e && typeof e === 'object' && 'message' in e) return String((e as { message: unknown }).message)
  return 'Erreur lors de l\'enregistrement'
}

interface Props {
  group?: Group | null
  onClose: () => void
  onSaved: () => void
}

// Formulaire générique de création/modification d'un groupe.
// Ne suppose jamais combien de groupes existent déjà.
export default function GroupFormModal({ group, onClose, onSaved }: Props) {
  const { user } = useAuth()
  const isEdit = Boolean(group)
  const [form, setForm] = useState<CreateGroupInput>({
    name: group?.name ?? '',
    code: group?.code ?? '',
    theme: group?.theme ?? '',
    description: group?.description ?? ''
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) {
      setError('Le nom du groupe est obligatoire.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      if (isEdit && group) {
        await updateGroup(group.id, form)
      } else if (user) {
        await createGroup(form, user.id)
      }
      onSaved()
      onClose()
    } catch (e) {
      setError(extractErrorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-base-800 border border-base-600 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-base-700">
          <h2 className="font-semibold">{isEdit ? 'Modifier le groupe' : 'Créer un groupe'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="bg-status-blocked/10 border border-status-blocked/30 text-status-blocked text-sm rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm text-slate-400 mb-1">Nom du groupe *</label>
            <input
              className="input-field"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="ex : Transmission mécanique des axes"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">Numéro / code (affichable, éditable)</label>
            <input
              className="input-field"
              value={form.code ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
              placeholder="ex : 7"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">Thème</label>
            <input
              className="input-field"
              value={form.theme ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, theme: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">Description</label>
            <textarea
              className="input-field min-h-[80px]"
              value={form.description ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Annuler
            </button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEdit ? 'Enregistrer' : 'Créer le groupe'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
