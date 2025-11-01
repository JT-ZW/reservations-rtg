-- ============================================================
-- Rainbow Towers Conference & Event Booking System
-- Database Schema - Part 4: Triggers & Functions
-- ============================================================
-- Version: 1.0.0
-- Date: October 31, 2025
-- Description: Automatic triggers for timestamps and logging
-- ============================================================

-- ============================================================
-- FUNCTION: Update timestamp on row modification
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.update_updated_at() IS 'Automatically updates updated_at timestamp';

-- ============================================================
-- FUNCTION: Log activity for bookings
-- ============================================================
CREATE OR REPLACE FUNCTION public.log_booking_activity()
RETURNS TRIGGER AS $$
DECLARE
  action_type TEXT;
  old_data JSONB;
  new_data JSONB;
BEGIN
  -- Determine action type
  IF TG_OP = 'INSERT' THEN
    action_type := 'create';
    new_data := to_jsonb(NEW);
    
    INSERT INTO public.activity_logs (user_id, action, entity_type, entity_id, details)
    VALUES (NEW.created_by, action_type, 'booking', NEW.id, new_data);
    
  ELSIF TG_OP = 'UPDATE' THEN
    action_type := 'update';
    old_data := to_jsonb(OLD);
    new_data := to_jsonb(NEW);
    
    INSERT INTO public.activity_logs (user_id, action, entity_type, entity_id, details)
    VALUES (
      NEW.updated_by, 
      action_type, 
      'booking', 
      NEW.id, 
      jsonb_build_object('old', old_data, 'new', new_data)
    );
    
  ELSIF TG_OP = 'DELETE' THEN
    action_type := 'delete';
    old_data := to_jsonb(OLD);
    
    INSERT INTO public.activity_logs (user_id, action, entity_type, entity_id, details)
    VALUES (OLD.updated_by, action_type, 'booking', OLD.id, old_data);
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.log_booking_activity() IS 'Automatically logs all booking changes';

-- ============================================================
-- FUNCTION: Generate booking number
-- ============================================================
CREATE OR REPLACE FUNCTION public.generate_booking_number()
RETURNS TRIGGER AS $$
DECLARE
  year_part TEXT;
  sequence_num INTEGER;
  new_booking_number TEXT;
BEGIN
  -- Get current year
  year_part := TO_CHAR(NOW(), 'YYYY');
  
  -- Get next sequence number for this year
  SELECT COUNT(*) + 1 INTO sequence_num
  FROM public.bookings
  WHERE booking_number LIKE 'BK-' || year_part || '-%';
  
  -- Generate booking number
  new_booking_number := 'BK-' || year_part || '-' || LPAD(sequence_num::TEXT, 4, '0');
  
  NEW.booking_number := new_booking_number;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.generate_booking_number() IS 'Auto-generates booking numbers (BK-YYYY-####)';

-- ============================================================
-- FUNCTION: Log entity changes (generic)
-- ============================================================
CREATE OR REPLACE FUNCTION public.log_entity_activity()
RETURNS TRIGGER AS $$
DECLARE
  action_type TEXT;
  entity_name TEXT;
  user_id_val UUID;
BEGIN
  -- Determine entity type from table name
  entity_name := TG_TABLE_NAME;
  
  -- Determine action type
  IF TG_OP = 'INSERT' THEN
    action_type := 'create';
    user_id_val := NEW.created_by;
    
    INSERT INTO public.activity_logs (user_id, action, entity_type, entity_id, details)
    VALUES (user_id_val, action_type, entity_name, NEW.id, to_jsonb(NEW));
    
  ELSIF TG_OP = 'UPDATE' THEN
    action_type := 'update';
    user_id_val := NEW.updated_by;
    
    INSERT INTO public.activity_logs (user_id, action, entity_type, entity_id, details)
    VALUES (
      user_id_val, 
      action_type, 
      entity_name, 
      NEW.id, 
      jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW))
    );
    
  ELSIF TG_OP = 'DELETE' THEN
    action_type := 'delete';
    user_id_val := OLD.updated_by;
    
    INSERT INTO public.activity_logs (user_id, action, entity_type, entity_id, details)
    VALUES (user_id_val, action_type, entity_name, OLD.id, to_jsonb(OLD));
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.log_entity_activity() IS 'Generic function to log changes to any entity';

-- ============================================================
-- TRIGGERS: Updated_at timestamp
-- ============================================================
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_rooms_updated_at
  BEFORE UPDATE ON public.rooms
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_addons_updated_at
  BEFORE UPDATE ON public.addons
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_event_types_updated_at
  BEFORE UPDATE ON public.event_types
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- TRIGGERS: Activity logging
-- ============================================================
CREATE TRIGGER log_booking_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.log_booking_activity();

CREATE TRIGGER log_room_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.rooms
  FOR EACH ROW
  EXECUTE FUNCTION public.log_entity_activity();

CREATE TRIGGER log_client_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.log_entity_activity();

CREATE TRIGGER log_user_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.log_entity_activity();

-- ============================================================
-- TRIGGER: Auto-generate booking number
-- ============================================================
CREATE TRIGGER generate_booking_number_trigger
  BEFORE INSERT ON public.bookings
  FOR EACH ROW
  WHEN (NEW.booking_number IS NULL)
  EXECUTE FUNCTION public.generate_booking_number();

-- ============================================================
-- SUCCESS MESSAGE
-- ============================================================
DO $$ 
BEGIN 
  RAISE NOTICE 'Triggers and functions created successfully!';
END $$;
