
-- Add vote_tickets and referral_count columns to wallets table for persistence
ALTER TABLE public.wallets ADD COLUMN IF NOT EXISTS vote_tickets integer DEFAULT 0;
ALTER TABLE public.wallets ADD COLUMN IF NOT EXISTS referral_count integer DEFAULT 0;

-- Create or replace function to increment fyre_keys by a specific amount
CREATE OR REPLACE FUNCTION public.increment_fyre_keys(wallet_addr text, amount integer)
RETURNS void AS $$
BEGIN
  UPDATE public.wallets 
  SET fyre_keys = COALESCE(fyre_keys, 0) + amount,
      updated_at = now()
  WHERE address = wallet_addr;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create or replace function to increment vote_tickets
CREATE OR REPLACE FUNCTION public.increment_vote_tickets(wallet_addr text, amount integer)
RETURNS void AS $$
BEGIN
  UPDATE public.wallets 
  SET vote_tickets = COALESCE(vote_tickets, 0) + amount,
      updated_at = now()
  WHERE address = wallet_addr;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create or replace function to increment total_shares
CREATE OR REPLACE FUNCTION public.increment_total_shares(wallet_addr text, amount integer)
RETURNS void AS $$
BEGIN
  UPDATE public.wallets 
  SET total_shares = COALESCE(total_shares, 0) + amount,
      updated_at = now()
  WHERE address = wallet_addr;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create or replace function to increment referral_count
CREATE OR REPLACE FUNCTION public.increment_referral_count(wallet_addr text, amount integer)
RETURNS void AS $$
BEGIN
  UPDATE public.wallets 
  SET referral_count = COALESCE(referral_count, 0) + amount,
      updated_at = now()
  WHERE address = wallet_addr;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update the task completion trigger to use the correct fyre_keys_awarded amount
CREATE OR REPLACE FUNCTION public.award_fyre_keys_on_task_completion()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.wallets
  SET fyre_keys = COALESCE(fyre_keys, 0) + COALESCE(NEW.fyre_keys_awarded, 10),
      updated_at = now()
  WHERE address = NEW.wallet_address;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop existing trigger if any and recreate
DROP TRIGGER IF EXISTS on_task_completion_award_keys ON public.task_completions;
CREATE TRIGGER on_task_completion_award_keys
  AFTER INSERT ON public.task_completions
  FOR EACH ROW
  EXECUTE FUNCTION public.award_fyre_keys_on_task_completion();

-- RLS policies for the new RPC functions are handled by SECURITY DEFINER
