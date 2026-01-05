-- Fix security issues: restrict species_stats to service role/triggers only

-- Drop existing overly permissive policies on species_stats
DROP POLICY IF EXISTS "Anyone can insert species stats" ON public.species_stats;
DROP POLICY IF EXISTS "Anyone can update species stats" ON public.species_stats;

-- Keep read access public for leaderboard display
-- No new INSERT/UPDATE policies - only triggers with SECURITY DEFINER can modify

-- Restrict species_views SELECT to not expose wallet addresses publicly
DROP POLICY IF EXISTS "Anyone can read views" ON public.species_views;

-- Create policy that only allows reading view_count aggregates without wallet details
-- For now, keep anonymous views readable but restrict wallet-linked views
CREATE POLICY "Anyone can read anonymous views" 
ON public.species_views 
FOR SELECT 
USING (wallet_address IS NULL);

CREATE POLICY "Users can read their own views" 
ON public.species_views 
FOR SELECT 
USING (wallet_address IS NOT NULL AND wallet_address = lower(current_setting('request.headers', true)::json->>'x-wallet-address'));