import { useState, useMemo } from "react";
import {
  LayoutDashboard, LayoutGrid, FlaskConical, FileText, User, Settings,
  Plus, X, Users, ListChecks, ClipboardCheck, ChevronRight, Archive,
  Pencil, Trash2, Loader2
} from "lucide-react";

// ============================================================
// PROJECT WORKSPACE — Prototype interactif
// Données en mémoire (pas de backend) pour visualiser le flux :
// dashboard dynamique -> liste de groupes -> espace de groupe
// (kanban) -> création dynamique d'un nouveau groupe depuis l'admin.
// Rien n'est codé "en dur" côté logique : ajouter un groupe ici
// met à jour dashboard, liste et statistiques automatiquement.
// ============================================================

const STATUS_COLUMNS = [
  { key: "TODO", label: "À faire" },
  { key: "IN_PROGRESS", label: "En cours" },
  { key: "IN_TEST", label: "En test" },
  { key: "DONE", label: "Terminé" },
  { key: "VALIDATED", label: "Validé" },
];

const PRIORITY_STYLES = {
  LOW: "bg-slate-600/30 text-slate-300",
  MEDIUM: "bg-blue-500/20 text-blue-300",
  HIGH: "bg-amber-500/20 text-amber-300",
  URGENT: "bg-red-500/20 text-red-300",
};

const initialGroups = [
  {
    id: "g1",
    code: "3",
    name: "Structure & châssis",
    theme: "Conception et soudure du bâti principal",
    tasks: [
      { id: "t1", title: "Découper les profilés aluminium", status: "DONE", priority: "MEDIUM" },
      { id: "t2", title: "Souder le châssis", status: "DONE", priority: "HIGH" },
      { id: "t3", title: "Contrôler l'équerrage", status: "IN_TEST", priority: "MEDIUM" },
      { id: "t4", title: "Peindre la structure", status: "TODO", priority: "LOW" },
    ],
  },
  {
    id: "g2",
    code: "7",
    name: "Transmission mécanique des axes",
    theme: "Crémaillères, pignons, synchronisation Y",
    tasks: [
      { id: "t5", title: "Installer les crémaillères", status: "DONE", priority: "HIGH" },
      { id: "t6", title: "Monter les accouplements", status: "DONE", priority: "MEDIUM" },
      { id: "t7", title: "Régler le jeu mécanique", status: "IN_PROGRESS", priority: "HIGH" },
      { id: "t8", title: "Synchroniser les axes Y", status: "TODO", priority: "URGENT" },
      { id: "t9", title: "Tester la fluidité", status: "TODO", priority: "MEDIUM" },
    ],
  },
  {
    id: "g3",
    code: "10",
    name: "Alimentation & électronique",
    theme: "Câblage puissance, drivers moteurs",
    tasks: [
      { id: "t10", title: "Câbler l'alimentation 48V", status: "VALIDATED", priority: "HIGH" },
      { id: "t11", title: "Installer les drivers", status: "DONE", priority: "MEDIUM" },
      { id: "t12", title: "Tester les moteurs à vide", status: "IN_TEST", priority: "MEDIUM" },
    ],
  },
];

function computeProgress(tasks) {
  if (tasks.length === 0) return 0;
  const done = tasks.filter((t) => t.status === "DONE" || t.status === "VALIDATED").length;
  return Math.round((done / tasks.length) * 100);
}

