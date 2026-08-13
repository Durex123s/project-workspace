import { LogOut } from 'lucide-react'
import { useAuth } from '@/features/auth/AuthContext'

export default function ProfilePage() {
  const { profile, signOut } = useAuth()

  return (
    <div className="p-4 pb-24 space-y-4">
      <h1 className="text-xl font-bold">Mon profil</h1>
      <div className="card">
        <p className="font-medium">{profile?.full_name}</p>
        <p className="text-sm text-slate-400">{profile?.email}</p>
        <span className="badge bg-base-700 text-slate-300 mt-2">{profile?.global_role}</span>
      </div>
      <button onClick={signOut} className="btn-secondary w-full flex items-center justify-center gap-2 text-status-blocked">
        <LogOut className="w-4 h-4" /> Se déconnecter
      </button>
    </div>
  )
}
