import { supabase } from '@/lib/supabase'

export interface ActivityLogEntry {
  id: string
  group_id: string | null
  actor_id: string | null
  action: string
  entity_type: string | null
  entity_id: string | null
  metadata: Record<string, unknown>
  created_at: string
  actor: { full_name: string } | null
}

export async function listActivityForGroup(groupId: string, limit = 15) {
  const { data, error } = await supabase
    .from('activity_logs')
    .select('*, actor:profiles(full_name)')
    .eq('group_id', groupId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data as unknown as ActivityLogEntry[]
}

const ACTION_LABELS: Record<string, string> = {
  'group.created': 'a créé le groupe',
  'group.archived': 'a archivé le groupe',
  'group.restored': 'a restauré le groupe',
  'member.added': 'a ajouté un membre',
  'member.removed': 'a retiré un membre',
  'task.created': 'a créé une tâche',
  'task.status_changed': 'a changé le statut d\'une tâche',
  'document.uploaded': 'a ajouté un document',
  'test.created': 'a enregistré un test',
  'test.deleted': 'a supprimé un test',
  'measurement.created': 'a ajouté une mesure',
  'measurement.deleted': 'a supprimé une mesure',
  'validation.submitted': 'a soumis le groupe pour validation',
  'validation.reviewed': 'a traité une validation'
}

export function describeAction(entry: ActivityLogEntry): string {
  return ACTION_LABELS[entry.action] ?? entry.action
}

export function timeAgo(dateStr: string) {
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const min = Math.floor(diffMs / 60000)
  if (min < 1) return "à l'instant"
  if (min < 60) return `il y a ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `il y a ${h} h`
  return `il y a ${Math.floor(h / 24)} j`
}
