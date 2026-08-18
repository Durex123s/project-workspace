import { supabase } from '@/lib/supabase'
import type { Measurement } from '@/types'

export async function listMeasurementsForGroup(groupId: string) {
  const { data, error } = await supabase
    .from('measurements')
    .select('*')
    .eq('group_id', groupId)
    .order('measured_at', { ascending: false })
  if (error) throw error
  return data as Measurement[]
}

export interface CreateMeasurementInput {
  group_id: string
  label: string
  theoretical_value?: number | null
  measured_value?: number | null
  unit?: string
  comment?: string
}

export async function createMeasurement(input: CreateMeasurementInput, operatorId: string) {
  const { data, error } = await supabase
    .from('measurements')
    .insert({ ...input, operator_id: operatorId })
    .select()
    .single()
  if (error) throw error
  await supabase.rpc('log_activity', {
    p_group_id: input.group_id,
    p_action: 'measurement.created',
    p_entity_type: 'measurements',
    p_entity_id: data.id,
    p_metadata: { label: input.label }
  })
  return data as Measurement
}

export async function deleteMeasurement(id: string, groupId: string) {
  const { error } = await supabase.from('measurements').delete().eq('id', id)
  if (error) throw error
  await supabase.rpc('log_activity', {
    p_group_id: groupId,
    p_action: 'measurement.deleted',
    p_entity_type: 'measurements',
    p_entity_id: id,
    p_metadata: {}
  })
}

// Contrairement à `tests`, les erreurs ne sont pas stockées en base
// pour measurements (pas de colonnes générées) — calcul à l'affichage.
export function computeError(theoretical: number | null, measured: number | null) {
  if (theoretical == null || measured == null) return { absolute: null, relativePct: null }
  const absolute = Math.abs(theoretical - measured)
  const relativePct = theoretical !== 0 ? (absolute / Math.abs(theoretical)) * 100 : null
  return { absolute, relativePct }
}
