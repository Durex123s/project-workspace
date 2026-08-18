import { supabase } from '@/lib/supabase'

export interface SearchResults {
  groups: { id: string; name: string; code: string | null }[]
  tasks: { id: string; title: string; group_id: string; group_name: string | null }[]
  tests: { id: string; name: string; group_id: string; group_name: string | null }[]
  documents: { id: string; file_name: string; group_id: string; group_name: string | null }[]
  members: { id: string; full_name: string; email: string }[]
}

const EMPTY_RESULTS: SearchResults = { groups: [], tasks: [], tests: [], documents: [], members: [] }

export async function globalSearch(query: string): Promise<SearchResults> {
  const q = query.trim()
  if (q.length < 2) return EMPTY_RESULTS

  const like = `%${q}%`

  const [groups, tasks, tests, documents, members] = await Promise.all([
    supabase.from('groups').select('id, name, code').or(`name.ilike.${like},theme.ilike.${like},description.ilike.${like}`).limit(8),
    supabase.from('group_tasks').select('id, title, group_id, groups(name)').ilike('title', like).limit(8),
    supabase.from('tests').select('id, name, group_id, groups(name)').ilike('name', like).limit(8),
    supabase.from('documents').select('id, file_name, group_id, groups(name)').ilike('file_name', like).limit(8),
    supabase.from('profiles').select('id, full_name, email').or(`full_name.ilike.${like},email.ilike.${like}`).limit(8)
  ])

  if (groups.error) throw groups.error
  if (tasks.error) throw tasks.error
  if (tests.error) throw tests.error
  if (documents.error) throw documents.error
  if (members.error) throw members.error

  type WithGroup = { groups: { name: string } | null }

  return {
    groups: groups.data ?? [],
    tasks: (tasks.data ?? []).map((t) => ({ ...t, group_name: (t as unknown as WithGroup).groups?.name ?? null })),
    tests: (tests.data ?? []).map((t) => ({ ...t, group_name: (t as unknown as WithGroup).groups?.name ?? null })),
    documents: (documents.data ?? []).map((d) => ({ ...d, group_name: (d as unknown as WithGroup).groups?.name ?? null })),
    members: members.data ?? []
  }
}
