create trigger trg_auto_resolve_issue after update of resolved on public.audit_events for each row execute function public.auto_resolve_issue_on_event_resolve();
