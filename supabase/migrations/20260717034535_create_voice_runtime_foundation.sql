begin;

-- Shared voice runtime telemetry foundation.
--
-- Privacy boundary:
--   * server-owned writes only;
--   * permanent authenticated owners may read their own telemetry;
--   * owners may delete a top-level session, cascading its telemetry;
--   * no raw audio, transcript text, prompts, replies, or private message content;
--   * no Storage bucket is created in this phase.

create table if not exists public.voice_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_session_id text null
    check (client_session_id is null or char_length(client_session_id) between 8 and 128),
  companion_id text not null
    check (companion_id in ('raylene', 'rylane', 'cloud', 'night', 'sekret')),
  surface text not null
    check (surface in ('voice_bip', 'circle_voice', 'bridge_rehearsal')),
  status text not null default 'active'
    check (status in ('active', 'completed', 'aborted', 'failed')),
  transport text not null default 'unknown'
    check (transport in ('unknown', 'http', 'websocket', 'realtime')),
  region text null check (region is null or char_length(region) between 2 and 64),
  started_at timestamptz not null default now(),
  ended_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint voice_sessions_time_order check (ended_at is null or ended_at >= started_at),
  constraint voice_sessions_client_id_unique unique (user_id, client_session_id)
);

comment on table public.voice_sessions is
  'Server-written lifecycle metadata for shared voice runtime sessions. Contains no raw audio, transcript text, prompts, replies, or private message content.';
comment on column public.voice_sessions.client_session_id is
  'Optional client idempotency/reconnect key. It must not contain an email, Bip ID, transcript, or other private content.';

create table if not exists public.voice_turns (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.voice_sessions(id) on delete cascade,
  turn_index integer not null check (turn_index >= 0),
  speaker text not null check (speaker in ('user', 'assistant', 'system')),
  end_reason text null
    check (end_reason is null or end_reason in ('silence', 'barge_in', 'cancelled', 'completed', 'error', 'disconnect')),
  language text null check (language is null or char_length(language) between 2 and 20),
  transcript_chars integer not null default 0 check (transcript_chars >= 0),
  audio_duration_ms integer null check (audio_duration_ms is null or audio_duration_ms between 0 and 3600000),
  started_at timestamptz not null default now(),
  ended_at timestamptz null,
  created_at timestamptz not null default now(),
  constraint voice_turns_time_order check (ended_at is null or ended_at >= started_at),
  constraint voice_turns_session_index_unique unique (session_id, turn_index),
  constraint voice_turns_id_session_unique unique (id, session_id)
);

comment on table public.voice_turns is
  'Per-turn timing and coarse metadata only. Transcript text and audio bytes are deliberately absent.';
comment on column public.voice_turns.transcript_chars is
  'Character count only; not transcript content.';

create table if not exists public.voice_events (
  id bigint generated always as identity primary key,
  session_id uuid not null references public.voice_sessions(id) on delete cascade,
  turn_id uuid null,
  event_type text not null check (
    event_type in (
      'session_started',
      'session_resumed',
      'speech_start',
      'speech_end',
      'barge_in',
      'stt_partial',
      'stt_final',
      'assistant_first_token',
      'tts_first_byte',
      'playback_started',
      'playback_stopped',
      'turn_cancelled',
      'network_degraded',
      'session_completed',
      'session_failed'
    )
  ),
  payload jsonb not null default '{}'::jsonb,
  client_ts timestamptz null,
  server_ts timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint voice_events_turn_session_fk
    foreign key (turn_id, session_id)
    references public.voice_turns(id, session_id)
    on delete cascade,
  constraint voice_events_payload_object
    check (jsonb_typeof(payload) = 'object'),
  constraint voice_events_payload_size
    check (octet_length(payload::text) <= 4096),
  constraint voice_events_metadata_only
    check (
      payload::text !~* '"(audio|audio_base64|audio_url|transcript|text|content|message|prompt|response)"[[:space:]]*:'
    )
);

comment on table public.voice_events is
  'High-level server-written voice events. Payload is bounded metadata and rejects obvious raw-content keys, including nested keys.';

