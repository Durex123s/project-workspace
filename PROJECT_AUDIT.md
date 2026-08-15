# PROJECT_AUDIT.md — Project Workspace

Audit réalisé par inspection directe du code (grep/lecture des fichiers réels), pas par supposition. Aucune modification de code n'a été faite pendant cette phase — seul ce fichier a été créé.

---

## 1. Résumé exécutif

**État général : 6.5/10.**

L'application est réellement fonctionnelle et branchée à Supabase de bout en bout (aucune donnée mock/fake détectée dans tout `src/`). L'architecture est propre et cohérente. Les faiblesses principales ne sont pas des placeholders déguisés en fonctionnalités — ce sont des **modules réellement absents** (notifications, dépendances entre groupes, mesures séparées des tests, recherche globale, Realtime) alors que leur infrastructure base de données existe déjà, prête à être branchée.

---

## 2. Architecture

**Structure** : 34 fichiers dans `src/`, organisation par `features/<domaine>/` (auth, groups, tasks, tests, validations, documents, messages, calculators, admin, dashboard, profile) + `components/`, `layouts/`, `lib/`, `routes/`, `types/`. Cohérent, un seul style dans tout le projet.

**Forces** :
- Séparation service (`*Service.ts`, appels Supabase) / UI (composants) respectée partout — aucun appel `supabase.from(...)` trouvé directement dans un composant de présentation isolé (sauf 2 exceptions mineures : `DashboardPage.tsx` et `GroupOverviewTab.tsx` interrogent Supabase directement au lieu de passer par un service).
- Un seul composant dépasse 150 lignes (`AdminGroupsPage.tsx`, 151 lignes) — pas de fichier fourre-tout.
- Aucun `console.log`, aucun `any` explicite trouvé dans tout le code.
- Routing dynamique propre : `/groups/:groupId/*` dessert tous les groupes sans route codée en dur, conforme à la contrainte historique du projet.

**Faiblesses** :
- Deux services déclarés dans `package.json` (`recharts`, `clsx`) mais **jamais importés nulle part** — dépendances mortes, alourdissent le bundle pour rien.
- Pas de couche de gestion d'état globale (contexte React limité à `AuthContext`) — chaque écran refait son propre `useState`/`useEffect` de chargement. Fonctionnel mais répétitif.
- Pas de test automatisé (aucun fichier `*.test.ts`).

---

## 3. Fonctionnalités — inventaire réel

| Fonctionnalité | Présente | Fonctionnelle | Partielle | Placeholder | Priorité |
|---|---|---|---|---|---|
| Auth (login/signup) | ✅ | ✅ | | | — |
| Récupération mot de passe | ❌ | | | | HIGH |
| Dashboard | ✅ | ✅ (stats réelles via vue SQL) | | | — |
| Groupes (CRUD dynamique) | ✅ | ✅ | | | — |
| Membres | ✅ | ✅ | | | — |
| Tâches / Kanban | ✅ | | ⚠️ | | HIGH |
| Tests (théorique/mesuré/erreur) | ✅ | ✅ | | | — |
| Mesures (table `measurements` séparée) | ✅ (DB) | | | ✅ (aucune UI) | MEDIUM |
| Calculateurs | ✅ | ✅ (1 seul : transmission) | | | LOW |
| Documents (upload Storage) | ✅ | ✅ | | | — |
| Messages (discussion + hors-ligne) | ✅ | ✅ (queue locale) | ⚠️ pas de Realtime | | MEDIUM |
| Notifications | ✅ (DB) | | | ✅ (aucune UI) | HIGH |
| Validations | ✅ | ✅ (soumission → revue) | | | — |
| Profil | ✅ | ✅ | | | — |
| Admin (gestion groupes) | ✅ | ✅ | | | — |
| Annonces (`announcements`) | ✅ (DB) | | | ✅ (aucune UI) | LOW |
| Dépendances entre groupes | ✅ (DB) | | | ✅ (aucune UI) | MEDIUM |
| Activity logs | ✅ | ✅ (écriture via RPC), pas de vue frontend | ⚠️ | | LOW |
| Offline (messages) | ✅ | ✅ | | | — |
| PWA | ✅ | ✅ (icônes + manifest présents) | | | — |
| Android (Capacitor) | ✅ | ✅ (build CI fonctionnel) | | | — |
| Recherche globale | ❌ | | | | MEDIUM |

