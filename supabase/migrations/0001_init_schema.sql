-- ============================================================
-- PROJECT WORKSPACE — Migration 0001 : schéma initial
-- Architecture 100% dynamique : AUCUN groupe n'est codé en dur.
-- Le nombre de groupes est déterminé uniquement par le contenu
-- de la table `groups`.
-- ============================================================

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- ENUMS
-- ------------------------------------------------------------
create type user_role as enum ('ADMIN', 'TEACHER', 'GROUP_LEADER', 'MEMBER', 'VIEWER');
create type group_status as enum ('ACTIVE', 'ARCHIVED');
create type group_member_role as enum ('LEADER', 'MEMBER', 'VIEWER');
create type task_status as enum ('TODO', 'IN_PROGRESS', 'IN_TEST', 'DONE', 'VALIDATED');
create type task_priority as enum ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
create type validation_status as enum ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'VALIDATED', 'REJECTED', 'CORRECTION_REQUESTED');
create type document_category as enum ('PLAN', 'REPORT', 'PHOTO', 'VIDEO', 'CALCULATION', 'TEST', 'OTHER');
create type dependency_status as enum ('READY', 'PENDING', 'BLOCKED');

-- ------------------------------------------------------------
-- PROFILES (1 ligne par utilisateur, liée à auth.users)
-- ------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  avatar_url text,
  global_role user_role not null default 'MEMBER',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- PROJECT SETTINGS (paramètres généraux, projet renommable)
-- ------------------------------------------------------------
create table project_settings (
  id uuid primary key default gen_random_uuid(),
  project_name text not null default 'Project Workspace',
  project_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- GROUPS — table centrale, entièrement dynamique
-- L'UUID `id` est la clé primaire réelle. `code` est un simple
-- libellé affichable (ex: "7"), modifiable sans casser les relations.
-- ------------------------------------------------------------
create table groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text,                              -- numéro/code affiché, éditable librement
  theme text,
  description text,
  leader_id uuid references profiles(id) on delete set null,
  status group_status not null default 'ACTIVE',
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_groups_status on groups(status);

-- ------------------------------------------------------------
-- GROUP_MEMBERS — relation N-N users <-> groups
-- ------------------------------------------------------------
create table group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  role_in_group group_member_role not null default 'MEMBER',
  joined_at timestamptz not null default now(),
  unique (group_id, user_id)
);
create index idx_group_members_group on group_members(group_id);
create index idx_group_members_user on group_members(user_id);

-- ------------------------------------------------------------
-- GROUP_DEPENDENCIES — dépendances configurables entre groupes
-- ------------------------------------------------------------
create table group_dependencies (
  id uuid primary key default gen_random_uuid(),
  from_group_id uuid not null references groups(id) on delete cascade,
  to_group_id uuid not null references groups(id) on delete cascade,
  status dependency_status not null default 'PENDING',
  note text,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  check (from_group_id <> to_group_id)
);
create index idx_group_deps_from on group_dependencies(from_group_id);
create index idx_group_deps_to on group_dependencies(to_group_id);

-- ------------------------------------------------------------
-- GROUP_TASKS
-- ------------------------------------------------------------
create table group_tasks (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id) on delete cascade,
  title text not null,
  description text,
  assignee_id uuid references profiles(id) on delete set null,
  status task_status not null default 'TODO',
  priority task_priority not null default 'MEDIUM',
  start_date date,
  due_date date,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_tasks_group on group_tasks(group_id);
create index idx_tasks_status on group_tasks(status);
create index idx_tasks_assignee on group_tasks(assignee_id);

-- ------------------------------------------------------------
-- TASK_COMMENTS
-- ------------------------------------------------------------
create table task_comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references group_tasks(id) on delete cascade,
  author_id uuid references profiles(id) on delete set null,
  content text not null,
  created_at timestamptz not null default now()
);
create index idx_comments_task on task_comments(task_id);

-- ------------------------------------------------------------
-- TASK_ATTACHMENTS (référence vers Supabase Storage)
-- ------------------------------------------------------------
create table task_attachments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references group_tasks(id) on delete cascade,
  storage_path text not null,
  file_name text not null,
  uploaded_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index idx_attachments_task on task_attachments(task_id);

