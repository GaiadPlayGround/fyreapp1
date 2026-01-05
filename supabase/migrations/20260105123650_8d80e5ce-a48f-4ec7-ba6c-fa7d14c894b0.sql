-- Fix RLS policies for species_views - restrict wallet address visibility
DROP POLICY IF EXISTS "Anyone can read anonymous views" ON species_views;
DROP POLICY IF EXISTS "Users can read their own views" ON species_views;

-- Only allow reading views without wallet address exposure (for analytics)
-- Users can only see aggregate data or their own views
CREATE POLICY "Read views without wallet exposure" 
ON species_views 
FOR SELECT 
USING (wallet_address IS NULL OR wallet_address = lower(COALESCE(current_setting('request.headers', true)::json->>'x-wallet-address', '')));

-- Fix RLS policies for species_stats - remove public INSERT/UPDATE
DROP POLICY IF EXISTS "Anyone can insert species stats" ON species_stats;
DROP POLICY IF EXISTS "Anyone can update species stats" ON species_stats;

-- Species stats should only be modified by triggers (service role), not direct client access
-- The triggers (increment_species_votes, increment_species_shares, track_species_view) already handle updates with SECURITY DEFINER