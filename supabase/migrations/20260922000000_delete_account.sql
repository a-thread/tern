-- Lets a signed-in person delete their own account. Every tern.* table
-- references auth.users on delete cascade, so removing the login also erases
-- the food log, saved meals, weigh-ins, waypoints, rest days and settings.
--
-- security definer: the caller (role "authenticated") cannot delete from
-- auth.users itself, and the function only ever touches the caller's own row.

create or replace function tern.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function tern.delete_my_account() from public, anon;
grant execute on function tern.delete_my_account() to authenticated;
