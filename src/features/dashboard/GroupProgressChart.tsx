import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import type { GroupProgress } from '@/types'

interface Props {
  groups: GroupProgress[]
}

interface TooltipPayloadItem {
  payload: GroupProgress
}

function ChartTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayloadItem[] }) {
  if (!active || !payload || payload.length === 0) return null
  const g = payload[0].payload
  return (
    <div className="bg-base-800 border border-base-600 rounded-lg px-3 py-2 text-xs shadow-lg">
      <p className="font-medium text-slate-100">{g.code ? `#${g.code} — ` : ''}{g.name}</p>
      <p className="text-slate-400 mt-0.5">{g.completed_tasks}/{g.total_tasks} tâches — {g.progress_percent}%</p>
    </div>
  )
}

// Graphique de progression par groupe. Purement dérivé des données
// déjà chargées (vue group_progress) — aucun calcul dupliqué ici.
export default function GroupProgressChart({ groups }: Props) {
  if (groups.length === 0) return null

  const data = groups.map((g) => ({
    ...g,
    label: g.code ? `#${g.code}` : g.name.slice(0, 8)
  }))

  return (
    <div className="card">
      <h2 className="text-sm font-medium text-slate-300 mb-3">Progression par groupe</h2>
      <ResponsiveContainer width="100%" height={Math.max(180, groups.length * 34)}>
        <BarChart data={data} layout="vertical" margin={{ left: 4, right: 16, top: 4, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
          <XAxis type="number" domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} width={48} />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(59,130,246,0.08)' }} />
          <Bar dataKey="progress_percent" fill="#3b82f6" radius={[0, 4, 4, 0]} maxBarSize={18} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
