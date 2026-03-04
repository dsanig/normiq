import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Eres un experto en análisis predictivo para gestión de calidad en el sector farmacéutico y sanitario.

Tu rol es detectar patrones en datos históricos de incidencias, desviaciones y CAPAs para predecir y prevenir problemas futuros.

TIPOS DE PATRONES A DETECTAR:
1. Correlaciones temporales (estacionalidad, turnos, días de la semana)
2. Correlaciones de personal (rotación, formación, experiencia)
3. Correlaciones de equipo/línea de producción
4. Tendencias crecientes o decrecientes
5. Clusters de incidencias por área o proceso

IMPORTANTE:
- Proporciona insights accionables, no solo estadísticas
- Sugiere acciones preventivas concretas
- Indica nivel de confianza en cada insight
- Usa lenguaje profesional en español`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No autorizado. Se requiere autenticación." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    const userSupabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await userSupabase.auth.getUser();
    if (authError || !user) {
      console.error("Auth error:", authError?.message);
      return new Response(
        JSON.stringify({ error: "Token inválido o expirado." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { companyId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: "Perfil de usuario no encontrado." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (profile.company_id !== companyId) {
      return new Response(
        JSON.stringify({ error: "No tiene permiso para analizar datos de esta empresa." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const [{ data: incidentsData, error: incidentsError }, { data: auditsData, error: auditsError }] = await Promise.all([
      supabase
        .from("incidencias")
        .select("id, incidencia_type, status, title, description, created_at, deadline, audit_id")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })
        .limit(500),
      supabase
        .from("audits")
        .select("id, title, status, audit_date, created_at")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })
        .limit(200),
    ]);

    if (incidentsError) throw incidentsError;
    if (auditsError) throw auditsError;

    if (!incidentsData || incidentsData.length === 0) {
      return new Response(
        JSON.stringify({ error: "No hay incidencias reales disponibles para analizar." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const analysisContext = JSON.stringify(
      {
        incidents: incidentsData,
        audits: auditsData ?? [],
      },
      null,
      2
    );

    const userPrompt = `Analiza los siguientes datos reales de la empresa y detecta patrones predictivos:

DATOS:
${analysisContext}

Responde en formato JSON con esta estructura:
{
  "insights": [
    {
      "insight_type": "pattern|trend|risk|recommendation",
      "severity": "high|medium|low",
      "title": "Título del insight",
      "description": "Descripción detallada del patrón detectado",
      "pattern_details": {
        "type": "shift_correlation|seasonal|equipment|personnel|process",
        "correlation_strength": 0.85,
        "data_points_analyzed": 15
      },
      "affected_areas": ["Línea 4", "Turno B"],
      "suggested_actions": [
        "Acción preventiva 1",
        "Acción preventiva 2"
      ],
      "confidence_score": 85
    }
  ]
}

Genera entre 2 y 5 insights relevantes basados únicamente en los datos proporcionados.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    const parsed = JSON.parse(content);
    const insights = parsed.insights || [];

    for (const insight of insights) {
      const { data: insightData, error: insightError } = await supabase
        .from("predictive_insights")
        .insert({
          company_id: companyId,
          insight_type: insight.insight_type,
          severity: insight.severity,
          title: insight.title,
          description: insight.description,
          pattern_details: insight.pattern_details,
          affected_areas: insight.affected_areas,
          suggested_actions: insight.suggested_actions,
          confidence_score: insight.confidence_score,
        })
        .select()
        .single();

      if (insightError) {
        console.error("Error inserting insight:", insightError);
        continue;
      }

      if (insight.pattern_details) {
        await supabase.from("pattern_detections").insert({
          company_id: companyId,
          insight_id: insightData.id,
          pattern_type: insight.pattern_details.type,
          data_points: { analyzed: insight.pattern_details.data_points_analyzed },
          correlation_strength: insight.pattern_details.correlation_strength,
        });
      }
    }

    return new Response(
      JSON.stringify({ success: true, insightsCount: insights.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("CAPA pattern analysis error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
