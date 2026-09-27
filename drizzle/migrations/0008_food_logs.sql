CREATE TABLE public.food_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  day date not null default current_date,
  meal text not null default 'almuerzo',
  name text not null,
  grams numeric not null default 100,
  kcal numeric not null default 0,
  protein numeric not null default 0,
  carbs numeric not null default 0,
  fat numeric not null default 0,
  barcode text,
  created_at timestamptz not null default now()
);
CREATE INDEX idx_food_logs_user_day ON public.food_logs(user_id, day);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.food_logs TO authenticated;
GRANT ALL ON public.food_logs TO service_role;
ALTER TABLE public.food_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own food logs" ON public.food_logs FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);