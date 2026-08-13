-- ============================================================
-- PROJECT WORKSPACE — Migration 0002 : vues dynamiques
-- Aucune valeur (nombre de groupes, progression, %) n'est
-- jamais stockée en dur : tout est recalculé depuis les données.
-- ============================================================

-- ------------------------------------------------------------
-- Progression par groupe (basée sur les tâches réellement terminées)
-- ------------------------------------------------------------
create or replace view group_progress as
select
  g.id as group_id,
  g.name,
  g.code,
  g.status,
  count(t.id) as total_tasks,
  count(t.id) filter (where t.status in ('DONE','VALIDATED')) as completed_tasks,
  case when count(t.id) = 0 then 0
       else round(100.0 * count(t.id) filter (where t.status in ('DONE','VALIDATED')) / count(t.id), 1)
  end as progress_percent
from groups g
left join group_tasks t on t.group_id = g.id
group by g.id, g.name, g.code, g.status;

-- ------------------------------------------------------------
-- Statistiques globales du projet (dashboard)
-- Le nombre de groupes n'est JAMAIS codé en dur : COUNT(*) uniquement.
-- ------------------------------------------------------------
create or replace view project_dashboard_stats as
select
  (select count(*) from groups where status = 'ACTIVE') as active_groups,
  (select count(*) from groups where status = 'ARCHIVED') as archived_groups,
  (select count(*) from groups) as total_groups,
  (select count(*) from group_members) as total_memberships,
  (select count(distinct user_id) from group_members) as total_participants,
  (select count(*) from group_tasks) as total_tasks,
  (select count(*) from group_tasks where status in ('DONE','VALIDATED')) as completed_tasks,
  (select count(*) from group_tasks where status = 'IN_PROGRESS') as in_progress_tasks,
  (select count(*) from group_tasks where status = 'TODO') as todo_tasks,
  (select count(*) from tests) as total_tests,
  (select count(*) from documents) as total_documents,
  (select count(*) from validations where status in ('SUBMITTED','UNDER_REVIEW')) as pending_validations,
  case
    when (select count(*) from group_tasks) = 0 then 0
    else round(100.0 * (select count(*) from group_tasks where status in ('DONE','VALIDATED'))
               / (select count(*) from group_tasks), 1)
  end as global_progress_percent;

-- ------------------------------------------------------------
-- Fonction : journaliser une action (utilisée par le frontend
-- via rpc, ou par des triggers applicatifs futurs)
-- ------------------------------------------------------------
create or replace function log_activity(
  p_group_id uuid,
  p_action text,
  p_entity_type text,
  p_entity_id uuid,
  p_metadata jsonb default '{}'
) returns uuid
language plpgsql security definer as $$
declare
  v_id uuid;
begin
  insert into activity_logs (group_id, actor_id, action, entity_type, entity_id, metadata)
  values (p_group_id, auth.uid(), p_action, p_entity_type, p_entity_id, p_metadata)
  returning id into v_id;
  return v_id;
end;
$$;
