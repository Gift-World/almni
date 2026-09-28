-- Phase 6: operational privacy and audit governance.
-- Requests remain staff-reviewed; no browser action can erase institutional data.

CREATE INDEX privacy_requests_tenant_status_created_idx
  ON public.privacy_requests (tenant_id, status, created_at);
CREATE INDEX audit_events_tenant_created_idx
  ON public.audit_events (tenant_id, created_at DESC);
CREATE INDEX staff_invitations_tenant_email_idx
  ON public.staff_invitations (tenant_id, lower(email));

ALTER TABLE public.privacy_requests
  ADD CONSTRAINT privacy_requests_resolution_consistency
  CHECK (
    (status IN ('pending', 'in_progress') AND resolved_at IS NULL)
    OR (status IN ('completed', 'declined') AND resolved_at IS NOT NULL)
  );

CREATE OR REPLACE FUNCTION public.resolve_privacy_request_timestamp()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.status IN ('completed', 'declined') AND OLD.status IS DISTINCT FROM NEW.status THEN
    NEW.resolved_at := COALESCE(NEW.resolved_at, now());
  ELSIF NEW.status IN ('pending', 'in_progress') THEN
    NEW.resolved_at := NULL;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER resolve_privacy_request_timestamp
  BEFORE UPDATE OF status ON public.privacy_requests
  FOR EACH ROW EXECUTE FUNCTION public.resolve_privacy_request_timestamp();
