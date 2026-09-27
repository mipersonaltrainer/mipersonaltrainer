import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Env = "sandbox" | "live";
export const INCLUDED_STUDENTS = 20;

async function priceIdOf(env: Env, external: string) {
  const { gatewayFetch } = await import("@/lib/paddle.server");
  const r = await gatewayFetch(env, `/prices?external_id=${encodeURIComponent(external)}`);
  const j = await r.json();
  const id = j.data?.[0]?.id as string | undefined;
  if (!id) throw new Error("Price not found");
  return id;
}

/** Keeps the trainer's subscription at base plan + US$0.20 per student above 20. */
export const syncTrainerSeats = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { environment: Env }) => d)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { count } = await supabase.from("trainer_students").select("id", { count: "exact", head: true });
    const extra = Math.max(0, (count ?? 0) - INCLUDED_STUDENTS);
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("paddle_subscription_id")
      .eq("user_id", userId).eq("environment", data.environment).eq("product_id", "trainer_plan")
      .in("status", ["active", "trialing", "past_due"])
      .order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (!sub) return { students: count ?? 0, extra, synced: false };
    const { gatewayFetch } = await import("@/lib/paddle.server");
    const base = await priceIdOf(data.environment, "trainer_monthly");
    const items: { price_id: string; quantity: number }[] = [{ price_id: base, quantity: 1 }];
    if (extra > 0) items.push({ price_id: await priceIdOf(data.environment, "trainer_extra_monthly"), quantity: extra });
    const r = await gatewayFetch(data.environment, `/subscriptions/${sub.paddle_subscription_id}`, {
      method: "PATCH",
      body: JSON.stringify({ items, proration_billing_mode: "prorated_next_billing_period" }),
    });
    if (!r.ok) console.error("seat sync failed", await r.text());
    return { students: count ?? 0, extra, synced: r.ok };
  });

export const generateRecipes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { environment: Env; context: string; request: string }) => ({
    environment: d.environment,
    context: String(d.context).slice(0, 3000),
    request: String(d.request).slice(0, 500),
  }))
  .handler(async ({ data, context }) => {
    const { data: ok } = await context.supabase.rpc("has_active_subscription", {
      user_uuid: context.userId, check_env: data.environment, check_product: "recipes_addon",
    });
    const { data: admin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!ok && !admin) throw new Error("Necesitas el plan de recetas");
    const key = process.env["LOVABLE_API_KEY"]!;
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: 'Eres nutricionista deportivo. Responde en español SOLO JSON: {"recipes":[{"title":string,"meal":"desayuno"|"almuerzo"|"cena"|"snack","minutes":number,"kcal":number,"protein":number,"carbs":number,"fat":number,"ingredients":[string],"steps":[string]}]}. 4 recetas sencillas, ingredientes fáciles de conseguir en Latinoamérica, gramos exactos, ajustadas a las calorías y macros del día y a lo que pida la persona.' },
          { role: "user", content: `Datos:\n${data.context}\n\nPedido: ${data.request || "Recetas para hoy"}` },
        ],
      }),
    });
    if (res.status === 429) throw new Error("Demasiadas solicitudes, intenta en un momento.");
    if (res.status === 402) throw new Error("Se agotaron los créditos de IA.");
    if (!res.ok) throw new Error("No se pudieron crear las recetas.");
    const j = await res.json();
    const parsed = JSON.parse(j.choices?.[0]?.message?.content ?? "{}");
    return (parsed.recipes ?? []) as Recipe[];
  });

export type Recipe = {
  title: string; meal: string; minutes: number; kcal: number; protein: number; carbs: number; fat: number;
  ingredients: string[]; steps: string[];
};
