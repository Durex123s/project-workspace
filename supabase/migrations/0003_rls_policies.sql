-- ============================================================
-- PROJECT WORKSPACE — Migration 0003 : Row Level Security
-- Les permissions sont appliquées côté base de données, jamais
-- uniquement côté frontend.
-- ============================================================

alter table profiles enable row level security;
alter table project_settings enable row level security;
alter table groups enable row level security;
alter table group_members enable row level security;
alter table group_dependencies enable row level security;
alter table group_tasks enable row level security;
alter table task_comments enable row level security;
alter table task_attachments enable row level security;
alter table documents enable row level security;
alter table measurements enable row level security;
alter table tests enable row level security;
alter table calculations enable row level security;
alter table validations enable row level security;
alter table announcements enable row level security;
alter table activity_logs enable row level security;
alter table notifications enable row level security;

-- ------------------------------------------------------------
-- Fonctions utilitaires (security definer pour éviter la
-- récursion RLS lors des lookups de rôle/appartenance)
-- ------------------------------------------------------------
create or replace function is_admin_or_teacher(uid uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from profiles p
    where p.id = uid and p.global_role in ('ADMIN','TEACHER')
  );
$$;

create or replace function is_admin(uid uuid)
returns boolean language sql security definer stable as $$
  select exists (select 1 from profiles p where p.id = uid and p.global_role = 'ADMIN');
$$;

create or replace function is_group_member(uid uuid, gid uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from group_members gm where gm.group_id = gid and gm.user_id = uid
  );
$$;

create or replace function is_group_leader(uid uuid, gid uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from group_members gm
    where gm.group_id = gid and gm.user_id = uid and gm.role_in_group = 'LEADER'
  ) or exists (
    select 1 from groups g where g.id = gid and g.leader_id = uid
  );
$$;

-- ------------------------------------------------------------
-- PROFILES
-- ------------------------------------------------------------
create policy "profiles_select_all_authenticated"
  on profiles for select using (auth.uid() is not null);

create policy "profiles_update_self_or_admin"
  on profiles for update using (auth.uid() = id or is_admin(auth.uid()));

create policy "profiles_insert_self"
  on profiles for insert with check (auth.uid() = id);

-- ------------------------------------------------------------
-- PROJECT SETTINGS
-- ------------------------------------------------------------
create policy "settings_select_all" on project_settings for select using (auth.uid() is not null);
create policy "settings_write_admin" on project_settings for all
  using (is_admin(auth.uid())) with check (is_admin(auth.uid()));

-- ------------------------------------------------------------
-- GROUPS
-- Lecture : membre du groupe OU admin/teacher (vue globale)
-- Création/modification/suppression : admin (+ teacher pour modif)
-- ------------------------------------------------------------
create policy "groups_select_member_or_staff"
  on groups for select using (
    is_admin_or_teacher(auth.uid()) or is_group_member(auth.uid(), id)
  );

create policy "groups_insert_admin"
  on groups for insert with check (is_admin(auth.uid()));

create policy "groups_update_admin_or_leader"
  on groups for update using (
    is_admin(auth.uid()) or is_group_leader(auth.uid(), id)
  );

create policy "groups_delete_admin"
  on groups for delete using (is_admin(auth.uid()));

-- ------------------------------------------------------------
-- GROUP_MEMBERS
-- ------------------------------------------------------------
create policy "members_select_visible_group"
  on group_members for select using (
    is_admin_or_teacher(auth.uid()) or is_group_member(auth.uid(), group_id)
  );

create policy "members_write_admin_or_leader"
  on group_members for all using (
    is_admin(auth.uid()) or is_group_leader(auth.uid(), group_id)
  ) with check (
    is_admin(auth.uid()) or is_group_leader(auth.uid(), group_id)
  );

-- ------------------------------------------------------------
-- GROUP_DEPENDENCIES — configurables uniquement par l'admin
-- ------------------------------------------------------------
create policy "deps_select_all_authenticated"
  on group_dependencies for select using (auth.uid() is not null);

create policy "deps_write_admin"
  on group_dependencies for all using (is_admin(auth.uid())) with check (is_admin(auth.uid()));

-- ------------------------------------------------------------
-- GROUP_TASKS
-- ------------------------------------------------------------
create policy "tasks_select_visible_group"
  on group_tasks for select using (
    is_admin_or_teacher(auth.uid()) or is_group_member(auth.uid(), group_id)
  );

create policy "tasks_insert_member"
  on group_tasks for insert with check (
    is_admin_or_teacher(auth.uid()) or is_group_member(auth.uid(), group_id)
  );

create policy "tasks_update_member"
  on group_tasks for update using (
    is_admin_or_teacher(auth.uid()) or is_group_member(auth.uid(), group_id)
  );

create policy "tasks_delete_leader_or_staff"
  on group_tasks for delete using (
    is_admin_or_teacher(auth.uid()) or is_group_leader(auth.uid(), group_id)
  );

