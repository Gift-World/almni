-- Phase 3: institution-grade event operations.

CREATE TYPE public.event_attendance_status AS ENUM ('registered', 'waitlisted', 'cancelled', 'checked_in', 'no_show');

ALTER TABLE public.events
  ADD COLUMN capacity integer CHECK (capacity IS NULL OR capacity > 0),
  ADD COLUMN waitlist_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN reminder_sent_at timestamptz;

ALTER TABLE public.event_rsvps
  ADD COLUMN status public.event_attendance_status NOT NULL DEFAULT 'registered',
  ADD COLUMN checked_in_at timestamptz,
  ADD COLUMN cancelled_at timestamptz;

CREATE INDEX event_rsvps_event_status_idx ON public.event_rsvps (event_id, status);

CREATE OR REPLACE FUNCTION public.validate_event_attendance()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE event_capacity integer;
DECLARE registered_count integer;
BEGIN
  SELECT capacity INTO event_capacity FROM public.events WHERE id = NEW.event_id;
  IF NEW.status = 'registered' AND event_capacity IS NOT NULL THEN
    SELECT count(*) INTO registered_count FROM public.event_rsvps
      WHERE event_id = NEW.event_id AND status IN ('registered', 'checked_in')
        AND id IS DISTINCT FROM NEW.id;
    IF registered_count >= event_capacity THEN
      RAISE EXCEPTION 'Event capacity reached';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_event_attendance
  BEFORE INSERT OR UPDATE OF status ON public.event_rsvps
  FOR EACH ROW EXECUTE FUNCTION public.validate_event_attendance();
