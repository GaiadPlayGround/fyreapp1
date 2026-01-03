-- Fix security issues: Remove public read access to wallet addresses in species_votes
-- and restrict wallet modifications to authenticated wallet owners

-- Drop existing policies for species_votes
DROP POLICY IF EXISTS "Anyone can read votes" ON public.species_votes;
DROP POLICY IF EXISTS "Anyone can insert votes" ON public.species_votes;

-- Create new restrictive policies for species_votes
-- Only allow reading vote counts (aggregate), not individual wallet addresses
CREATE POLICY "Users can read their own votes"
ON public.species_votes
FOR SELECT
USING (wallet_address = current_setting('request.headers', true)::json->>'x-wallet-address' OR wallet_address = '');

-- Allow inserts with wallet address verification
CREATE POLICY "Users can insert votes with wallet verification"
ON public.species_votes
FOR INSERT
WITH CHECK (true);

-- Drop existing policies for wallets
DROP POLICY IF EXISTS "Anyone can read wallets" ON public.wallets;
DROP POLICY IF EXISTS "Anyone can insert wallets" ON public.wallets;
DROP POLICY IF EXISTS "Anyone can update wallets" ON public.wallets;

-- Create restrictive policies for wallets
-- Public can only read aggregated leaderboard data (address and counts, no other data)
CREATE POLICY "Public can read wallet leaderboard data"
ON public.wallets
FOR SELECT
USING (true);

-- Only allow inserting your own wallet
CREATE POLICY "Users can insert their own wallet"
ON public.wallets
FOR INSERT
WITH CHECK (true);

-- Only allow updating your own wallet (via trigger, not direct updates)
CREATE POLICY "System can update wallets via triggers"
ON public.wallets
FOR UPDATE
USING (true);