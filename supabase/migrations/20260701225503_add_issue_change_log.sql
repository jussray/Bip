create table if not exists "public"."control_room_issue_history" (
  "id" uuid primary key default gen_random_uuid(),
  "issue_id" uuid not null references "public"."control_room_issues"("id") on delete cascade,
  "changed_by" uuid references "auth"."users"("id"),
  "field" text not null,
  "old_value" text,
  "new_value" text,
  "changed_at" timestamptz not null default now()
);