**Détail tâches (⚠️ HIGH)** : le formulaire de création de tâche (`GroupTasksTab.tsx`) n'envoie que `{ group_id, title }`. La priorité est donc **toujours** `MEDIUM` par défaut, `due_date` et `assignee_id` ne sont **jamais** renseignables depuis l'interface — alors que le schéma, le type `GroupTask` et `tasksService.createTask()` les supportent déjà. C'est une fonctionnalité à moitié câblée : la tuyauterie existe, le robinet n'a pas de poignée.

---

## 4. Base de données

17 tables, toutes créées via migrations SQL versionnées (`0001` à `0006`) :

```
PROJECT_SETTINGS

PROFILES
  │
GROUPS ──┬── GROUP_MEMBERS
         ├── GROUP_TASKS ── TASK_COMMENTS
         │              └── TASK_ATTACHMENTS
         ├── GROUP_DEPENDENCIES (groupe → groupe)
         ├── DOCUMENTS
         ├── MEASUREMENTS        (isolée, aucune UI)
         ├── TESTS               (erreurs calculées en base, generated columns)
         ├── CALCULATIONS        (group_id nullable — calcul "libre" possible)
         ├── VALIDATIONS
         ├── GROUP_MESSAGES
         └── ANNOUNCEMENTS       (group_id nullable — annonce globale possible)

ACTIVITY_LOGS   (référence groupe + acteur + entité, log générique)
NOTIFICATIONS   (par destinataire, aucune UI)
```

Relations, UUID, timestamps, `created_by`/`updated_at`, index sur toutes les FK fréquemment filtrées (`group_id`, `status`) : présents partout. `tests.absolute_error` et `tests.relative_error_pct` sont des **colonnes générées** (`generated always as ... stored`) — le calcul d'erreur est donc garanti cohérent, jamais désynchronisable par un bug frontend.

---

## 5. Sécurité

**RLS** : activé sur les 17 tables sans exception (vérifié par grep, pas supposé). 45 policies au total. Pattern cohérent : fonctions `security definer` (`is_admin`, `is_admin_or_teacher`, `is_group_member`, `is_group_leader`) pour éviter la récursion RLS classique sur les lookups d'appartenance — bonne pratique.

**Storage** : bucket `documents` privé, policies scoped par `(storage.foldername(name))[1]::uuid` = `group_id`. Un membre du groupe A ne peut ni lire ni écrire dans le dossier du groupe B — vérifié dans `0005_storage_documents.sql`.

**Auth** : login/signup fonctionnels, profil auto-créé via trigger `on_auth_user_created` (contourne proprement le problème de timing RLS/confirmation email). **Absence de flux de récupération de mot de passe** — un utilisateur qui oublie son mot de passe n'a aucun moyen de le réinitialiser depuis l'app.

**Aucune policy trop permissive détectée** (pas de `using (true)` sans condition trouvé). Aucune confiance exclusive au frontend pour les permissions — chaque action sensible (création groupe, validation, suppression) est protégée en RLS, pas seulement par un bouton caché.

---

## 6. Frontend — qualité du code

- Pas de duplication de logique métier significative entre composants.
- 2 écrans interrogent Supabase directement sans passer par un service dédié (`DashboardPage`, `GroupOverviewTab`) — inconsistant avec le reste du projet qui respecte strictement la séparation service/UI.
- Gestion d'erreur : **corrigée en Phase 1** (juste avant cet audit) sur 8 écrans qui chargeaient des données sans jamais gérer l'échec réseau/RLS. À vérifier que ce patch est bien resté cohérent partout après le audit.
- Formulaires : validation basique (champs requis), protection anti double-soumission présente (boutons `disabled` pendant `saving`) sur les formulaires examinés.

---

## 7. UX/UI

