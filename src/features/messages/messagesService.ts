import { supabase } from '@/lib/supabase'
import type { GroupMessage } from '@/types'

// ------------------------------------------------------------
// Discussion de groupe résiliente au hors-ligne.
// - Les messages envoyés sans connexion sont stockés en local
//   (queue par groupe) et affichés immédiatement (optimiste).
// - Dès que la connexion revient, la queue est vidée vers
//   Supabase. `client_id` évite les doublons si la synchro
//   est relancée plusieurs fois.
// - L'historique déjà reçu du serveur est mis en cache local
//   pour rester lisible hors-ligne (pas seulement l'envoi).
// ------------------------------------------------------------

const QUEUE_KEY = (groupId: string) => `pw_msg_queue_${groupId}`
const CACHE_KEY = (groupId: string) => `pw_msg_cache_${groupId}`

interface QueuedMessage {
  client_id: string
  group_id: string
  author_id: string
  content: string
  created_at: string
}

function readQueue(groupId: string): QueuedMessage[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY(groupId))
    return raw ? (JSON.parse(raw) as QueuedMessage[]) : []
  } catch {
    return []
  }
}

function writeQueue(groupId: string, queue: QueuedMessage[]) {
  localStorage.setItem(QUEUE_KEY(groupId), JSON.stringify(queue))
}

function readCache(groupId: string): GroupMessage[] {
  try {
    const raw = localStorage.getItem(CACHE_KEY(groupId))
    return raw ? (JSON.parse(raw) as GroupMessage[]) : []
  } catch {
    return []
  }
}

function writeCache(groupId: string, messages: GroupMessage[]) {
  // On garde un historique local raisonnable (200 derniers messages)
  localStorage.setItem(CACHE_KEY(groupId), JSON.stringify(messages.slice(-200)))
}

export function isOnline() {
  return typeof navigator === 'undefined' ? true : navigator.onLine
}

// Charge : messages distants si en ligne (et met à jour le cache),
// sinon le cache local. Fusionne toujours avec la queue en attente.
export async function loadMessages(groupId: string): Promise<GroupMessage[]> {
  let base: GroupMessage[] = readCache(groupId)

  if (isOnline()) {
    try {
      const { data, error } = await supabase
        .from('group_messages')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: true })
        .limit(200)
      if (!error && data) {
        base = data as GroupMessage[]
        writeCache(groupId, base)
      }
    } catch {
      // Réseau instable malgré navigator.onLine=true : on retombe sur le cache.
    }
  }

  const pending = readQueue(groupId).map((q) => ({
    id: `local-${q.client_id}`,
    group_id: q.group_id,
    author_id: q.author_id,
    content: q.content,
    client_id: q.client_id,
    created_at: q.created_at
  }))

  const knownClientIds = new Set(base.map((m) => m.client_id).filter(Boolean))
  const stillPending = pending.filter((p) => !knownClientIds.has(p.client_id))

  return [...base, ...stillPending]
}

// Envoie un message : tentative directe si en ligne, sinon mise
// en file d'attente locale (affichage optimiste immédiat).
export async function sendMessage(groupId: string, authorId: string, content: string): Promise<GroupMessage> {
  const clientId = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  const draft: QueuedMessage = {
    client_id: clientId,
    group_id: groupId,
    author_id: authorId,
    content,
    created_at: new Date().toISOString()
  }

  if (isOnline()) {
    try {
      const { data, error } = await supabase
        .from('group_messages')
        .insert({ group_id: groupId, author_id: authorId, content, client_id: clientId })
        .select()
        .single()
      if (error) throw error
      return data as GroupMessage
    } catch {
      // L'envoi direct a échoué malgré une connexion apparente : on file en attente.
    }
  }

  const queue = readQueue(groupId)
  queue.push(draft)
  writeQueue(groupId, queue)

  return {
    id: `local-${clientId}`,
    group_id: groupId,
    author_id: authorId,
    content,
    client_id: clientId,
    created_at: draft.created_at
  }
}

// Vide la file d'attente locale vers Supabase. À appeler au retour
// de connexion (voir useOfflineMessages). Retourne le nombre synchronisé.
export async function syncQueue(groupId: string): Promise<number> {
  if (!isOnline()) return 0
  const queue = readQueue(groupId)
  if (queue.length === 0) return 0

  let synced = 0
  const remaining: QueuedMessage[] = []

  for (const msg of queue) {
    try {
      const { error } = await supabase
        .from('group_messages')
        .insert({
          group_id: msg.group_id,
          author_id: msg.author_id,
          content: msg.content,
          client_id: msg.client_id
        })
      // Un conflit sur client_id (déjà synchronisé) n'est pas une erreur bloquante.
      if (error && !error.message.includes('duplicate')) throw error
      synced++
    } catch {
      remaining.push(msg)
    }
  }

  writeQueue(groupId, remaining)
  return synced
}

export function hasPendingMessages(groupId: string): boolean {
  return readQueue(groupId).length > 0
}
