-- Compatibility RPC required by the Cloud Run NDA PDF generator.
-- The generator calls this after validating the user's Supabase JWT.

CREATE OR REPLACE FUNCTION public.get_nda_metadata_v2(
  p_current_gmt TEXT DEFAULT NULL,
  p_ip TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now TIMESTAMPTZ := NOW();
  v_current_gmt TIMESTAMPTZ := NOW();
  v_signer_email TEXT := COALESCE(NULLIF(auth.jwt() ->> 'email', ''), 'unknown@email.com');
  v_signer_name TEXT := COALESCE(
    NULLIF(auth.jwt() -> 'user_metadata' ->> 'full_name', ''),
    NULLIF(auth.jwt() -> 'user_metadata' ->> 'name', ''),
    NULLIF(auth.jwt() ->> 'email', ''),
    'Individual Investor'
  );
  v_metadata JSONB;
BEGIN
  BEGIN
    IF p_current_gmt IS NOT NULL AND BTRIM(p_current_gmt) <> '' THEN
      v_current_gmt := p_current_gmt::TIMESTAMPTZ;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    v_current_gmt := v_now;
  END;

  v_metadata := JSONB_BUILD_OBJECT(
    'name', v_signer_name,
    'state', 'N/A',
    'city', 'N/A',
    'country', 'N/A',
    'individual_address', 'N/A',
    'legal_email', v_signer_email,
    'mobile_telephone', 'N/A'
  );

  RETURN JSONB_BUILD_OBJECT(
    'status', 'success',
    'investor_type', 'Individual',
    'metadata', v_metadata
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_nda_metadata_v2(TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_nda_metadata_v2(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_nda_metadata_v2(TEXT, TEXT) TO service_role;

NOTIFY pgrst, 'reload schema';