-- ------------------------------------------------------------
-- TASK_COMMENTS
-- ------------------------------------------------------------
create policy "comments_select_visible_task"
  on task_comments for select using (
    exists (
      select 1 from group_tasks t
      where t.id = task_id
        and (is_admin_or_teacher(auth.uid()) or is_group_member(auth.uid(), t.group_id))
    )
  );

create policy "comments_insert_member"
  on task_comments for insert with check (
    exists (
      select 1 from group_tasks t
      where t.id = task_id
        and (is_admin_or_teacher(auth.uid()) or is_group_member(auth.uid(), t.group_id))
    )
  );

-- ------------------------------------------------------------
-- TASK_ATTACHMENTS / DOCUMENTS / MEASUREMENTS / TESTS
-- Même pattern : lecture/écriture réservée aux membres du groupe
-- concerné (via le group_id, direct ou via la tâche), + staff.
-- ------------------------------------------------------------
create policy "attachments_select" on task_attachments for select using (
  exists (select 1 from group_tasks t where t.id = task_id
    and (is_admin_or_teacher(auth.uid()) or is_group_member(auth.uid(), t.group_id)))
);
create policy "attachments_insert" on task_attachments for insert with check (
  exists (select 1 from group_tasks t where t.id = task_id
    and (is_admin_or_teacher(auth.uid()) or is_group_member(auth.uid(), t.group_id)))
);

create policy "documents_select" on documents for select using (
  is_admin_or_teacher(auth.uid()) or is_group_member(auth.uid(), group_id)
);
create policy "documents_insert" on documents for insert with check (
  is_admin_or_teacher(auth.uid()) or is_group_member(auth.uid(), group_id)
);
create policy "documents_delete" on documents for delete using (
  is_admin_or_teacher(auth.uid()) or is_group_leader(auth.uid(), group_id)
);

create policy "measurements_select" on measurements for select using (
  is_admin_or_teacher(auth.uid()) or is_group_member(auth.uid(), group_id)
);
create policy "measurements_write" on measurements for all using (
  is_admin_or_teacher(auth.uid()) or is_group_member(auth.uid(), group_id)
) with check (
  is_admin_or_teacher(auth.uid()) or is_group_member(auth.uid(), group_id)
);

create policy "tests_select" on tests for select using (
  is_admin_or_teacher(auth.uid()) or is_group_member(auth.uid(), group_id)
);
create policy "tests_write" on tests for all using (
  is_admin_or_teacher(auth.uid()) or is_group_member(auth.uid(), group_id)
) with check (
  is_admin_or_teacher(auth.uid()) or is_group_member(auth.uid(), group_id)
);

-- ------------------------------------------------------------
-- CALCULATIONS — libres (group_id nullable) ou liées à un groupe
-- ------------------------------------------------------------
create policy "calculations_select" on calculations for select using (
  group_id is null or is_admin_or_teacher(auth.uid()) or is_group_member(auth.uid(), group_id)
);
create policy "calculations_insert" on calculations for insert with check (
  created_by = auth.uid()
  and (group_id is null or is_admin_or_teacher(auth.uid()) or is_group_member(auth.uid(), group_id))
);

-- ------------------------------------------------------------
-- VALIDATIONS
-- Soumission : membres du groupe. Revue/validation : staff uniquement.
-- ------------------------------------------------------------
create policy "validations_select" on validations for select using (
  is_admin_or_teacher(auth.uid()) or is_group_member(auth.uid(), group_id)
);
create policy "validations_insert_member"
  on validations for insert with check (
    is_group_member(auth.uid(), group_id) or is_admin_or_teacher(auth.uid())
  );
create policy "validations_update_staff_or_submitter"
  on validations for update using (
    is_admin_or_teacher(auth.uid()) or submitted_by = auth.uid()
  );

-- ------------------------------------------------------------
-- ANNOUNCEMENTS
-- ------------------------------------------------------------
create policy "announcements_select" on announcements for select using (
  group_id is null or is_admin_or_teacher(auth.uid()) or is_group_member(auth.uid(), group_id)
);
create policy "announcements_write_staff"
  on announcements for all using (is_admin_or_teacher(auth.uid()))
  with check (is_admin_or_teacher(auth.uid()));

-- ------------------------------------------------------------
-- ACTIVITY_LOGS — lecture seule pour les membres concernés
-- ------------------------------------------------------------
create policy "activity_select" on activity_logs for select using (
  group_id is null or is_admin_or_teacher(auth.uid()) or is_group_member(auth.uid(), group_id)
);
create policy "activity_insert_authenticated"
  on activity_logs for insert with check (auth.uid() is not null);

-- ------------------------------------------------------------
-- NOTIFICATIONS — chacun ne voit que les siennes
-- ------------------------------------------------------------
create policy "notifications_select_own"
  on notifications for select using (recipient_id = auth.uid());
create policy "notifications_update_own"
  on notifications for update using (recipient_id = auth.uid());
create policy "notifications_insert_system"
  on notifications for insert with check (auth.uid() is not null);
