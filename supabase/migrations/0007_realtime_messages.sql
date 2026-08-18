-- ============================================================
-- PROJECT WORKSPACE — Migration 0007 : Realtime sur les messages
-- Ajoute group_messages à la publication Realtime de Supabase.
-- Les événements diffusés respectent toujours les policies RLS
-- déjà en place sur la table (un membre ne reçoit que les
-- messages des groupes auxquels il appartient).
-- ============================================================

alter publication supabase_realtime add table group_messages;
