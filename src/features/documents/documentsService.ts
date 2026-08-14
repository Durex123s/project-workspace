import { supabase } from '@/lib/supabase'
import type { DocumentRow, DocumentCategory } from '@/types'

const BUCKET = 'documents'

export async function listDocumentsForGroup(groupId: string) {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('group_id', groupId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as DocumentRow[]
}

export function guessCategory(file: File): DocumentCategory {
  const type = file.type
  const name = file.name.toLowerCase()
  if (type.startsWith('image/')) return 'PHOTO'
  if (type.startsWith('video/')) return 'VIDEO'
  if (type === 'application/pdf' || name.endsWith('.pdf')) return 'REPORT'
  if (name.endsWith('.doc') || name.endsWith('.docx')) return 'REPORT'
  return 'OTHER'
}

export async function uploadDocument(
  groupId: string,
  file: File,
  category: DocumentCategory,
  uploadedBy: string,
  description?: string
) {
  const safeName = file.name.replace(/[^\w.\-]+/g, '_')
  const path = `${groupId}/${Date.now()}_${safeName}`

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false
  })
  if (uploadError) throw uploadError

  const { data, error } = await supabase
    .from('documents')
    .insert({
      group_id: groupId,
      category,
      storage_path: path,
      file_name: file.name,
      description: description || null,
      uploaded_by: uploadedBy
    })
    .select()
    .single()
  if (error) throw error

  await supabase.rpc('log_activity', {
    p_group_id: groupId,
    p_action: 'document.uploaded',
    p_entity_type: 'documents',
    p_entity_id: data.id,
    p_metadata: { file_name: file.name, category }
  })

  return data as DocumentRow
}

export async function getDocumentUrl(storagePath: string) {
  // Bucket privé : URL signée temporaire (1h)
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(storagePath, 3600)
  if (error) throw error
  return data.signedUrl
}

export async function deleteDocument(id: string, storagePath: string) {
  const { error: storageError } = await supabase.storage.from(BUCKET).remove([storagePath])
  if (storageError) throw storageError
  const { error } = await supabase.from('documents').delete().eq('id', id)
  if (error) throw error
}
