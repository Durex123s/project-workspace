import { Loader2, AlertTriangle, Inbox, RefreshCw } from 'lucide-react'

// Composants d'état partagés — évitent que chaque écran réinvente
// (ou pire, oublie) sa propre gestion de loading/erreur/vide.

export function LoadingState({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-slate-500">
      <Loader2 className="w-6 h-6 animate-spin" />
      {label && <p className="text-xs">{label}</p>}
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center px-4">
      <AlertTriangle className="w-6 h-6 text-status-blocked" />
      <p className="text-sm text-status-blocked font-medium">
        {message || 'Impossible de charger les données.'}
      </p>
      <p className="text-xs text-slate-500">Vérifie ta connexion puis réessaie.</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 flex items-center gap-1.5 text-sm bg-base-800 hover:bg-base-700 rounded-lg px-3 py-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Réessayer
        </button>
      )}
    </div>
  )
}

export function EmptyState({ message, icon: Icon = Inbox }: { message: string; icon?: typeof Inbox }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center px-4 text-slate-500">
      <Icon className="w-6 h-6" />
      <p className="text-sm">{message}</p>
    </div>
  )
}

// Extrait un message lisible d'une erreur Supabase (PostgrestError,
// qui n'est pas une instance d'Error native) ou d'une Error classique.
export function extractErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message
  if (e && typeof e === 'object' && 'message' in e) return String((e as { message: unknown }).message)
  return 'Une erreur inattendue est survenue.'
}
