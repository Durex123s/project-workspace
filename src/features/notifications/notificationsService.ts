import { supabase } from '@/lib/supabase'

export interface AppNotification {
  id: string
  recipient_id: string
  type: string
  title: string
  body: string | null
  group_id: string | null
  entity_type: string | null
  entity_id: string | null
  is_read: boolean
  created_at: string
}

export async function listMyNotifications(limit = 30) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data as AppNotification[]
}

export async function getUnreadCount() {
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('is_read', false)
  if (error) throw error
  return count ?? 0
}

export async function markAsRead(id: string) {
  const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id)
  if (error) throw error
}

export async function markAllAsRead() {
  const { error } = await supabase.from('notifications').update({ is_read: true }).eq('is_read', false)
  if (error) throw error
}

// ------------------------------------------------------------
// Création — appelée depuis les autres services au moment des
// événements clés (tâche assignée, validation soumise/traitée).
// Ne jamais notifier l'auteur de l'action lui-même.
// ------------------------------------------------------------
export interface CreateNotificationInput {
  recipient_id: string
  type: string
  title: string
  body?: string
  group_id?: string | null
  entity_type?: string
  entity_id?: string
}

export async function createNotification(input: CreateNotificationInput) {
  const { error } = await supabase.from('notifications').insert(input)
  if (error) throw error
}

export async function notifyStaff(input: Omit<CreateNotificationInput, 'recipient_id'>, excludeUserId?: string) {
  const { data: staff, error } = await supabase
    .from('profiles')
    .select('id')
    .in('global_role', ['ADMIN', 'TEACHER'])
  if (error) throw error
  const targets = (staff ?? []).filter((p) => p.id !== excludeUserId)
  if (targets.length === 0) return
  const { error: insertError } = await supabase
    .from('notifications')
    .insert(targets.map((p) => ({ ...input, recipient_id: p.id })))
  if (insertError) throw insertError
}
