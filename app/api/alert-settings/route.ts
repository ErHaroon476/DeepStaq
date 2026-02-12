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

    // Get alert settings for this godown
    const { data: alertSettings, error: settingsError } = await supabaseServer
      .from("alert_settings")
      .select("*")
      .eq("godown_id", godownId)
      .eq("user_id", user.uid)
      .single();

    if (settingsError && settingsError.code !== 'PGRST116') {
      console.error("[DeepStaq] Failed to fetch alert settings", settingsError);
      return new Response("Failed to fetch alert settings", { status: 500 });
    }

    // Get unit types for this godown
    const { data: unitTypes, error: unitTypesError } = await supabaseServer
      .from("unit_types")
      .select("id, name")
      .eq("godown_id", godownId)
      .eq("user_id", user.uid);

    if (unitTypesError) {
      console.error("[DeepStaq] Failed to fetch unit types", unitTypesError);
      return new Response("Failed to fetch unit types", { status: 500 });
    }

    console.log("[DeepStaq] Found unit types:", unitTypes?.length || 0);

    // Get unit-specific alert settings
    const { data: unitAlertSettings, error: unitAlertError } = await supabaseServer
      .from("unit_alert_settings")
      .select("unit_type_id, empty_threshold, low_threshold")
      .eq("godown_id", godownId)
      .eq("user_id", user.uid);

    if (unitAlertError && unitAlertError.code !== 'PGRST116') {
      console.error("[DeepStaq] Failed to fetch unit alert settings", unitAlertError);
      return new Response("Failed to fetch unit alert settings", { status: 500 });
    }

    console.log("[DeepStaq] Found unit alert settings:", unitAlertSettings?.length || 0);

    // Combine data
    const unitTypesWithSettings = (unitTypes || []).map(unitType => {
      const unitSetting = unitAlertSettings?.find(setting => setting.unit_type_id === unitType.id);
      return {
        id: unitType.id,
        name: unitType.name,
        emptyThreshold: unitSetting?.empty_threshold ?? 0,
        lowThreshold: unitSetting?.low_threshold ?? 3
      };
    });

    const response = {
      globalSettings: alertSettings || {
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
