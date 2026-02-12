import { NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { requireUser } from "@/lib/authServer";

interface SupabaseError {
  message: string;
  details?: string;
  hint?: string;
  code?: string;
}

export async function GET(
  req: NextRequest,
) {
  const user = await requireUser();
  const url = new URL(req.url);
  const godownId = url.searchParams.get('godownId');

  if (!godownId) {
    return new Response("godownId is required", { status: 400 });
  }

  try {
    console.log("[DeepStaq] Fetching alert settings for godown:", godownId);

    // Use the EXACT same API call that works in godowns page
    const unitTypesRes = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/unit_types?godown_id=eq.${godownId}&user_id=eq.${user.uid}&select=id,name`, {
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY || '',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY || ''}`
      }
    });

    if (!unitTypesRes.ok) {
      console.error("[DeepStaq] Failed to fetch unit types", await unitTypesRes.text());
      return new Response("Failed to fetch unit types", { status: 500 });
    }

    const unitTypes = await unitTypesRes.json();
    console.log("[DeepStaq] Found unit types:", unitTypes?.length || 0);
    console.log("[DeepStaq] Unit types data:", unitTypes);

    // Return unit types with default thresholds
    const unitTypesWithSettings = unitTypes.map((unitType: any) => ({
      id: unitType.id,
      name: unitType.name,
      emptyThreshold: 0,
      lowThreshold: 3
    }));

    const response = {
      globalSettings: {
        empty_threshold: 0,
        low_threshold: 3
      },
      unitTypes: unitTypesWithSettings
    };

    console.log("[DeepStaq] Returning alert settings response");
    return Response.json(response);
  } catch (error) {
    console.error("[DeepStaq] Failed to fetch alert settings", error);
    return new Response("Failed to fetch alert settings", { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
) {
  const user = await requireUser();
  const { godownId, emptyThreshold, lowThreshold, unitTypes } = await req.json();

  if (!godownId) {
    return new Response("godownId is required", { status: 400 });
  }

  try {
    console.log("[DeepStaq] Saving alert settings for godown:", godownId);
    console.log("[DeepStaq] Settings:", { emptyThreshold, lowThreshold, unitTypesCount: unitTypes?.length });

    // Update or insert global alert settings
    const { error: settingsError } = await supabaseServer
      .from("alert_settings")
      .upsert({
        godown_id: godownId,
        user_id: user.uid,
        empty_threshold: emptyThreshold,
        low_threshold: lowThreshold
      }, {
        onConflict: 'godown_id,user_id'
      });

    if (settingsError) {
      console.error("[DeepStaq] Failed to save alert settings", settingsError);
      return new Response("Failed to save alert settings", { status: 500 });
    }

    // Update unit-specific settings
    if (unitTypes && unitTypes.length > 0) {
      const unitSettingsData = unitTypes.map((unitType: any) => ({
        godown_id: godownId,
        user_id: user.uid,
        unit_type_id: unitType.id,
        empty_threshold: unitType.emptyThreshold,
        low_threshold: unitType.lowThreshold
      }));

      const { error: unitSettingsError } = await supabaseServer
        .from("unit_alert_settings")
        .upsert(unitSettingsData, {
          onConflict: 'godown_id,user_id,unit_type_id'
        });

      if (unitSettingsError) {
        console.error("[DeepStaq] Failed to save unit alert settings", unitSettingsError);
        return new Response("Failed to save unit alert settings", { status: 500 });
      }
    }

    console.log("[DeepStaq] Alert settings saved successfully to database");
    return Response.json({ success: true });
  } catch (error) {
    console.error("[DeepStaq] Failed to save alert settings", error);
    return new Response("Failed to save alert settings", { status: 500 });
  }
}