function Sidebar({ tab, setTab, isAdmin }) {
  const items = [
    { key: "dashboard", label: "Tableau de bord", icon: LayoutDashboard },
    { key: "groups", label: "Groupes", icon: LayoutGrid },
    { key: "tests", label: "Tests & mesures", icon: FlaskConical },
    { key: "documents", label: "Documents", icon: FileText },
    { key: "profile", label: "Mon profil", icon: User },
  ];
  return (
    <aside className="hidden md:flex md:w-60 md:flex-col border-r border-slate-800 bg-[#0b1220] p-4 shrink-0">
      <div className="mb-6 flex items-center gap-2">
        <div className="w-8 h-8 rounded-md bg-blue-600 flex items-center justify-center font-bold text-sm">PW</div>
        <span className="font-bold tracking-tight">Project Workspace</span>
      </div>
      <nav className="space-y-1 flex-1">
        {items.map((it) => (
          <button
            key={it.key}
            onClick={() => setTab(it.key)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-left transition-colors ${
              tab === it.key ? "bg-blue-500/15 text-blue-300" : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
            }`}
          >
            <it.icon className="w-4 h-4" />
            {it.label}
          </button>
        ))}
        {isAdmin && (
          <button
            onClick={() => setTab("admin")}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-left transition-colors ${
              tab === "admin" ? "bg-blue-500/15 text-blue-300" : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
            }`}
          >
            <Settings className="w-4 h-4" />
            Administration
          </button>
        )}
      </nav>
      <div className="text-xs text-slate-500 pt-4 border-t border-slate-800">
        Durex · ADMIN
        <div className="text-slate-600 mt-0.5">Prototype — données locales</div>
      </div>
    </aside>
  );
}

function BottomNav({ tab, setTab, isAdmin }) {
  const items = [
    { key: "dashboard", label: "Accueil", icon: LayoutDashboard },
    { key: "groups", label: "Groupes", icon: LayoutGrid },
    { key: "tests", label: "Tests", icon: FlaskConical },
    isAdmin ? { key: "admin", label: "Admin", icon: Settings } : { key: "profile", label: "Profil", icon: User },
  ];
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0b1220] border-t border-slate-800 flex items-center justify-around py-2 z-30">
      {items.map((it) => (
        <button
          key={it.key}
          onClick={() => setTab(it.key)}
          className={`flex flex-col items-center gap-0.5 px-3 py-1 text-[11px] ${
            tab === it.key ? "text-blue-300" : "text-slate-500"
          }`}
        >
          <it.icon className="w-5 h-5" />
          {it.label}
        </button>
      ))}
    </nav>
  );
}

function StatCard({ icon: Icon, label, value, sub }) {
  return (
    <div className="bg-[#111a2c] border border-slate-800 rounded-xl p-4">
      <Icon className="w-4 h-4 text-blue-400 mb-2" />
      <div className="text-lg font-bold">{value}</div>
      <div className="text-xs text-slate-400">{label}</div>
      {sub && <div className="text-[11px] text-slate-600 mt-0.5">{sub}</div>}
    </div>
  );
}

