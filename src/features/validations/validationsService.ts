import { supabase } from '@/lib/supabase'
import type { ValidationRow, ValidationStatus } from '@/types'
import { notifyStaff, createNotification } from '@/features/notifications/notificationsService'

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

  const { data: groupRow } = await supabase.from('groups').select('name, code').eq('id', groupId).single()
  await notifyStaff(
    {
      type: 'validation_submitted',
      title: 'Validation demandée',
      body: groupRow ? `${groupRow.code ? `#${groupRow.code} — ` : ''}${groupRow.name}` : undefined,
      group_id: groupId,
      entity_type: 'validations',
      entity_id: data.id
    },
    submittedBy
  )

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

  const STATUS_LABEL: Record<string, string> = {
    VALIDATED: 'Validation acceptée',
    REJECTED: 'Validation refusée',
    CORRECTION_REQUESTED: 'Correction demandée'
  }
  if (data.submitted_by && data.submitted_by !== reviewedBy) {
    await createNotification({
      recipient_id: data.submitted_by,
      type: 'validation_reviewed',
      title: STATUS_LABEL[status] ?? 'Validation mise à jour',
      body: comment || undefined,
      group_id: groupId,
      entity_type: 'validations',
      entity_id: id
    })
  }

  return data as ValidationRow
}
