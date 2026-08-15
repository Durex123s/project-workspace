import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { KeyRound, Loader2 } from 'lucide-react'
import { useAuth } from './AuthContext'

// Atteinte via le lien envoyé par email (Supabase établit une
// session "recovery" temporaire à l'ouverture de ce lien).
export default function ResetPasswordPage() {
  const { updatePassword } = useAuth()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.')
      return
    }
    if (password !== confirm) {
      setError('Les deux mots de passe ne correspondent pas.')
      return
    }
    setLoading(true)
    const { error } = await updatePassword(password)
    setLoading(false)
    if (error) {
      setError(error)
      return
    }
    setDone(true)
    setTimeout(() => navigate('/dashboard'), 1500)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Nouveau mot de passe</h1>
          <p className="text-slate-400 text-sm mt-1">Choisis un nouveau mot de passe pour ton compte</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4">
          {error && (
            <div className="bg-status-blocked/10 border border-status-blocked/30 text-status-blocked text-sm rounded-lg px-3 py-2">
              {error}
            </div>
          )}
          {done && (
            <div className="bg-status-ready/10 border border-status-ready/30 text-status-ready text-sm rounded-lg px-3 py-2">
              Mot de passe mis à jour ✓ Redirection...
            </div>
          )}

          <div>
            <label className="block text-sm text-slate-400 mb-1">Nouveau mot de passe</label>
            <input
              type="password"
              required
              minLength={6}
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Confirmer le mot de passe</label>
            <input
              type="password"
              required
              minLength={6}
              className="input-field"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <button type="submit" disabled={loading || done} className="btn-primary w-full flex items-center justify-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
            Mettre à jour le mot de passe
          </button>
        </form>
      </div>
    </div>
  )
}
