import { supabase } from '@/lib/supabase'
import type { ProjectDashboardStats } from '@/types'

export async function getDashboardStats() {
  const { data, error } = await supabase.from('project_dashboard_stats').select('*').single()
  if (error) throw error
  return data as ProjectDashboardStats
}
