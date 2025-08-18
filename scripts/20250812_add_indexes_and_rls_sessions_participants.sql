-- Indexes and RLS for user_sessions and live_class_participants
-- Run in Supabase SQL editor or via migration runner

begin;

-- user_sessions indexes
create index if not exists idx_user_sessions_user_id on user_sessions(user_id);
create index if not exists idx_user_sessions_is_active on user_sessions(is_active);
create index if not exists idx_user_sessions_active_not_expired on user_sessions(is_active, expires_at);

-- live_class_participants indexes
create unique index if not exists uq_lcp_live_class_student on live_class_participants(live_class_id, student_id);
create index if not exists idx_lcp_leave_time_null on live_class_participants(live_class_id) where leave_time is null;

-- RLS policies (enable if not already)
alter table user_sessions enable row level security;
alter table live_class_participants enable row level security;

-- user_sessions policies
drop policy if exists sel_own_sessions on user_sessions;
create policy sel_own_sessions on user_sessions for select to authenticated using (auth.uid() = user_id);

drop policy if exists ins_own_session on user_sessions;
create policy ins_own_session on user_sessions for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists upd_own_session on user_sessions;
create policy upd_own_session on user_sessions for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- live_class_participants policies: students can read their own; teachers/admin can read by class through a view or function; here basic student policy
drop policy if exists sel_own_participation on live_class_participants;
create policy sel_own_participation on live_class_participants for select to authenticated using (auth.uid() = student_id);

commit;