function ProgressBar({ percent }) {
  return (
    <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-500"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

function Dashboard({ groups, setTab, setActiveGroupId }) {
  const stats = useMemo(() => {
    const allTasks = groups.flatMap((g) => g.tasks);
    const completed = allTasks.filter((t) => t.status === "DONE" || t.status === "VALIDATED").length;
    return {
      totalGroups: groups.length,
      totalTasks: allTasks.length,
      completed,
      inProgress: allTasks.filter((t) => t.status === "IN_PROGRESS").length,
      globalPercent: allTasks.length ? Math.round((completed / allTasks.length) * 100) : 0,
    };
  }, [groups]);

  return (
    <div className="p-4 sm:p-6 space-y-5 pb-24 md:pb-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold">Tableau de bord</h1>
        <p className="text-sm text-slate-400">
          Calculé à partir de {stats.totalGroups} groupe{stats.totalGroups > 1 ? "s" : ""} — jamais écrit en dur.
        </p>
      </div>

      <div className="bg-[#111a2c] border border-slate-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-slate-400">Progression globale du projet</span>
          <span className="text-2xl font-bold text-blue-300">{stats.globalPercent}%</span>
        </div>
        <ProgressBar percent={stats.globalPercent} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={LayoutGrid} label="Groupes actifs" value={stats.totalGroups} />
        <StatCard icon={ListChecks} label="Tâches" value={`${stats.completed}/${stats.totalTasks}`} sub={`${stats.inProgress} en cours`} />
        <StatCard icon={FlaskConical} label="Tests réalisés" value={4} sub="DONNÉE DE DÉMONSTRATION" />
        <StatCard icon={ClipboardCheck} label="Validations en attente" value={1} sub="DONNÉE DE DÉMONSTRATION" />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-medium text-sm text-slate-300">Groupes</h2>
          <button onClick={() => setTab("groups")} className="text-xs text-blue-300">Voir tout</button>
        </div>
        <div className="space-y-2">
          {groups.map((g) => (
            <button
              key={g.id}
              onClick={() => { setActiveGroupId(g.id); setTab("groupDetail"); }}
              className="w-full text-left bg-[#111a2c] border border-slate-800 rounded-xl p-3.5 flex items-center justify-between hover:border-slate-700 transition-colors"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">#{g.code}</span>
                  <span className="font-medium text-sm truncate">{g.name}</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5 truncate">{g.theme}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-sm font-semibold text-blue-300">{computeProgress(g.tasks)}%</span>
                <ChevronRight className="w-4 h-4 text-slate-600" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function GroupsList({ groups, setTab, setActiveGroupId }) {
  return (
    <div className="p-4 sm:p-6 space-y-3 pb-24 md:pb-6 max-w-4xl">
      <h1 className="text-xl font-bold">Groupes</h1>
      <p className="text-sm text-slate-400 -mt-2">{groups.length} groupe{groups.length > 1 ? "s" : ""} actif{groups.length > 1 ? "s" : ""}</p>
      <div className="space-y-2">
        {groups.map((g) => (
          <button
            key={g.id}
            onClick={() => { setActiveGroupId(g.id); setTab("groupDetail"); }}
            className="w-full text-left bg-[#111a2c] border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">#{g.code}</span>
                  <span className="font-medium truncate">{g.name}</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{g.theme}</p>
              </div>
              <span className="text-sm font-semibold text-blue-300 shrink-0">{computeProgress(g.tasks)}%</span>
            </div>
            <ProgressBar percent={computeProgress(g.tasks)} />
          </button>
        ))}
      </div>
    </div>
  );
}

function GroupDetail({ group, updateTaskStatus, addTask, setTab }) {
  const [newTitle, setNewTitle] = useState("");
  const [showForm, setShowForm] = useState(false);
  const progress = computeProgress(group.tasks);

  return (
    <div className="pb-24 md:pb-6">
      <div className="p-4 sm:p-6 border-b border-slate-800 bg-[#0b1220] sticky top-0 z-10">
        <button onClick={() => setTab("groups")} className="text-xs text-slate-500 mb-2">← Retour aux groupes</button>
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">#{group.code}</div>
        <h1 className="text-lg font-bold">{group.name}</h1>
        <p className="text-sm text-slate-400">{group.theme}</p>
        <div className="mt-3 flex items-center gap-3">
          <div className="flex-1"><ProgressBar percent={progress} /></div>
          <span className="text-sm font-semibold text-blue-300 shrink-0">{progress}%</span>
        </div>
      </div>

      <div className="p-4 sm:p-6 max-w-5xl">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-sm text-slate-300">Tâches ({group.tasks.length})</h3>
          <button onClick={() => setShowForm((s) => !s)} className="bg-slate-800 hover:bg-slate-700 text-sm rounded-lg px-3 py-1.5 flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> Nouvelle tâche
          </button>
        </div>

        {showForm && (
          <div className="flex gap-2 mb-4">
            <input
              autoFocus
              className="flex-1 bg-[#0b1220] border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Titre de la tâche"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newTitle.trim()) {
                  addTask(group.id, newTitle);
                  setNewTitle("");
                  setShowForm(false);
                }
              }}
            />
            <button
              onClick={() => { if (newTitle.trim()) { addTask(group.id, newTitle); setNewTitle(""); setShowForm(false); } }}
              className="bg-blue-600 hover:bg-blue-500 text-sm rounded-lg px-4"
            >
              Ajouter
            </button>
          </div>
        )}

        <div className="flex gap-3 overflow-x-auto pb-2">
          {STATUS_COLUMNS.map((col) => {
            const colTasks = group.tasks.filter((t) => t.status === col.key);
            return (
              <div key={col.key} className="min-w-[230px] flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">{col.label}</span>
                  <span className="text-xs text-slate-600">{colTasks.length}</span>
                </div>
                <div className="space-y-2">
                  {colTasks.map((task) => (
                    <div key={task.id} className="bg-[#111a2c] border border-slate-800 rounded-lg p-3">
                      <p className="text-sm font-medium">{task.title}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${PRIORITY_STYLES[task.priority]}`}>
                          {task.priority}
                        </span>
                        <select
                          value={task.status}
                          onChange={(e) => updateTaskStatus(group.id, task.id, e.target.value)}
                          className="text-[11px] bg-[#0b1220] border border-slate-700 rounded px-1.5 py-0.5"
                        >
                          {STATUS_COLUMNS.map((c) => (
                            <option key={c.key} value={c.key}>{c.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                  {colTasks.length === 0 && (
                    <div className="text-xs text-slate-600 text-center py-4 border border-dashed border-slate-800 rounded-lg">Vide</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function AdminGroups({ groups, createGroup, archiveGroup, deleteGroup }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: "", code: "", theme: "" });

  function handleCreate() {
    if (!form.name.trim()) return;
    createGroup(form);
    setForm({ name: "", code: "", theme: "" });
    setModalOpen(false);
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 pb-24 md:pb-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Gestion des groupes</h1>
          <p className="text-sm text-slate-400">{groups.length} groupe{groups.length > 1 ? "s" : ""}</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="bg-blue-600 hover:bg-blue-500 text-sm rounded-lg px-3 py-2 flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> Créer un groupe
        </button>
      </div>

      <div className="space-y-2">
        {groups.map((g) => (
          <div key={g.id} className="bg-[#111a2c] border border-slate-800 rounded-xl p-3.5 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">#{g.code}</span>
                <span className="font-medium text-sm truncate">{g.name}</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{g.tasks.length} tâche{g.tasks.length > 1 ? "s" : ""} — {computeProgress(g.tasks)}%</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button className="p-2 text-slate-400 hover:text-white" title="Modifier"><Pencil className="w-4 h-4" /></button>
              <button onClick={() => archiveGroup(g.id)} className="p-2 text-slate-400 hover:text-amber-400" title="Archiver"><Archive className="w-4 h-4" /></button>
              <button onClick={() => deleteGroup(g.id)} className="p-2 text-slate-400 hover:text-red-400" title="Supprimer"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
        {groups.length === 0 && (
          <div className="text-center py-10 text-slate-500 text-sm bg-[#111a2c] border border-slate-800 rounded-xl">
            Aucun groupe. Crée-en un — le dashboard se mettra à jour automatiquement.
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-[#111a2c] border border-slate-700 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm">
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <h2 className="font-semibold">Créer un groupe</h2>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Nom du groupe *</label>
                <input className="w-full bg-[#0b1220] border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="ex : Découpe et gravure" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Code / numéro</label>
                <input className="w-full bg-[#0b1220] border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} placeholder="ex : 12" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Thème</label>
                <input className="w-full bg-[#0b1220] border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.theme} onChange={(e) => setForm((f) => ({ ...f, theme: e.target.value }))} />
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => setModalOpen(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 rounded-lg py-2 text-sm">Annuler</button>
                <button onClick={handleCreate} className="flex-1 bg-blue-600 hover:bg-blue-500 rounded-lg py-2 text-sm">Créer le groupe</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SimplePage({ title, note }) {
  return (
    <div className="p-4 sm:p-6 pb-24 md:pb-6 max-w-4xl">
      <h1 className="text-xl font-bold mb-2">{title}</h1>
      <div className="bg-[#111a2c] border border-slate-800 rounded-xl text-center py-12 text-slate-500 text-sm">{note}</div>
    </div>
  );
}

export default function ProjectWorkspacePrototype() {
  const [groups, setGroups] = useState(initialGroups);
  const [tab, setTab] = useState("dashboard");
  const [activeGroupId, setActiveGroupId] = useState(null);

  function updateTaskStatus(groupId, taskId, status) {
    setGroups((prev) =>
      prev.map((g) =>
        g.id !== groupId ? g : { ...g, tasks: g.tasks.map((t) => (t.id === taskId ? { ...t, status } : t)) }
      )
    );
  }

  function addTask(groupId, title) {
    setGroups((prev) =>
      prev.map((g) =>
        g.id !== groupId
          ? g
          : { ...g, tasks: [...g.tasks, { id: `t${Date.now()}`, title, status: "TODO", priority: "MEDIUM" }] }
      )
    );
  }

  function createGroup(form) {
    const id = `g${Date.now()}`;
    setGroups((prev) => [...prev, { id, code: form.code || String(prev.length + 1), name: form.name, theme: form.theme, tasks: [] }]);
  }

  function archiveGroup(id) {
    setGroups((prev) => prev.filter((g) => g.id !== id));
  }

  function deleteGroup(id) {
    setGroups((prev) => prev.filter((g) => g.id !== id));
  }

  const activeGroup = groups.find((g) => g.id === activeGroupId);

  return (
    <div className="min-h-screen bg-[#0a0e17] text-slate-100 flex" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      <Sidebar tab={tab} setTab={setTab} isAdmin />
      <main className="flex-1 min-w-0">
        {tab === "dashboard" && <Dashboard groups={groups} setTab={setTab} setActiveGroupId={setActiveGroupId} />}
        {tab === "groups" && <GroupsList groups={groups} setTab={setTab} setActiveGroupId={setActiveGroupId} />}
        {tab === "groupDetail" && activeGroup && (
          <GroupDetail group={activeGroup} updateTaskStatus={updateTaskStatus} addTask={addTask} setTab={setTab} />
        )}
        {tab === "tests" && <SimplePage title="Tests & mesures" note="Module à connecter — voir les tests par groupe dans une prochaine itération." />}
        {tab === "documents" && <SimplePage title="Documents" note="Espace documentaire à connecter à Supabase Storage." />}
        {tab === "profile" && <SimplePage title="Mon profil" note="Durex · ADMIN — gestion du compte à venir." />}
        {tab === "admin" && (
          <AdminGroups groups={groups} createGroup={createGroup} archiveGroup={archiveGroup} deleteGroup={deleteGroup} />
        )}
      </main>
      <BottomNav tab={tab} setTab={setTab} isAdmin />
    </div>
  );
}
