import { useEffect, useRef, useState } from 'react'
import { Upload, FileText, Image as ImageIcon, Video, File as FileIcon, Trash2, Loader2, Download } from 'lucide-react'
import { listDocumentsForGroup, uploadDocument, guessCategory, getDocumentUrl, deleteDocument } from '@/features/documents/documentsService'
import { useAuth } from '@/features/auth/AuthContext'
import type { DocumentRow, DocumentCategory } from '@/types'

const CATEGORY_ICON: Record<DocumentCategory, typeof FileText> = {
  PLAN: FileText,
  REPORT: FileText,
  PHOTO: ImageIcon,
  VIDEO: Video,
  CALCULATION: FileText,
  TEST: FileText,
  OTHER: FileIcon
}

const CATEGORY_LABEL: Record<DocumentCategory, string> = {
  PLAN: 'Plan',
  REPORT: 'Rapport',
  PHOTO: 'Photo',
  VIDEO: 'Vidéo',
  CALCULATION: 'Calcul',
  TEST: 'Test',
  OTHER: 'Autre'
}

export default function GroupDocumentsTab({ groupId }: { groupId: string }) {
  const { user } = useAuth()
  const [docs, setDocs] = useState<DocumentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function load() {
    setLoading(true)
    listDocumentsForGroup(groupId).then(setDocs).catch((e) => setError(e.message)).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [groupId])

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setError(null)
    setUploading(true)
    try {
      await uploadDocument(groupId, file, guessCategory(file), user.id)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'envoi du fichier")
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleOpen(doc: DocumentRow) {
    try {
      const url = await getDocumentUrl(doc.storage_path)
      window.open(url, '_blank')
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible d'ouvrir le fichier")
    }
  }

  async function handleDelete(doc: DocumentRow) {
    if (!confirm(`Supprimer "${doc.file_name}" ?`)) return
    try {
      await deleteDocument(doc.id, doc.storage_path)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression')
    }
  }

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-sm text-slate-300">Documents ({docs.length})</h3>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="btn-secondary text-sm flex items-center gap-1.5"
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          Envoyer un fichier
        </button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.doc,.docx,image/*,video/*"
          onChange={handleFileSelected}
        />
      </div>

      {error && (
        <div className="bg-status-blocked/10 border border-status-blocked/30 text-status-blocked text-sm rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {loading && <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-slate-500" /></div>}

      {!loading && docs.length === 0 && (
        <div className="card text-center py-8 text-slate-500 text-sm">
          Aucun document. Envoie un PDF, un Word, une photo ou une vidéo depuis le bouton ci-dessus.
        </div>
      )}

      <div className="space-y-2">
        {docs.map((doc) => {
          const Icon = CATEGORY_ICON[doc.category]
          return (
            <div key={doc.id} className="card flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-base-700 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-accent-soft" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{doc.file_name}</p>
                <p className="text-xs text-slate-500">{CATEGORY_LABEL[doc.category]}</p>
              </div>
              <button onClick={() => handleOpen(doc)} className="p-2 text-slate-400 hover:text-accent-soft" title="Ouvrir / télécharger" aria-label="Ouvrir ou télécharger le document">
                <Download className="w-4 h-4" />
              </button>
              <button onClick={() => handleDelete(doc)} className="p-2 text-slate-400 hover:text-status-blocked" title="Supprimer" aria-label="Supprimer le document">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
