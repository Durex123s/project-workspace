// Petit utilitaire générique d'export CSV — pas de dépendance
// supplémentaire nécessaire, juste un Blob téléchargé côté client.
export function exportToCsv(filename: string, rows: Record<string, string | number | null>[]) {
  if (rows.length === 0) return

  const headers = Object.keys(rows[0])
  const escape = (val: string | number | null) => {
    const s = val == null ? '' : String(val)
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`
    }
    return s
  }

  const lines = [
    headers.join(','),
    ...rows.map((row) => headers.map((h) => escape(row[h])).join(','))
  ]
  const csv = '\uFEFF' + lines.join('\n') // BOM pour un affichage correct des accents dans Excel

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