-- ------------------------------------------------------------
-- DOCUMENTS (espace documentaire par groupe)
-- ------------------------------------------------------------
create table documents (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id) on delete cascade,
  task_id uuid references group_tasks(id) on delete set null,
  category document_category not null default 'OTHER',
  storage_path text not null,
  file_name text not null,
  description text,
  uploaded_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index idx_documents_group on documents(group_id);
create index idx_documents_category on documents(category);

-- ------------------------------------------------------------
-- MEASUREMENTS
-- ------------------------------------------------------------
create table measurements (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id) on delete cascade,
  task_id uuid references group_tasks(id) on delete set null,
  label text not null,
  theoretical_value numeric,
  measured_value numeric,
  unit text,
  operator_id uuid references profiles(id) on delete set null,
  measured_at timestamptz not null default now(),
  comment text,
  created_at timestamptz not null default now()
);
create index idx_measurements_group on measurements(group_id);

-- ------------------------------------------------------------
-- TESTS
-- ------------------------------------------------------------
create table tests (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id) on delete cascade,
  task_id uuid references group_tasks(id) on delete set null,
  name text not null,
  objective text,
  theoretical_value numeric,
  measured_value numeric,
  unit text,
  -- erreurs calculées en base pour cohérence garantie
  absolute_error numeric generated always as (abs(coalesce(theoretical_value,0) - coalesce(measured_value,0))) stored,
  relative_error_pct numeric generated always as (
    case when coalesce(theoretical_value,0) = 0 then null
    else abs((theoretical_value - measured_value) / theoretical_value) * 100 end
  ) stored,
  result text,
  operator_id uuid references profiles(id) on delete set null,
  comment text,
  performed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index idx_tests_group on tests(group_id);

-- ------------------------------------------------------------
-- CALCULATIONS (résultats sauvegardés des calculateurs)
-- Les calculateurs eux-mêmes ne sont PAS liés en dur à un groupe.
-- ------------------------------------------------------------
create table calculations (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references groups(id) on delete cascade,   -- nullable : peut être un calcul libre
  calculator_key text not null,                            -- ex: 'mechanical_transmission'
  label text,
  inputs jsonb not null default '{}',
  outputs jsonb not null default '{}',
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index idx_calculations_group on calculations(group_id);
create index idx_calculations_key on calculations(calculator_key);

-- ------------------------------------------------------------
-- VALIDATIONS
-- ------------------------------------------------------------
create table validations (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id) on delete cascade,
  task_id uuid references group_tasks(id) on delete set null,
  status validation_status not null default 'DRAFT',
  submitted_by uuid references profiles(id) on delete set null,
  reviewed_by uuid references profiles(id) on delete set null,
  review_comment text,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
create index idx_validations_group on validations(group_id);
create index idx_validations_status on validations(status);

-- ------------------------------------------------------------
-- ANNOUNCEMENTS
-- ------------------------------------------------------------
create table announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  group_id uuid references groups(id) on delete cascade,  -- null = annonce globale
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index idx_announcements_group on announcements(group_id);

-- ------------------------------------------------------------
-- ACTIVITY_LOGS
-- ------------------------------------------------------------
create table activity_logs (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references groups(id) on delete set null,
  actor_id uuid references profiles(id) on delete set null,
  action text not null,          -- ex: 'task.completed', 'measurement.added'
  entity_type text,              -- ex: 'group_tasks'
  entity_id uuid,
  metadata jsonb default '{}',
  created_at timestamptz not null default now()
);
create index idx_activity_group on activity_logs(group_id);
create index idx_activity_created on activity_logs(created_at desc);

-- ------------------------------------------------------------
-- NOTIFICATIONS
-- ------------------------------------------------------------
create table notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references profiles(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  group_id uuid references groups(id) on delete cascade,
  entity_type text,
  entity_id uuid,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
create index idx_notifications_recipient on notifications(recipient_id, is_read);

-- ------------------------------------------------------------
-- Trigger générique : updated_at
-- ------------------------------------------------------------
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_updated_at before update on profiles for each row execute function set_updated_at();
create trigger trg_groups_updated_at before update on groups for each row execute function set_updated_at();
create trigger trg_tasks_updated_at before update on group_tasks for each row execute function set_updated_at();
create trigger trg_settings_updated_at before update on project_settings for each row execute function set_updated_at();
