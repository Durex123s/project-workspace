import { supabase } from '@/lib/supabase'
import type { ValidationRow, ValidationStatus } from '@/types'

export async function listValidationsForGroup(groupId: string) {
  const { data, error } = await supabase
    .from('validations')
    .select('*')
    .eq('group_id', groupId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as ValidationRow[]
}

export async function listPendingValidations() {
  const { data, error } = await supabase
    .from('validations')
    .select('*, groups(name, code)')
    .in('status', ['SUBMITTED', 'UNDER_REVIEW'])
    .order('submitted_at', { ascending: true })
  if (error) throw error
  return data as (ValidationRow & { groups: { name: string; code: string | null } | null })[]
}

export async function submitForValidation(groupId: string, submittedBy: string, taskId?: string) {
  const { data, error } = await supabase
    .from('validations')
    .insert({
      group_id: groupId,
      task_id: taskId ?? null,
      status: 'SUBMITTED',
      submitted_by: submittedBy,
      submitted_at: new Date().toISOString()
    })
    .select()
    .single()
  if (error) throw error
  await supabase.rpc('log_activity', {
    p_group_id: groupId,
    p_action: 'validation.submitted',
    p_entity_type: 'validations',
    p_entity_id: data.id,
    p_metadata: {}
  })
  return data as ValidationRow
}

export async function reviewValidation(
  id: string,
  groupId: string,
  status: Extract<ValidationStatus, 'VALIDATED' | 'REJECTED' | 'CORRECTION_REQUESTED'>,
  reviewedBy: string,
  comment?: string
) {
  const { data, error } = await supabase
    .from('validations')
    .update({
      status,
      reviewed_by: reviewedBy,
      review_comment: comment ?? null,
      reviewed_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  await supabase.rpc('log_activity', {
    p_group_id: groupId,
    p_action: 'validation.reviewed',
    p_entity_type: 'validations',
    p_entity_id: id,
    p_metadata: { status }
  })
  return data as ValidationRow
}
