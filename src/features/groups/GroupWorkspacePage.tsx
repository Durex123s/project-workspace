import { useEffect, useState } from 'react'
import { useParams, Navigate, NavLink, Routes, Route } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { getGroup } from './groupsService'
import type { Group } from '@/types'
import GroupOverviewTab from './tabs/GroupOverviewTab'
import GroupMembersTab from './tabs/GroupMembersTab'
import GroupDocumentsTab from './tabs/GroupDocumentsTab'
import GroupDiscussionTab from './tabs/GroupDiscussionTab'
import GroupTestsTab from './tabs/GroupTestsTab'
import GroupValidationTab from './tabs/GroupValidationTab'
import GroupTasksTab from '@/features/tasks/GroupTasksTab'

// Espace de travail générique : fonctionne pour N'IMPORTE QUEL
// groupId. Aucune route /group1, /group2... n'existe : une seule
// route paramétrée /groups/:groupId dessert tous les groupes.
export default function GroupWorkspacePage() {
  const { groupId } = useParams<{ groupId: string }>()
  const [group, setGroup] = useState<Group | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!groupId) return
    setLoading(true)
    getGroup(groupId)
      .then(setGroup)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [groupId])

  if (!groupId) return <Navigate to="/groups" replace />
  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
      </div>
    )
  }
  if (notFound || !group) {
    return <div className="p-6 text-center text-slate-400">Groupe introuvable ou accès refusé.</div>
  }

  const tabs = [
    { to: '', label: 'Aperçu', end: true },
    { to: 'tasks', label: 'Tâches' },
    { to: 'members', label: 'Membres' },
    { to: 'documents', label: 'Documents' },
    { to: 'tests', label: 'Tests' },
    { to: 'validation', label: 'Validation' },
    { to: 'discussion', label: 'Discussion' }
  ]

  return (
    <div className="pb-24">
      <div className="p-4 border-b border-base-700 bg-base-900/60 sticky top-0 z-10 backdrop-blur">
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
          {group.code && <span>#{group.code}</span>}
          {group.status === 'ARCHIVED' && <span className="badge bg-slate-600/30 text-slate-400">Archivé</span>}
        </div>
        <h1 className="text-lg font-bold truncate">{group.name}</h1>
        {group.theme && <p className="text-sm text-slate-400">{group.theme}</p>}

        <div className="flex gap-1 mt-3 overflow-x-auto">
          {tabs.map((t) => (
            <NavLink
              key={t.to}
              to={t.to || '.'}
              end={t.end}
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-full text-sm whitespace-nowrap ${isActive ? 'bg-accent text-white' : 'bg-base-800 text-slate-400'}`
              }
            >
              {t.label}
            </NavLink>
          ))}
        </div>
      </div>

      <Routes>
        <Route index element={<GroupOverviewTab group={group} />} />
        <Route path="tasks" element={<GroupTasksTab groupId={group.id} />} />
        <Route path="members" element={<GroupMembersTab groupId={group.id} />} />
        <Route path="documents" element={<GroupDocumentsTab groupId={group.id} />} />
        <Route path="tests" element={<GroupTestsTab groupId={group.id} />} />
        <Route path="validation" element={<GroupValidationTab groupId={group.id} />} />
        <Route path="discussion" element={<GroupDiscussionTab groupId={group.id} />} />
      </Routes>
    </div>
  )
}