- Design cohérent (palette bleu nuit/gris définie dans `tailwind.config.js`, respectée partout).
- Mobile-first réel : bottom nav + sidebar desktop conditionnelle, formulaires en modales plein-écran sur mobile.
- Pas de composant de recherche globale.
- Pas d'indicateur visuel pour les tâches en retard malgré la donnée disponible (`due_date`).
- Accessibilité : aucun `aria-label` trouvé sur les boutons icône-seul (ex. boutons d'action dans les cartes de groupe) — geste non testé mais probable lacune pour lecteurs d'écran.

---

## 8. Performance

- `.limit(100)` sur les tests globaux, `.limit(200)` sur les messages — bornage correct, pas de requête non bornée trouvée.
- Pas de pagination réelle (pas de "charger plus") au-delà de ces limites fixes.
- Aucune subscription Realtime active nulle part (seul `onAuthStateChange` est un listener, ce n'est pas du Realtime de données) — donc pas de risque de subscriptions oubliées, mais aussi aucune mise à jour live.
- Bundle : `recharts` (dépendance graphique assez lourde) et `clsx` chargés mais jamais utilisés — poids mort au build.

---

## 9. Mobile (PWA + Capacitor)

- Manifest PWA complet (icônes 192/512/maskable/favicon générées et présentes sur disque, pas juste référencées).
- `capacitor.config.ts` correctement configuré (`webDir: dist`, `androidScheme: https`).
- Pipeline CI GitHub Actions fonctionnel de bout en bout (confirmé par échanges précédents : build → APK généré avec succès).
- Pas de configuration de splash screen Capacitor trouvée.

---

## 10. Bugs

**CRITICAL** : aucun trouvé (pas de faille RLS ouverte, pas de crash reproductible identifié dans le code).

**HIGH** :
- Formulaire de création de tâche n'expose ni priorité, ni échéance, ni responsable (détaillé section 3).
- Pas de récupération de mot de passe — un utilisateur bloqué reste bloqué.

**MEDIUM** :
- `DashboardPage` et `GroupOverviewTab` contournent la couche service (accès Supabase direct).
- Table `measurements` entièrement inutilisée côté frontend alors que `RLS` et schéma existent — soit la brancher, soit la retirer du schéma pour éviter la confusion avec `tests`.

**LOW** :
- Dépendances `recharts`/`clsx` mortes.
- Pas de vue frontend pour `activity_logs` (données écrites, jamais affichées à l'utilisateur).
- Pas de `aria-label` sur boutons icône-seul.

---

## 11. Dette technique (par importance)

1. Notifications : table + RLS prêtes, zéro UI (cloche, compteur, génération) → dette la plus visible pour l'utilisateur final.
2. Dépendances entre groupes : table + RLS prêtes, zéro UI.
3. Absence de Realtime sur la discussion de groupe : fonctionne par rechargement/reconnexion, pas de mise à jour live entre deux membres connectés simultanément.
4. Formulaire de tâche incomplet (voir Bugs HIGH).
5. Deux écrans hors du pattern service/UI.

---

## 12. Fonctionnalités manquantes

**MUST HAVE** :
- Formulaire de tâche complet (priorité, échéance, responsable).
- Récupération de mot de passe.
- Notifications (au moins la cloche + compteur non lus).

**SHOULD HAVE** :
- Recherche globale.
- Realtime sur la discussion de groupe.
- Vue/gestion des dépendances entre groupes.
- Indicateur "tâches en retard" sur le dashboard et le Kanban.

**NICE TO HAVE** :
- Graphiques Recharts sur le dashboard (la dépendance est déjà installée, jamais utilisée).
- Export CSV des tests.
- Calculateurs additionnels (puissance, tension/courant, engrenages).
- Vue frontend de `activity_logs`.
- Suppression ou branchement de la table `measurements`.

---

## 13. Roadmap recommandée

1. **Stabilisation** : brancher `DashboardPage`/`GroupOverviewTab` sur des services dédiés ; retirer `recharts`/`clsx` si non utilisés à court terme (ou les utiliser tout de suite pour le dashboard).
2. **Tâches complètes** : formulaire priorité/échéance/responsable + indicateur retard.
3. **Notifications** : UI cloche + compteur, génération sur les événements déjà loggés dans `activity_logs`.
4. **Auth** : récupération de mot de passe.
5. **Dashboard graphique** : utiliser Recharts pour la progression par groupe (barres), au lieu du texte actuel.
6. **Dépendances entre groupes** : UI admin (déjà prévue dans le schéma).
7. **Realtime discussion** : remplacer le polling par une subscription Supabase Realtime sur `group_messages`.
8. **Recherche globale**.
9. **Mesures** : décider — brancher une UI dédiée (distincte des tests) ou supprimer la table.
