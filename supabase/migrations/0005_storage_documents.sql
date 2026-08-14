-- ============================================================
-- PROJECT WORKSPACE — Migration 0005 : stockage des documents
-- Crée le bucket "documents" (privé) et ses policies RLS.
-- Convention de chemin : {group_id}/{nom_fichier}
-- ============================================================

insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

-- Lecture : membre du groupe concerné (dossier = group_id) ou staff
create policy "documents_storage_select"
  on storage.objects for select using (
    bucket_id = 'documents'
    and (
      is_admin_or_teacher(auth.uid())
      or is_group_member(auth.uid(), (storage.foldername(name))[1]::uuid)
    )
  );

-- Upload : membre du groupe concerné ou staff
create policy "documents_storage_insert"
  on storage.objects for insert with check (
    bucket_id = 'documents'
    and (
      is_admin_or_teacher(auth.uid())
      or is_group_member(auth.uid(), (storage.foldername(name))[1]::uuid)
    )
  );

-- Suppression : responsable du groupe ou staff
create policy "documents_storage_delete"
  on storage.objects for delete using (
    bucket_id = 'documents'
    and (
      is_admin_or_teacher(auth.uid())
      or is_group_leader(auth.uid(), (storage.foldername(name))[1]::uuid)
    )
  );
