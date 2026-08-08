create unique index if not exists "control_room_issues_fingerprint_idx" on "public"."control_room_issues" ("fingerprint") where "fingerprint" is not null;
