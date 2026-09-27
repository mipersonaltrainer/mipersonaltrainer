import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, FlameButton, Label, Screen, TabBar } from "@/components/ui-kit";
import { Paywall } from "@/components/paywall";
import { useProfile } from "@/lib/store";
import { readoutFor } from "@/lib/body";

export const Route = createFileRoute("/nutricion")({
  head: () => ({
    meta: [
      { title: "Calorías y macros · Mi Personal Trainer" },
      { name: "description", content: "Cuenta tus calorías y macros, escanea productos y sigue tu plan de alimentación." },
      { property: "og:title", content: "Calorías y macros · Mi Personal Trainer" },
      { property: "og:description", content: "Cuenta tus calorías y macros según tu plan." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <Paywall plan="nutrition">
      <Nutrition />
    </Paywall>
  ),
});

type Food = { name: string; kcal: number; protein: number; carbs: number; fat: number; barcode?: string | undefined }; // per 100 g
type Entry = Food & { id: string; meal: string; grams: number };
const MEALS = ["desayuno", "almuerzo", "cena", "snack"] as const;
const today = () => new Date().toLocaleDateString("en-CA");

function fromOff(p: any, code?: string): Food | null {
  const n = p?.nutriments;
  if (!n) return null;
  return {
    name: p.product_name_es || p.product_name || "Producto",
    kcal: Math.round(n["energy-kcal_100g"] ?? (n["energy_100g"] ?? 0) / 4.184),
    protein: +(n.proteins_100g ?? 0),
    carbs: +(n.carbohydrates_100g ?? 0),
    fat: +(n.fat_100g ?? 0),
    barcode: code ?? p.code,
  };
}

function Nutrition() {
  const { profile, save } = useProfile();
  const [day, setDay] = useState(today());
  const [entries, setEntries] = useState<Entry[]>([]);
  const [adding, setAdding] = useState<string | null>(null);
  const [editTargets, setEditTargets] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.from("food_logs").select("*").eq("day", day).order("created_at");
    setEntries(((data ?? []) as any[]).map((r) => ({ ...r, kcal: +r.kcal, protein: +r.protein, carbs: +r.carbs, fat: +r.fat, grams: +r.grams })));
  }, [day]);
  useEffect(() => void load(), [load]);

  if (!profile) return <Screen />;
  const r = readoutFor(profile);
  const t = profile.macroTargets ?? {};
  const target = {
    kcal: t.kcal ?? r.calories ?? 2000,
    protein: t.protein ?? r.protein ?? 120,
    carbs: t.carbs ?? r.carbs ?? 200,
    fat: t.fat ?? r.fat ?? 60,
  };
  const total = entries.reduce(
    (a, e) => ({ kcal: a.kcal + e.kcal, protein: a.protein + e.protein, carbs: a.carbs + e.carbs, fat: a.fat + e.fat }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 },
  );
  const left = Math.round(target.kcal - total.kcal);
  const pct = Math.min(100, (total.kcal / target.kcal) * 100);

  const remove = async (id: string) => {
    await supabase.from("food_logs").delete().eq("id", id);
    void load();
  };
  const shift = (d: number) => {
    const x = new Date(day + "T12:00:00");
    x.setDate(x.getDate() + d);
    setDay(x.toLocaleDateString("en-CA"));
  };

  return (
    <Screen>
      <header className="px-5 pt-7">
        <div className="font-display text-[11px] tracking-[0.25em] text-flame">CALORÍAS Y MACROS</div>
        <div className="mt-1 flex items-center justify-between">
          <button onClick={() => shift(-1)} aria-label="Día anterior" className="px-2 font-display text-[22px]">‹</button>
          <h1 className="font-display text-[24px]">{day === today() ? "HOY" : new Date(day + "T12:00:00").toLocaleDateString("es-CO", { weekday: "short", day: "numeric", month: "short" }).toUpperCase()}</h1>
          <button onClick={() => shift(1)} aria-label="Día siguiente" className="px-2 font-display text-[22px]">›</button>
        </div>
      </header>

      <section className="mt-4 px-5">
        <Card>
          <div className="flex items-center gap-5">
            <div className="relative h-28 w-28 shrink-0 rounded-full" style={{ background: `conic-gradient(var(--color-flame) ${pct}%, var(--color-line) 0)` }}>
              <div className="absolute inset-2 flex flex-col items-center justify-center rounded-full bg-card">
                <div className="font-display text-[26px] leading-none">{Math.abs(left)}</div>
                <div className="text-[10px] text-mute">{left >= 0 ? "kcal restantes" : "kcal de más"}</div>
              </div>
            </div>
            <div className="flex-1 space-y-2">
              {([["Proteína", "protein"], ["Carbos", "carbs"], ["Grasa", "fat"]] as const).map(([l, k]) => (
                <div key={k}>
                  <div className="flex justify-between text-[12px]"><span>{l}</span><span className="text-mute">{Math.round(total[k])} / {target[k]} g</span></div>
                  <div className="mt-1 h-1.5 rounded-full bg-line"><div className="h-1.5 rounded-full bg-flame" style={{ width: `${Math.min(100, (total[k] / target[k]) * 100)}%` }} /></div>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-mute">
            <span>Meta {target.kcal} kcal · {profile.macroTargets ? "de tu nutricionista" : "según tu plan"}</span>
            <button onClick={() => setEditTargets((v) => !v)} className="text-flame underline">Cambiar metas</button>
          </div>
          {editTargets && (
            <TargetsForm
              initial={target}
              onSave={(v) => { save({ ...profile, macroTargets: v }); setEditTargets(false); }}
              onReset={() => { save({ ...profile, macroTargets: undefined }); setEditTargets(false); }}
            />
          )}
        </Card>
      </section>

      <section className="mt-4 space-y-3 px-5">
        {MEALS.map((m) => {
          const list = entries.filter((e) => e.meal === m);
          const kcal = Math.round(list.reduce((a, e) => a + e.kcal, 0));
          return (
            <Card key={m}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display text-[18px] uppercase">{m}</h2>
                  <div className="text-[11px] text-mute">{kcal} kcal</div>
                </div>
                <button onClick={() => setAdding(m)} aria-label={`Agregar a ${m}`} className="h-9 w-9 rounded-full bg-flame font-display text-[20px] text-bg">+</button>
              </div>
              {list.map((e) => (
                <div key={e.id} className="mt-2 flex items-center justify-between border-t border-line/50 pt-2 text-[13px]">
                  <div>
                    <div>{e.name}</div>
                    <div className="text-[11px] text-mute">{e.grams} g · {Math.round(e.kcal)} kcal · P {Math.round(e.protein)} · C {Math.round(e.carbs)} · G {Math.round(e.fat)}</div>
                  </div>
                  <button onClick={() => remove(e.id)} aria-label="Quitar alimento" className="px-2 text-mute">✕</button>
                </div>
              ))}
            </Card>
          );
        })}
      </section>

      {adding && <AddFood meal={adding} day={day} onClose={() => { setAdding(null); void load(); }} />}
      <TabBar />
    </Screen>
  );
}

function TargetsForm({ initial, onSave, onReset }: { initial: Record<"kcal" | "protein" | "carbs" | "fat", number>; onSave: (v: typeof initial) => void; onReset: () => void }) {
  const [v, setV] = useState(initial);
  return (
    <div className="mt-3 space-y-2 border-t border-line/50 pt-3">
      <p className="text-[11px] text-mute">Escribe las metas que te dio tu nutricionista o entrenador.</p>
      <div className="grid grid-cols-4 gap-2">
        {(["kcal", "protein", "carbs", "fat"] as const).map((k) => (
          <label key={k} className="text-[10px] text-mute">
            {k === "kcal" ? "Kcal" : k === "protein" ? "Prot g" : k === "carbs" ? "Carb g" : "Grasa g"}
            <input type="number" inputMode="numeric" value={v[k]} onChange={(e) => setV({ ...v, [k]: +e.target.value })} className="mt-1 w-full rounded-xl bg-bg px-2 py-2 text-[14px] text-ink" />
          </label>
        ))}
      </div>
      <div className="flex gap-2">
        <FlameButton onClick={() => onSave(v)} className="flex-1">GUARDAR</FlameButton>
        <button onClick={onReset} className="flex-1 rounded-full py-2 text-[12px] text-mute ring-1 ring-line">Usar las de mi plan</button>
      </div>
    </div>
  );
}

function AddFood({ meal, day, onClose }: { meal: string; day: string; onClose: () => void }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Food[]>([]);
  const [picked, setPicked] = useState<Food | null>(null);
  const [grams, setGrams] = useState(100);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [manual, setManual] = useState(false);

  const search = async () => {
    if (!q.trim()) return;
    setBusy(true); setMsg(null);
    try {
      if (/^\d{8,14}$/.test(q.trim())) return void (await byCode(q.trim()));
      const r = await fetch(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(q)}&search_simple=1&json=1&page_size=15&fields=product_name,product_name_es,nutriments,code`);
      const j = await r.json();
      const list = (j.products ?? []).map((p: any) => fromOff(p)).filter((f: Food | null): f is Food => !!f && f.kcal > 0);
      setResults(list);
      if (!list.length) setMsg("No encontré ese alimento. Puedes agregarlo a mano.");
    } catch { setMsg("No se pudo buscar. Revisa tu conexión."); }
    finally { setBusy(false); }
  };

  const byCode = async (code: string) => {
    setBusy(true); setMsg(null);
    try {
      const r = await fetch(`https://world.openfoodfacts.org/api/v2/product/${code}.json`);
      const j = await r.json();
      const f = j.status === 1 ? fromOff(j.product, code) : null;
      if (f) setPicked(f); else { setMsg("Ese producto no está en la base. Agrégalo a mano."); setManual(true); }
    } catch { setMsg("No se pudo leer el producto."); }
    finally { setBusy(false); }
  };

  const add = async (f: Food) => {
    const k = grams / 100;
    await supabase.from("food_logs").insert({
      day, meal, name: f.name, grams, barcode: f.barcode ?? null,
      kcal: Math.round(f.kcal * k), protein: +(f.protein * k).toFixed(1), carbs: +(f.carbs * k).toFixed(1), fat: +(f.fat * k).toFixed(1),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-bg/80" onClick={onClose}>
      <div className="max-h-[88dvh] w-full max-w-[430px] overflow-y-auto rounded-t-[28px] bg-surface p-5 pb-10" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-[20px] uppercase">Agregar a {meal}</h2>
          <button onClick={onClose} aria-label="Cerrar" className="px-2 text-mute">✕</button>
        </div>

        {picked ? (
          <div className="mt-4 space-y-3">
            <Card>
              <div className="font-display text-[18px]">{picked.name}</div>
              <div className="text-[11px] text-mute">Por 100 g: {picked.kcal} kcal · P {picked.protein} · C {picked.carbs} · G {picked.fat}</div>
            </Card>
            <Label>¿Cuántos gramos?</Label>
            <input type="number" inputMode="numeric" value={grams} onChange={(e) => setGrams(+e.target.value)} className="w-full rounded-2xl bg-bg px-4 py-3 text-[16px]" />
            <div className="text-[13px]">= {Math.round((picked.kcal * grams) / 100)} kcal · P {Math.round((picked.protein * grams) / 100)} g · C {Math.round((picked.carbs * grams) / 100)} g · G {Math.round((picked.fat * grams) / 100)} g</div>
            <FlameButton onClick={() => add(picked)} className="w-full">AGREGAR</FlameButton>
            <button onClick={() => setPicked(null)} className="w-full py-2 text-[12px] text-mute">Elegir otro</button>
          </div>
        ) : manual ? (
          <ManualFood onPick={(f) => { setPicked(f); setManual(false); }} />
        ) : (
          <div className="mt-4 space-y-3">
            <FlameButton onClick={() => setScanning(true)} className="w-full">ESCANEAR CÓDIGO DE BARRAS</FlameButton>
            <div className="flex gap-2">
              <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && search()} placeholder="Busca: arroz, huevo, avena… o el código" className="flex-1 rounded-2xl bg-bg px-4 py-3 text-[14px]" />
              <button onClick={search} className="rounded-2xl bg-card px-4 text-[13px] ring-1 ring-line">{busy ? "…" : "Buscar"}</button>
            </div>
            {msg && <p className="text-[12px] text-flame">{msg}</p>}
            {results.map((f, i) => (
              <button key={i} onClick={() => setPicked(f)} className="block w-full rounded-2xl bg-card px-4 py-3 text-left">
                <div className="text-[14px]">{f.name}</div>
                <div className="text-[11px] text-mute">{f.kcal} kcal / 100 g · P {f.protein} · C {f.carbs} · G {f.fat}</div>
              </button>
            ))}
            <button onClick={() => setManual(true)} className="w-full py-2 text-[12px] text-mute underline">Agregar alimento a mano</button>
          </div>
        )}
        {scanning && <Scanner onCode={(c) => { setScanning(false); void byCode(c); }} onClose={() => setScanning(false)} />}
      </div>
    </div>
  );
}

function ManualFood({ onPick }: { onPick: (f: Food) => void }) {
  const [f, setF] = useState<Food>({ name: "", kcal: 0, protein: 0, carbs: 0, fat: 0 });
  return (
    <div className="mt-4 space-y-2">
      <p className="text-[11px] text-mute">Escribe los valores por cada 100 g (vienen en la etiqueta).</p>
      <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Nombre" className="w-full rounded-2xl bg-bg px-4 py-3 text-[14px]" />
      <div className="grid grid-cols-4 gap-2">
        {(["kcal", "protein", "carbs", "fat"] as const).map((k) => (
          <label key={k} className="text-[10px] text-mute">
            {k === "kcal" ? "Kcal" : k === "protein" ? "Prot" : k === "carbs" ? "Carb" : "Grasa"}
            <input type="number" inputMode="decimal" onChange={(e) => setF({ ...f, [k]: +e.target.value })} className="mt-1 w-full rounded-xl bg-bg px-2 py-2 text-[14px] text-ink" />
          </label>
        ))}
      </div>
      <FlameButton onClick={() => f.name && onPick(f)} className="w-full">CONTINUAR</FlameButton>
    </div>
  );
}

function Scanner({ onCode, onClose }: { onCode: (c: string) => void; onClose: () => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    let stream: MediaStream | null = null;
    let stop = false;
    (async () => {
      const BD = (window as any).BarcodeDetector;
      if (!BD) return setErr("Tu celular no permite escanear desde aquí. Escribe el número del código de barras en el buscador.");
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (!video.current) return;
        video.current.srcObject = stream;
        await video.current.play();
        const det = new BD({ formats: ["ean_13", "ean_8", "upc_a", "upc_e"] });
        const tick = async () => {
          if (stop || !video.current) return;
          try {
            const codes = await det.detect(video.current);
            if (codes[0]?.rawValue) return onCode(codes[0].rawValue);
          } catch { /* keep trying */ }
          setTimeout(tick, 300);
        };
        void tick();
      } catch { setErr("No pude abrir la cámara. Revisa el permiso de cámara."); }
    })();
    return () => { stop = true; stream?.getTracks().forEach((t) => t.stop()); };
  }, [onCode]);
  return (
    <div className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-bg p-6">
      {err ? <p className="text-center text-[14px]">{err}</p> : <video ref={video} playsInline muted className="w-full max-w-[400px] rounded-3xl" />}
      {!err && <p className="mt-3 text-[12px] text-mute">Apunta al código de barras del producto</p>}
      <button onClick={onClose} className="mt-6 rounded-full px-6 py-3 text-[13px] ring-1 ring-line">Cerrar</button>
    </div>
  );
}
