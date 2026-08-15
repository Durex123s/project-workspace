import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogIn, UserPlus, Loader2, KeyRound } from 'lucide-react'
import { useAuth } from './AuthContext'

type Mode = 'login' | 'signup' | 'forgot'

export default function LoginPage() {
  const { signIn, signUp, requestPasswordReset } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState<Mode>('login')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setLoading(true)

    if (mode === 'login') {
      const { error } = await signIn(email, password)
      setLoading(false)
      if (error) {
        setError('Identifiants invalides. Vérifiez votre email et mot de passe.')
        return
      }
      navigate('/dashboard')
      return
    }

    if (mode === 'forgot') {
      const { error } = await requestPasswordReset(email)
      setLoading(false)
      if (error) {
        setError(error)
        return
      }
      setInfo('Si un compte existe avec cet email, un lien de réinitialisation vient de lui être envoyé.')
      return
    }

    const { error } = await signUp(email, password, fullName)
    setLoading(false)
    if (error) {
      setError(error)
      return
    }
    setInfo(
      'Compte créé. Si la confirmation par email est activée sur ce projet, vérifiez votre boîte mail avant de vous connecter. Sinon, connectez-vous directement.'
    )
    setMode('login')
  }

  const titles: Record<Mode, string> = {
    login: 'Connexion à votre espace de travail',
    signup: 'Créer votre compte',
    forgot: 'Réinitialiser votre mot de passe'
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Project Workspace</h1>
          <p className="text-slate-400 text-sm mt-1">{titles[mode]}</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4">
          {error && (
            <div className="bg-status-blocked/10 border border-status-blocked/30 text-status-blocked text-sm rounded-lg px-3 py-2">
              {error}
            </div>
          )}
          {info && (
            <div className="bg-status-ready/10 border border-status-ready/30 text-status-ready text-sm rounded-lg px-3 py-2">
              {info}
            </div>
          )}

          {mode === 'signup' && (
            <div>
              <label className="block text-sm text-slate-400 mb-1">Nom complet</label>
              <input
                type="text"
                required
                className="input-field"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Votre nom"
              />
            </div>
          )}

          <div>
            <label className="block text-sm text-slate-400 mb-1">Email</label>
            <input
              type="email"
              required
              className="input-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@exemple.com"
            />
          </div>

          {mode !== 'forgot' && (
            <div>
              <label className="block text-sm text-slate-400 mb-1">Mot de passe</label>
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
          )}

          {mode === 'login' && (
            <button
              type="button"
              onClick={() => { setMode('forgot'); setError(null); setInfo(null) }}
              className="text-xs text-accent-soft -mt-2"
            >
              Mot de passe oublié ?
            </button>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : mode === 'login' ? (
              <LogIn className="w-4 h-4" />
            ) : mode === 'forgot' ? (
              <KeyRound className="w-4 h-4" />
            ) : (
              <UserPlus className="w-4 h-4" />
            )}
            {mode === 'login' ? 'Se connecter' : mode === 'forgot' ? 'Envoyer le lien' : 'Créer le compte'}
          </button>

          <button
            type="button"
            onClick={() => { setMode(mode === 'signup' ? 'login' : mode === 'forgot' ? 'login' : 'signup'); setError(null); setInfo(null) }}
            className="w-full text-center text-sm text-slate-400 hover:text-slate-200"
          >
            {mode === 'signup' ? 'Déjà un compte ? Se connecter' : mode === 'forgot' ? 'Retour à la connexion' : "Pas encore de compte ? S'inscrire"}
          </button>
        </form>
      </div>
    </div>
  )
}
