-- Migration: Add Contact Fields for Reservationists
-- These fields will appear on quotation documents
-- Created: 2025-11-01

-- Add contact fields to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS mobile TEXT,
ADD COLUMN IF NOT EXISTS facebook TEXT,
ADD COLUMN IF NOT EXISTS skype TEXT,
ADD COLUMN IF NOT EXISTS address TEXT;

-- Add comments
COMMENT ON COLUMN public.users.phone IS 'Office phone number for quotation contact details';
COMMENT ON COLUMN public.users.mobile IS 'Mobile phone number for quotation contact details';
COMMENT ON COLUMN public.users.facebook IS 'Facebook handle for quotation contact details';
COMMENT ON COLUMN public.users.skype IS 'Skype username for quotation contact details';
COMMENT ON COLUMN public.users.address IS 'Office address for correspondence';
