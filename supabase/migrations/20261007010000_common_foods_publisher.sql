-- Lets scripts/publishCommonFoods.ts write the common-foods list. It connects
-- with the service role, which bypasses row-level security but still needs
-- privileges on the tern schema and these two tables. Signed-in users stay
-- read-only (20261007000000_common_foods.sql).

grant usage on schema tern to service_role;

grant select, insert, update, delete on tern.common_foods to service_role;
grant select, insert, update, delete on tern.common_foods_meta to service_role;
