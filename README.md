# Project Workspace

Plateforme collaborative pour gérer un projet technique réparti en groupes de travail. **Le nombre de groupes est entièrement dynamique** — aucun groupe n'est codé en dur nulle part dans l'application (frontend, base de données, routes).

## ✅ Ce qui est fait à cette étape

**Architecture**
- Scaffold Vite + React + TypeScript + Tailwind (PWA activée via `vite-plugin-pwa`)
- Structure `src/features/*` modulaire (auth, groups, tasks, dashboard, tests, documents, profile, admin)

**Base de données (`supabase/migrations/`)**
- `0001_init_schema.sql` — 16 tables (profiles, groups, group_members, group_dependencies, group_tasks, task_comments, task_attachments, documents, measurements, tests, calculations, validations, announcements, activity_logs, notifications, project_settings)
- `0002_views_and_functions.sql` — vues `group_progress` et `project_dashboard_stats` (tout est calculé par requête, jamais stocké en dur), fonction `log_activity()`
- `0003_rls_policies.sql` — RLS complet : ADMIN / TEACHER / GROUP_LEADER / MEMBER / VIEWER, appliqué réellement côté PostgreSQL (pas seulement côté UI)

**Authentification**
- `AuthContext` (Supabase Auth), page de connexion, route protégée

**Gestion dynamique des groupes**
- `groupsService.ts` : create / update / archive / restore / delete / gestion des membres — 100% piloté par la base
- `AdminGroupsPage` (`/admin/groups`) : création, édition, archivage, restauration, suppression
- `GroupWorkspacePage` (`/groups/:groupId`) : **une seule route dynamique** dessert tous les groupes, quel que soit leur nombre

**Tâches**
- Kanban complet (À faire / En cours / En test / Terminé / Validé) par groupe, générique

**Dashboard**
- 100% dynamique : chaque chiffre vient de `project_dashboard_stats` (`COUNT(*)` SQL), jamais écrit en dur

**Placeholders prêts à connecter** (structure DB déjà en place)
- Documents, Tests & mesures (vues globales), Calculateurs, Validations, Dépendances entre groupes, Notifications, Rapports

## 🔜 Prochaines étapes suggérées

1. Module Documents (upload/preview via Supabase Storage)
2. Module Mesures/Tests avec graphiques (recharts déjà inclus)
3. Calculateur transmission mécanique (formulaire pédagogique)
4. Système de validation (soumission → revue enseignant)
5. Dépendances entre groupes (page admin dédiée)
6. Import du PDF officiel une fois l'infrastructure validée

## 🚀 Lancer le projet

Ce projet a été généré côté serveur (l'utilisateur travaille depuis mobile). Pour le lancer :

### 1. Créer le projet Supabase
- Aller sur https://supabase.com, créer un projet
- Dans **SQL Editor**, exécuter dans l'ordre :
  1. `supabase/migrations/0001_init_schema.sql`
  2. `supabase/migrations/0002_views_and_functions.sql`
  3. `supabase/migrations/0003_rls_policies.sql`

### 2. Configurer les variables d'environnement
Copier `.env.example` vers `.env` et renseigner :
```
VITE_SUPABASE_URL=https://VOTRE-PROJET.supabase.co
VITE_SUPABASE_ANON_KEY=...
```
(disponibles dans Supabase → Project Settings → API)

### 3. Déployer via GitHub + Vercel (adapté à un usage 100% mobile)
- Créer un dépôt GitHub, y pousser ce dossier
- Sur Vercel : "Import Project" → sélectionner le dépôt
- Ajouter les mêmes variables d'environnement dans Vercel → Settings → Environment Variables
- Vercel build automatiquement à chaque push (via GitHub, pas besoin de terminal)

### 4. Créer le premier compte ADMIN
- S'inscrire via l'app (elle crée un profil avec le rôle `MEMBER` par défaut)
- Dans Supabase → Table Editor → `profiles`, changer manuellement `global_role` en `ADMIN` pour ce compte
- Se reconnecter : le menu Administration apparaît

### 5. Créer les groupes
- Aller dans Administration → Groupes → Créer un groupe
- Répéter autant de fois que nécessaire (aucune limite codée)

## 📱 Générer l'APK (PWA → Capacitor)

Le projet est déjà configuré avec `vite-plugin-pwa` (manifest + service worker) et Capacitor (`capacitor.config.ts`, `@capacitor/core`, `@capacitor/android`).

### Option A — build automatique via GitHub Actions (recommandé depuis Termux)
Le workflow `.github/workflows/build-apk.yml` compile l'APK à chaque push sur `main`.

1. Dans le dépôt GitHub → **Settings → Secrets and variables → Actions**, ajouter :
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
2. Depuis Termux :
   ```
   git add .
   git commit -m "ajout config Capacitor + workflow APK"
   git push
   ```
3. Sur GitHub → onglet **Actions**, attendre la fin du run `Build APK`.
4. Télécharger l'artifact `project-workspace-debug-apk` → c'est ton `.apk` à installer.

Ce premier run va générer automatiquement le dossier natif `android/` (via `cap add android`) — pense à le récupérer (`git pull`) si tu veux aussi builder en local ensuite.

### Option B — build local dans Termux (si SDK Android installé)
```
npm install
npm run build
npx cap add android      # une seule fois
npx cap sync android
cd android
./gradlew assembleDebug
```
L'APK sort dans `android/app/build/outputs/apk/debug/app-debug.apk`.

### Icônes de l'app
`vite-plugin-pwa` référence `icon-192.png` et `icon-512.png` dans `public/` (à ajouter — pas encore présents dans ce scaffold). Sans eux, le build passe quand même mais l'icône de l'app sera celle par défaut de Capacitor.
