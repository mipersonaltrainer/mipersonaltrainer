import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, FlameButton, Label, Screen, TabBar } from "@/components/ui-kit";
import { Paywall } from "@/components/paywall";
import { useProfile } from "@/lib/store";
import { readoutFor } from "@/lib/body";
import { GOALS } from "@/lib/training";
import { generateRecipes, type Recipe } from "@/utils/billing.functions";
import { getPaddleEnvironment } from "@/lib/paddle";

export const Route = createFileRoute("/recetas")({
  head: () => ({
    meta: [
      { title: "Recetas para ti · Mi Personal Trainer" },
      { name: "description", content: "Recetas personalizadas según tus calorías, macros y objetivo." },
      { property: "og:title", content: "Recetas para ti · Mi Personal Trainer" },
      { property: "og:description", content: "Recetas personalizadas según tu plan." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <Paywall plan="recipes">
      <Recipes />
    </Paywall>
  ),
});

const SUGGEST = ["Desayuno alto en proteína", "Almuerzo en 20 minutos", "Tengo pollo, arroz y verduras", "Snack después de entrenar"];

function Recipes() {
  const { profile } = useProfile();
  const [req, setReq] = useState("");
  const [list, setList] = useState<Recipe[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [open, setOpen] = useState<number | null>(null);
  if (!profile) return <Screen />;
  const r = readoutFor(profile);
  const t = profile.macroTargets ?? {};

  const go = async (text: string) => {
    setBusy(true); setErr(null);
    try {
      const context = [
        `Objetivo: ${GOALS.find((g) => g.id === profile.goal)?.label}`,
        `Peso ${profile.bodyWeight} kg, sexo ${profile.sex ?? "?"}, edad ${profile.age ?? "?"}`,
        `Meta diaria: ${t.kcal ?? r.calories ?? "?"} kcal, proteína ${t.protein ?? r.protein ?? "?"} g, carbos ${t.carbs ?? r.carbs ?? "?"} g, grasa ${t.fat ?? r.fat ?? "?"} g`,
        profile.injuries?.notes ? `Notas: ${profile.injuries.notes}` : "",
      ].join("\n");
      setList(await generateRecipes({ data: { environment: getPaddleEnvironment(), context, request: text } }));
      setOpen(0);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "No se pudieron crear las recetas.");
    } finally { setBusy(false); }
  };

  return (
    <Screen>
      <header className="px-5 pt-7">
        <div className="font-display text-[11px] tracking-[0.25em] text-flame">RECETAS PARA TI</div>
        <h1 className="font-display text-[26px] leading-none">¿QUÉ COMEMOS HOY?</h1>
        <p className="mt-2 text-[12px] text-mute">Hechas para tus {t.kcal ?? r.calories ?? "—"} kcal diarias y tus macros.</p>
      </header>
      <section className="mt-4 space-y-3 px-5">
        <textarea value={req} onChange={(e) => setReq(e.target.value)} rows={2} maxLength={500} placeholder="Pide lo que quieras: sin lácteos, lo que tengo en la nevera…" className="w-full rounded-2xl bg-card px-4 py-3 text-[14px] ring-1 ring-line/60" />
        <div className="flex flex-wrap gap-2">
          {SUGGEST.map((s) => <button key={s} onClick={() => { setReq(s); void go(s); }} className="chip rounded-full px-3 py-1.5 text-[12px]">{s}</button>)}
        </div>
        <FlameButton onClick={() => go(req)} className="w-full">{busy ? "CREANDO RECETAS..." : "CREAR RECETAS"}</FlameButton>
        {err && <p className="text-[13px] text-flame">{err}</p>}
        {list.map((x, i) => (
          <Card key={i}>
            <button onClick={() => setOpen(open === i ? null : i)} className="block w-full text-left">
              <Label>{x.meal} · {x.minutes} min</Label>
              <h2 className="mt-1 font-display text-[20px] leading-tight">{x.title}</h2>
              <div className="mt-1 text-[12px] text-mute">{x.kcal} kcal · P {x.protein} g · C {x.carbs} g · G {x.fat} g</div>
            </button>
            {open === i && (
              <div className="mt-3 space-y-3 text-[13px]">
                <div><Label>Ingredientes</Label><ul className="mt-1 space-y-1">{x.ingredients.map((g) => <li key={g}>• {g}</li>)}</ul></div>
                <div><Label>Preparación</Label><ol className="mt-1 space-y-1">{x.steps.map((s, k) => <li key={k}>{k + 1}. {s}</li>)}</ol></div>
              </div>
            )}
          </Card>
        ))}
      </section>
      <TabBar />
    </Screen>
  );
}
