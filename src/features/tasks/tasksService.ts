import { supabase } from '@/lib/supabase'
import type { GroupTask, TaskStatus } from '@/types'
import { createNotification } from '@/features/notifications/notificationsService'

export async function listTasksForGroup(groupId: string) {
  const { data, error } = await supabase
    .from('group_tasks')
    .select('*')
    .eq('group_id', groupId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data as GroupTask[]
}

export interface CreateTaskInput {
  group_id: string
  title: string
  description?: string
  priority?: GroupTask['priority']
  due_date?: string | null
  assignee_id?: string | null
}

export async function createTask(input: CreateTaskInput, createdBy: string) {
  const { data, error } = await supabase
    .from('group_tasks')
    .insert({ ...input, created_by: createdBy })
    .select()
    .single()
  if (error) throw error
  await supabase.rpc('log_activity', {
    p_group_id: input.group_id,
    p_action: 'task.created',
    p_entity_type: 'group_tasks',
    p_entity_id: data.id,
    p_metadata: { title: input.title }
  })

  if (input.assignee_id && input.assignee_id !== createdBy) {
    await createNotification({
      recipient_id: input.assignee_id,
      type: 'task_assigned',
      title: 'Nouvelle tâche assignée',
      body: input.title,
      group_id: input.group_id,
      entity_type: 'group_tasks',
      entity_id: data.id
    })
  }

  return data as GroupTask
}

export async function updateTaskStatus(taskId: string, groupId: string, status: TaskStatus) {
  const { data, error } = await supabase
    .from('group_tasks')
    .update({ status })
    .eq('id', taskId)
    .select()
    .single()
  if (error) throw error
  await supabase.rpc('log_activity', {
    p_group_id: groupId,
    p_action: 'task.status_changed',
    p_entity_type: 'group_tasks',
    p_entity_id: taskId,
    p_metadata: { status }
  })
  return data as GroupTask
}
