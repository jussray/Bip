create index if not exists "crie_issue_id_idx" on "public"."control_room_issue_events" ("issue_id");
create index if not exists "crie_event_id_idx" on "public"."control_room_issue_events" ("event_id");
create index if not exists "crih_issue_id_idx" on "public"."control_room_issue_history" ("issue_id");
create index if not exists "crih_changed_at_idx" on "public"."control_room_issue_history" ("changed_at" desc);
