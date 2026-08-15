import { NavLink, Outlet } from 'react-router-dom'
import { LayoutDashboard, LayoutGrid, FlaskConical, FileText, Settings, User, Calculator, ClipboardCheck } from 'lucide-react'
import { useAuth } from '@/features/auth/AuthContext'
import NotificationBell from '@/features/notifications/NotificationBell'

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
  { to: '/groups', icon: LayoutGrid, label: 'Groupes' },
  { to: '/tests', icon: FlaskConical, label: 'Tests & mesures' },
  { to: '/calculators', icon: Calculator, label: 'Calculateurs' },
  { to: '/documents', icon: FileText, label: 'Documents' },
  { to: '/profile', icon: User, label: 'Profil' }
]

const BOTTOM_NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Accueil' },
  { to: '/groups', icon: LayoutGrid, label: 'Groupes' },
  { to: '/tests', icon: FlaskConical, label: 'Tests' },
  { to: '/profile', icon: User, label: 'Profil' }
]

export default function AppLayout() {
  const { profile } = useAuth()
  const isStaff = profile?.global_role === 'ADMIN' || profile?.global_role === 'TEACHER'

  return (
    <div className="min-h-screen sm:flex">
      {/* Sidebar desktop */}
      <aside className="hidden sm:flex sm:w-60 sm:flex-col border-r border-base-700 bg-base-900 p-4">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="font-bold text-lg">Project Workspace</h1>
          <NotificationBell />
        </div>
        <nav className="space-y-1 flex-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm ${isActive ? 'bg-accent/20 text-accent-soft' : 'text-slate-400 hover:bg-base-800'}`
              }
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </NavLink>
          ))}
          {isStaff && (
            <>
              <NavLink
                to="/admin/groups"
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm ${isActive ? 'bg-accent/20 text-accent-soft' : 'text-slate-400 hover:bg-base-800'}`
                }
              >
                <Settings className="w-4 h-4" />
                Administration
              </NavLink>
              <NavLink
                to="/admin/validations"
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm ${isActive ? 'bg-accent/20 text-accent-soft' : 'text-slate-400 hover:bg-base-800'}`
                }
              >
                <ClipboardCheck className="w-4 h-4" />
                Validations
              </NavLink>
            </>
          )}
        </nav>
        {profile && (
          <div className="text-xs text-slate-500 pt-4 border-t border-base-700">
            {profile.full_name} · {profile.global_role}
          </div>
        )}
      </aside>

      {/* Barre supérieure mobile */}
      <header className="sm:hidden sticky top-0 z-20 bg-base-900 border-b border-base-700 px-4 py-2.5 flex items-center justify-between">
        <span className="font-bold text-sm">Project Workspace</span>
        <NotificationBell />
      </header>

      {/* Contenu */}
      <main className="flex-1 min-w-0">
        <Outlet />
      </main>

      {/* Bottom nav mobile */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-base-900 border-t border-base-700 flex items-center justify-around py-2 z-20">
        {BOTTOM_NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-2 py-1 text-[11px] ${isActive ? 'text-accent-soft' : 'text-slate-500'}`
            }
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </NavLink>
        ))}
        {isStaff && (
          <NavLink
            to="/admin/groups"
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-2 py-1 text-[11px] ${isActive ? 'text-accent-soft' : 'text-slate-500'}`
            }
          >
            <Settings className="w-5 h-5" />
            Admin
          </NavLink>
        )}
      </nav>
    </div>
  )
}