create table if not exists public.voice_latency_metrics (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.voice_sessions(id) on delete cascade,
  turn_id uuid not null,
  vad_open_ms integer null check (vad_open_ms is null or vad_open_ms between 0 and 600000),
  stt_first_token_ms integer null check (stt_first_token_ms is null or stt_first_token_ms between 0 and 600000),
  llm_first_token_ms integer null check (llm_first_token_ms is null or llm_first_token_ms between 0 and 600000),
  tts_first_byte_ms integer null check (tts_first_byte_ms is null or tts_first_byte_ms between 0 and 600000),
  playback_start_ms integer null check (playback_start_ms is null or playback_start_ms between 0 and 600000),
  total_ms integer null check (total_ms is null or total_ms between 0 and 600000),
  created_at timestamptz not null default now(),
  constraint voice_latency_turn_session_fk
    foreign key (turn_id, session_id)
    references public.voice_turns(id, session_id)
    on delete cascade,
  constraint voice_latency_one_row_per_turn unique (turn_id),
  constraint voice_latency_has_measurement check (
    num_nonnulls(
      vad_open_ms,
      stt_first_token_ms,
      llm_first_token_ms,
      tts_first_byte_ms,
      playback_start_ms,
      total_ms
    ) > 0
  )
);

comment on table public.voice_latency_metrics is
  'Server-written latency slices for one finalized voice turn. Contains timing numbers only.';

create index if not exists voice_sessions_user_started_idx
  on public.voice_sessions (user_id, started_at desc);
create index if not exists voice_sessions_status_started_idx
  on public.voice_sessions (status, started_at desc);
create index if not exists voice_turns_session_index_idx
  on public.voice_turns (session_id, turn_index);
create index if not exists voice_events_session_server_ts_idx
  on public.voice_events (session_id, server_ts);
create index if not exists voice_events_type_server_ts_idx
  on public.voice_events (event_type, server_ts desc);
create index if not exists voice_latency_session_created_idx
  on public.voice_latency_metrics (session_id, created_at desc);

alter table public.voice_sessions enable row level security;
alter table public.voice_turns enable row level security;
alter table public.voice_events enable row level security;
alter table public.voice_latency_metrics enable row level security;

-- New Supabase tables are not assumed to be Data API exposed. Grants are explicit.
revoke all on table public.voice_sessions from public, anon, authenticated;
revoke all on table public.voice_turns from public, anon, authenticated;
revoke all on table public.voice_events from public, anon, authenticated;
revoke all on table public.voice_latency_metrics from public, anon, authenticated;
revoke all on sequence public.voice_events_id_seq from public, anon, authenticated;

-- Owners can inspect their metadata and delete a complete session tree.
grant select, delete on table public.voice_sessions to authenticated;
grant select on table public.voice_turns to authenticated;
grant select on table public.voice_events to authenticated;
grant select on table public.voice_latency_metrics to authenticated;

-- The authenticated relay/Worker writes with service_role, never with a public client key.
grant select, insert, update, delete on table public.voice_sessions to service_role;
grant select, insert, update, delete on table public.voice_turns to service_role;
grant select, insert, update, delete on table public.voice_events to service_role;
grant select, insert, update, delete on table public.voice_latency_metrics to service_role;
grant usage, select on sequence public.voice_events_id_seq to service_role;

drop policy if exists "voice_sessions_select_own" on public.voice_sessions;
create policy "voice_sessions_select_own"
  on public.voice_sessions
  for select
  to authenticated
  using (
    public.is_non_anonymous_user()
    and (select auth.uid()) = user_id
  );

drop policy if exists "voice_sessions_delete_own" on public.voice_sessions;
create policy "voice_sessions_delete_own"
  on public.voice_sessions
  for delete
  to authenticated
  using (
    public.is_non_anonymous_user()
    and (select auth.uid()) = user_id
  );

drop policy if exists "voice_turns_select_own" on public.voice_turns;
create policy "voice_turns_select_own"
  on public.voice_turns
  for select
  to authenticated
  using (
    public.is_non_anonymous_user()
    and exists (
      select 1
      from public.voice_sessions session_owner
      where session_owner.id = voice_turns.session_id
        and session_owner.user_id = (select auth.uid())
    )
  );

drop policy if exists "voice_events_select_own" on public.voice_events;
create policy "voice_events_select_own"
  on public.voice_events
  for select
  to authenticated
  using (
    public.is_non_anonymous_user()
    and exists (
      select 1
      from public.voice_sessions session_owner
      where session_owner.id = voice_events.session_id
        and session_owner.user_id = (select auth.uid())
    )
  );

drop policy if exists "voice_latency_metrics_select_own" on public.voice_latency_metrics;
create policy "voice_latency_metrics_select_own"
  on public.voice_latency_metrics
  for select
  to authenticated
  using (
    public.is_non_anonymous_user()
    and exists (
      select 1
      from public.voice_sessions session_owner
      where session_owner.id = voice_latency_metrics.session_id
        and session_owner.user_id = (select auth.uid())
    )
  );

commit;
