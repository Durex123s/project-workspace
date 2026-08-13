import { useCallback, useEffect, useState } from 'react'
import type { GroupProgress, GroupStatus } from '@/types'
import { listGroupsWithProgress } from './groupsService'

// Hook générique : fonctionne pour 0, 1, 17 ou 500 groupes,
// aucune hypothèse sur leur nombre.
export function useGroups(status: GroupStatus | 'ALL' = 'ACTIVE') {
  const [groups, setGroups] = useState<GroupProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await listGroupsWithProgress(status)
      setGroups(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors du chargement des groupes')
    } finally {
      setLoading(false)
    }
  }, [status])

  useEffect(() => {
    reload()
  }, [reload])

  return { groups, loading, error, reload, count: groups.length }
}
