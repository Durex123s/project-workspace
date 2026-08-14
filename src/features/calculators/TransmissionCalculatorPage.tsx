import { useState, useMemo, useEffect } from 'react'
import { Calculator, Save, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/features/auth/AuthContext'
import { listGroups } from '@/features/groups/groupsService'
import type { Group } from '@/types'

// Calculateur "Transmission mécanique" — formules :
// d = m × Z          (diamètre primitif)
// L = π × d          (déplacement par tour)
// N = pas moteur × microstepping   (micro-pas par tour)
// Résolution = L / N (déplacement linéaire par micro-pas)
export default function TransmissionCalculatorPage() {
  const { user } = useAuth()
  const [motorStep, setMotorStep] = useState('1.8')
  const [microstepping, setMicrostepping] = useState('16')
  const [module, setModuleValue] = useState('2')
  const [teeth, setTeeth] = useState('20')
  const [motorSpeed, setMotorSpeed] = useState('') // tr/min, optionnel pour vitesse linéaire

  const [groups, setGroups] = useState<Group[]>([])
  const [groupId, setGroupId] = useState<string>('')
  const [label, setLabel] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    listGroups('ACTIVE').then(setGroups).catch(() => {})
  }, [])

  const results = useMemo(() => {
    const m = parseFloat(module)
    const Z = parseFloat(teeth)
    const pasMoteur = parseFloat(motorStep)
    const micro = parseFloat(microstepping)
    const speed = parseFloat(motorSpeed)

    if (!m || !Z || !pasMoteur || !micro) return null

    const d = m * Z // mm
    const L = Math.PI * d // mm par tour
    const stepsPerRev = 360 / pasMoteur
    const N = stepsPerRev * micro // micro-pas par tour
    const resolution = L / N // mm par micro-pas
    const linearSpeed = speed ? (L * speed) / 60 : null // mm/s si vitesse moteur fournie (tr/min)

    return { d, L, N, resolution, linearSpeed }
  }, [module, teeth, motorStep, microstepping, motorSpeed])

  async function handleSave() {
    if (!results || !user) return
    setSaving(true)
    try {
      await supabase.from('calculations').insert({
        group_id: groupId || null,
        calculator_key: 'mechanical_transmission',
        label: label || 'Calcul transmission',
        inputs: { module, teeth, motorStep, microstepping, motorSpeed },
        outputs: results,
        created_by: user.id
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 space-y-5 pb-24 max-w-2xl">
      <div className="flex items-center gap-2">
        <Calculator className="w-5 h-5 text-accent-soft" />
        <h1 className="text-xl font-bold">Calculateur — Transmission mécanique</h1>
      </div>

      <div className="card space-y-3">
        <h2 className="text-sm font-medium text-slate-300">Entrées</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Pas moteur (°)</label>
            <input className="input-field" inputMode="decimal" value={motorStep} onChange={(e) => setMotorStep(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Microstepping</label>
            <input className="input-field" inputMode="decimal" value={microstepping} onChange={(e) => setMicrostepping(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Module (mm)</label>
            <input className="input-field" inputMode="decimal" value={module} onChange={(e) => setModuleValue(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Nombre de dents Z</label>
            <input className="input-field" inputMode="decimal" value={teeth} onChange={(e) => setTeeth(e.target.value)} />
          </div>
          <div className="col-span-2">
            <label className="block text-xs text-slate-500 mb-1">Vitesse moteur (tr/min, optionnel)</label>
            <input className="input-field" inputMode="decimal" value={motorSpeed} onChange={(e) => setMotorSpeed(e.target.value)} />
          </div>
        </div>
      </div>

      {results && (
        <div className="card space-y-3">
          <h2 className="text-sm font-medium text-slate-300">Résultats</h2>
          <div className="space-y-2 text-sm">
            <ResultLine label="Diamètre primitif (d = m × Z)" value={`${results.d.toFixed(2)} mm`} />
            <ResultLine label="Déplacement par tour (L = π × d)" value={`${results.L.toFixed(2)} mm`} />
            <ResultLine label="Micro-pas par tour (N)" value={`${results.N.toFixed(0)}`} />
            <ResultLine label="Résolution (L / N)" value={`${results.resolution.toFixed(5)} mm/pas`} highlight />
            {results.linearSpeed != null && (
              <ResultLine label="Vitesse linéaire" value={`${results.linearSpeed.toFixed(2)} mm/s`} />
            )}
          </div>

          <div className="pt-2 border-t border-base-700 space-y-2">
            <input className="input-field" placeholder="Nom du calcul (optionnel)" value={label} onChange={(e) => setLabel(e.target.value)} />
            <select className="input-field" value={groupId} onChange={(e) => setGroupId(e.target.value)}>
              <option value="">Lier à un groupe (optionnel)</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>{g.code ? `#${g.code} — ` : ''}{g.name}</option>
              ))}
            </select>
            <button onClick={handleSave} disabled={saving} className="btn-primary w-full flex items-center justify-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saved ? 'Enregistré ✓' : 'Enregistrer ce calcul'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function ResultLine({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-400">{label}</span>
      <span className={highlight ? 'font-bold text-accent-soft' : 'text-slate-200'}>{value}</span>
    </div>
  )
}
