/**
 * NDA Admin Fetch Edge Function
 * 
 * Fetches all signed NDA records from the nda_signatures table.
 * Uses service role key to bypass RLS.
 * Password protected - requires admin password in request body.
 */

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const getAdminPassword = () => Deno.env.get("NDA_ADMIN_PASSWORD") || "123456";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Only allow POST
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const body = await req.json();
    const { password, highlightUserId } = body;

    // Verify password
    if (password !== getAdminPassword()) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - incorrect password" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with service role key to bypass RLS
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Fetch all NDA records from the current signing source of truth.
    const { data, error: fetchError } = await supabase
      .from('nda_signatures')
      .select('user_id, signer_name, signer_email, signer_ip, nda_version, pdf_url, signed_at')
      .not('signed_at', 'is', null)
      .order('signed_at', { ascending: false });

    if (fetchError) {
      console.error("Error fetching NDA records:", fetchError);
      return new Response(
        JSON.stringify({ error: fetchError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Transform the data to match expected format
    const transformedData = (data || []).map((record: { 
      user_id: string; 
      signer_name: string | null;
      signer_email: string | null;
      signer_ip: string | null;
      nda_version: string | null; 
      pdf_url: string | null;
      signed_at: string;
    }) => ({
      user_id: record.user_id,
      full_name: record.signer_name || 'N/A',
      email: record.signer_email || 'N/A',
      nda_signed_at: record.signed_at,
      nda_version: record.nda_version,
      nda_signer_ip: record.signer_ip,
      nda_signer_name: record.signer_name,
      nda_pdf_url: record.pdf_url,
    }));

    console.log(`Fetched ${transformedData.length} NDA records`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        records: transformedData,
        count: transformedData.length,
        highlightUserId: highlightUserId || null,
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (err) {
    console.error("Error in nda-admin-fetch:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
