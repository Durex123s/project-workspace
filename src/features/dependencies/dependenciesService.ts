import { supabase } from '@/lib/supabase'
import type { GroupDependency, DependencyStatus } from '@/types'

export interface DependencyWithGroups extends GroupDependency {
  from_group: { id: string; name: string; code: string | null } | null
  to_group: { id: string; name: string; code: string | null } | null
}

export async function listDependencies() {
  const { data, error } = await supabase
    .from('group_dependencies')
    .select('*, from_group:groups!group_dependencies_from_group_id_fkey(id, name, code), to_group:groups!group_dependencies_to_group_id_fkey(id, name, code)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as DependencyWithGroups[]
}

export async function listDependenciesForGroup(groupId: string) {
  const { data, error } = await supabase
    .from('group_dependencies')
    .select('*, from_group:groups!group_dependencies_from_group_id_fkey(id, name, code), to_group:groups!group_dependencies_to_group_id_fkey(id, name, code)')
    .or(`from_group_id.eq.${groupId},to_group_id.eq.${groupId}`)
  if (error) throw error
  return data as DependencyWithGroups[]
}

export async function createDependency(
  fromGroupId: string,
  toGroupId: string,
  createdBy: string,
  status: DependencyStatus = 'PENDING',
  note?: string
) {
  const { data, error } = await supabase
    .from('group_dependencies')
    .insert({ from_group_id: fromGroupId, to_group_id: toGroupId, status, note: note || null, created_by: createdBy })
    .select()
    .single()
  if (error) throw error
  return data as GroupDependency
}

export async function updateDependencyStatus(id: string, status: DependencyStatus) {
  const { error } = await supabase.from('group_dependencies').update({ status }).eq('id', id)
  if (error) throw error
}

export async function deleteDependency(id: string) {
  const { error } = await supabase.from('group_dependencies').delete().eq('id', id)
  if (error) throw error
}
