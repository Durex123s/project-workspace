import { supabase } from '@/lib/supabase'
import type { ProjectDashboardStats } from '@/types'

export async function getDashboardStats() {
  const { data, error } = await supabase.from('project_dashboard_stats').select('*').single()
  if (error) throw error
  return data as ProjectDashboardStats
}

export async function getOverdueTasksCount() {
  const today = new Date().toISOString().slice(0, 10)
  const { count, error } = await supabase
    .from('group_tasks')
    .select('id', { count: 'exact', head: true })
    .lt('due_date', today)
    .not('status', 'in', '(DONE,VALIDATED)')
  if (error) throw error
  return count ?? 0
}
