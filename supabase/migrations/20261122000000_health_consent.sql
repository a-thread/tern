-- Explicit consent to keep health data on the server (GDPR Art. 9, Washington's My Health My
-- Data Act). One row per account: the policy version agreed to and when, which is the record
-- that consent was given. The app asks again when its policy version moves past this one.
-- Withdrawing deletes the row; deleting the account removes it with everything else.

create table tern.health_consents (
  user_id        uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  policy_version text not null check (char_length(policy_version) between 1 and 20),
  consented_at   timestamptz not null default now()
);

alter table tern.health_consents enable row level security;

-- Not gated on Plus: consent is asked before Plus is synced.
create policy "own consent" on tern.health_consents for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
