create index if not exists "control_room_issues_status_idx" on "public"."control_room_issues" ("status");
create index if not exists "control_room_issues_severity_idx" on "public"."control_room_issues" ("severity");
create index if not exists "control_room_issues_last_seen_idx" on "public"."control_room_issues" ("last_seen_at" desc);
create index if not exists "control_room_issues_source_idx" on "public"."control_room_issues" ("source");
