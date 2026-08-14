-- ============================================================
-- PROJECT WORKSPACE — Migration 0004 : création automatique du profil
-- Quand un utilisateur s'inscrit (auth.users), on crée sa ligne
-- dans public.profiles automatiquement, côté serveur (security
-- definer = bypass RLS). Évite les soucis de timing avec la
-- confirmation email (auth.uid() pas encore disponible côté client
-- juste après signUp si la confirmation email est activée).
-- ============================================================

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, global_role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.email,
    'MEMBER'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Le insert manuel de profil côté client n'est donc plus nécessaire
-- (mais la policy "profiles_insert_self" reste utile si jamais un
-- profil doit être recréé manuellement).
