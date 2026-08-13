import { supabase } from '@/lib/supabase'
import type { Group, GroupProgress, GroupMember, GroupStatus } from '@/types'

// ------------------------------------------------------------
// Service groupes — 100% dynamique. Aucune fonction ici ne
// suppose un nombre ou une liste fixe de groupes : tout passe
// par la table `groups` en base.
// ------------------------------------------------------------

export interface CreateGroupInput {
  name: string
  code?: string
  theme?: string
  description?: string
  leader_id?: string | null
}

export async function listGroups(status: GroupStatus | 'ALL' = 'ACTIVE') {
  let query = supabase.from('groups').select('*').order('created_at', { ascending: true })
  if (status !== 'ALL') query = query.eq('status', status)
  const { data, error } = await query
  if (error) throw error
  return data as Group[]
}

export async function listGroupsWithProgress(status: GroupStatus | 'ALL' = 'ACTIVE') {
  let query = supabase.from('group_progress').select('*')
  if (status !== 'ALL') query = query.eq('status', status)
  const { data, error } = await query
  if (error) throw error
  return data as GroupProgress[]
}

export async function getGroup(groupId: string) {
  const { data, error } = await supabase.from('groups').select('*').eq('id', groupId).single()
  if (error) throw error
  return data as Group
}

export async function createGroup(input: CreateGroupInput, createdBy: string) {
  const { data, error } = await supabase
    .from('groups')
    .insert({ ...input, created_by: createdBy })
    .select()
    .single()
  if (error) throw error
  await supabase.rpc('log_activity', {
    p_group_id: data.id,
    p_action: 'group.created',
    p_entity_type: 'groups',
    p_entity_id: data.id,
    p_metadata: { name: input.name }
  })
  return data as Group
}

export async function updateGroup(groupId: string, patch: Partial<CreateGroupInput>) {
  const { data, error } = await supabase.from('groups').update(patch).eq('id', groupId).select().single()
  if (error) throw error
  return data as Group
}

export async function archiveGroup(groupId: string) {
  return updateGroupStatus(groupId, 'ARCHIVED')
}

export async function restoreGroup(groupId: string) {
  return updateGroupStatus(groupId, 'ACTIVE')
}

async function updateGroupStatus(groupId: string, status: GroupStatus) {
  const { data, error } = await supabase.from('groups').update({ status }).eq('id', groupId).select().single()
  if (error) throw error
  await supabase.rpc('log_activity', {
    p_group_id: groupId,
    p_action: status === 'ARCHIVED' ? 'group.archived' : 'group.restored',
    p_entity_type: 'groups',
    p_entity_id: groupId,
    p_metadata: {}
  })
  return data as Group
}

export async function deleteGroup(groupId: string) {
  const { error } = await supabase.from('groups').delete().eq('id', groupId)
  if (error) throw error
}

// ------------------------------------------------------------
// Membres
// ------------------------------------------------------------
export async function listGroupMembers(groupId: string) {
  const { data, error } = await supabase
    .from('group_members')
    .select('*, profile:profiles(*)')
    .eq('group_id', groupId)
  if (error) throw error
  return data as GroupMember[]
}

export async function addGroupMember(groupId: string, userId: string, role: GroupMember['role_in_group'] = 'MEMBER') {
  const { data, error } = await supabase
    .from('group_members')
    .insert({ group_id: groupId, user_id: userId, role_in_group: role })
    .select()
    .single()
  if (error) throw error
  await supabase.rpc('log_activity', {
    p_group_id: groupId,
    p_action: 'member.added',
    p_entity_type: 'group_members',
    p_entity_id: data.id,
    p_metadata: { user_id: userId }
  })
  return data as GroupMember
}

export async function removeGroupMember(memberRowId: string, groupId: string) {
  const { error } = await supabase.from('group_members').delete().eq('id', memberRowId)
  if (error) throw error
  await supabase.rpc('log_activity', {
    p_group_id: groupId,
    p_action: 'member.removed',
    p_entity_type: 'group_members',
    p_entity_id: memberRowId,
    p_metadata: {}
  })
}
