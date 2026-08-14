import { supabase } from '@/lib/supabase'
import type { TestRow } from '@/types'

export async function listTestsForGroup(groupId: string) {
  const { data, error } = await supabase
    .from('tests')
    .select('*')
    .eq('group_id', groupId)
    .order('performed_at', { ascending: false })
  if (error) throw error
  return data as TestRow[]
}

export async function listAllTests() {
  const { data, error } = await supabase
    .from('tests')
    .select('*, groups(name, code)')
    .order('performed_at', { ascending: false })
    .limit(100)
  if (error) throw error
  return data as (TestRow & { groups: { name: string; code: string | null } | null })[]
}

export interface CreateTestInput {
  group_id: string
  name: string
  objective?: string
  theoretical_value?: number | null
  measured_value?: number | null
  unit?: string
  result?: string
  comment?: string
}

export async function createTest(input: CreateTestInput, operatorId: string) {
  const { data, error } = await supabase
    .from('tests')
    .insert({ ...input, operator_id: operatorId })
    .select()
    .single()
  if (error) throw error
  await supabase.rpc('log_activity', {
    p_group_id: input.group_id,
    p_action: 'test.created',
    p_entity_type: 'tests',
    p_entity_id: data.id,
    p_metadata: { name: input.name }
  })
  return data as TestRow
}

export async function deleteTest(id: string, groupId: string) {
  const { error } = await supabase.from('tests').delete().eq('id', id)
  if (error) throw error
  await supabase.rpc('log_activity', {
    p_group_id: groupId,
    p_action: 'test.deleted',
    p_entity_type: 'tests',
    p_entity_id: id,
    p_metadata: {}
  })
}
