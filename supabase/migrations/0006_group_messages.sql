-- ============================================================
-- PROJECT WORKSPACE — Migration 0006 : messages de groupe
-- Discussion par groupe. Le frontend met en file d'attente les
-- messages envoyés hors-ligne (stockage local) et les synchronise
-- ici dès que la connexion revient — la table reste la source de
-- vérité côté serveur, la queue locale ne sert qu'à survivre à une
-- coupure réseau.
-- ============================================================

create table group_messages (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id) on delete cascade,
  author_id uuid references profiles(id) on delete set null,
  content text not null,
  client_id text,              -- id généré côté client pour éviter les doublons à la sync
  created_at timestamptz not null default now()
);
create index idx_group_messages_group on group_messages(group_id, created_at);
create unique index idx_group_messages_client_id on group_messages(group_id, client_id) where client_id is not null;

alter table group_messages enable row level security;

create policy "messages_select_visible_group"
  on group_messages for select using (
    is_admin_or_teacher(auth.uid()) or is_group_member(auth.uid(), group_id)
  );

create policy "messages_insert_member"
  on group_messages for insert with check (
    author_id = auth.uid()
    and (is_admin_or_teacher(auth.uid()) or is_group_member(auth.uid(), group_id))
  );
