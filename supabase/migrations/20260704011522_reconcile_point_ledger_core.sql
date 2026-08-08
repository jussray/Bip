ALTER TABLE public.point_transactions
  ALTER COLUMN event_type DROP NOT NULL,
  ALTER COLUMN points DROP NOT NULL;

ALTER TABLE public.point_transactions
  ADD COLUMN IF NOT EXISTS amount integer,
  ADD COLUMN IF NOT EXISTS reason text,
  ADD COLUMN IF NOT EXISTS transaction_type text NOT NULL DEFAULT 'earn',
  ADD COLUMN IF NOT EXISTS source_type text,
  ADD COLUMN IF NOT EXISTS source_id text,
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.point_transactions
  DROP CONSTRAINT IF EXISTS point_transactions_amount_or_points_chk;
ALTER TABLE public.point_transactions
  ADD CONSTRAINT point_transactions_amount_or_points_chk
  CHECK (amount IS NOT NULL OR points IS NOT NULL);

UPDATE public.point_transactions
SET amount = points
WHERE amount IS NULL AND points IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.point_balances (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  available integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.point_balances ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.apply_point_transaction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_delta integer := coalesce(NEW.amount, NEW.points, 0);
BEGIN
  INSERT INTO public.point_balances (user_id, available, updated_at)
  VALUES (NEW.user_id, v_delta, now())
  ON CONFLICT (user_id) DO UPDATE
    SET available = public.point_balances.available + v_delta,
        updated_at = now();
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.apply_point_transaction() FROM public, anon, authenticated;

DROP TRIGGER IF EXISTS point_transactions_apply_balance ON public.point_transactions;
CREATE TRIGGER point_transactions_apply_balance
AFTER INSERT ON public.point_transactions
FOR EACH ROW EXECUTE FUNCTION public.apply_point_transaction();

INSERT INTO public.point_balances (user_id, available, updated_at)
SELECT user_id, sum(coalesce(amount, points, 0)), now()
FROM public.point_transactions
GROUP BY user_id
ON CONFLICT (user_id) DO UPDATE
SET available = excluded.available,
    updated_at = now();
