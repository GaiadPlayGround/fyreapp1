-- Species votes and interactions tracking
CREATE TABLE public.species_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    species_id TEXT NOT NULL UNIQUE,
    base_squares INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    last_viewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Individual votes tracking
CREATE TABLE public.species_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    species_id TEXT NOT NULL,
    wallet_address TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    usdc_cost DECIMAL(10,2) DEFAULT 0.2,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Individual shares tracking
CREATE TABLE public.species_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    species_id TEXT NOT NULL,
    wallet_address TEXT NOT NULL,
    platform TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Wallet/user tracking with unique invite codes
CREATE TABLE public.wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    address TEXT NOT NULL UNIQUE,
    invite_code TEXT UNIQUE,
    invited_by TEXT,
    total_votes INTEGER DEFAULT 0,
    total_shares INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Trending views tracking (for "recently opened globally")
CREATE TABLE public.species_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    species_id TEXT NOT NULL,
    wallet_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.species_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.species_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.species_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.species_views ENABLE ROW LEVEL SECURITY;

-- Public read access for stats (leaderboards, counts)
CREATE POLICY "Anyone can read species stats" ON public.species_stats FOR SELECT USING (true);
CREATE POLICY "Anyone can insert species stats" ON public.species_stats FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update species stats" ON public.species_stats FOR UPDATE USING (true);

-- Public read for votes (leaderboard)
CREATE POLICY "Anyone can read votes" ON public.species_votes FOR SELECT USING (true);
CREATE POLICY "Anyone can insert votes" ON public.species_votes FOR INSERT WITH CHECK (true);

-- Public read for shares (leaderboard)
CREATE POLICY "Anyone can read shares" ON public.species_shares FOR SELECT USING (true);
CREATE POLICY "Anyone can insert shares" ON public.species_shares FOR INSERT WITH CHECK (true);

-- Public read for wallets (leaderboard)
CREATE POLICY "Anyone can read wallets" ON public.wallets FOR SELECT USING (true);
CREATE POLICY "Anyone can insert wallets" ON public.wallets FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update wallets" ON public.wallets FOR UPDATE USING (true);

-- Public access for views
CREATE POLICY "Anyone can read views" ON public.species_views FOR SELECT USING (true);
CREATE POLICY "Anyone can insert views" ON public.species_views FOR INSERT WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_species_stats_species_id ON public.species_stats(species_id);
CREATE INDEX idx_species_stats_base_squares ON public.species_stats(base_squares DESC);
CREATE INDEX idx_species_votes_species_id ON public.species_votes(species_id);
CREATE INDEX idx_species_votes_wallet ON public.species_votes(wallet_address);
CREATE INDEX idx_species_shares_wallet ON public.species_shares(wallet_address);
CREATE INDEX idx_species_views_created ON public.species_views(created_at DESC);
CREATE INDEX idx_wallets_address ON public.wallets(address);
CREATE INDEX idx_wallets_invite_code ON public.wallets(invite_code);
CREATE INDEX idx_wallets_total_votes ON public.wallets(total_votes DESC);
CREATE INDEX idx_wallets_total_shares ON public.wallets(total_shares DESC);

-- Function to update species stats on vote
CREATE OR REPLACE FUNCTION public.increment_species_votes()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.species_stats (species_id, base_squares)
    VALUES (NEW.species_id, NEW.rating)
    ON CONFLICT (species_id) 
    DO UPDATE SET 
        base_squares = species_stats.base_squares + NEW.rating,
        updated_at = now();
    
    -- Update wallet total votes
    UPDATE public.wallets 
    SET total_votes = total_votes + 1, updated_at = now()
    WHERE address = NEW.wallet_address;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to update species stats on share
CREATE OR REPLACE FUNCTION public.increment_species_shares()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.species_stats (species_id, share_count)
    VALUES (NEW.species_id, 1)
    ON CONFLICT (species_id) 
    DO UPDATE SET 
        share_count = species_stats.share_count + 1,
        updated_at = now();
    
    -- Update wallet total shares
    UPDATE public.wallets 
    SET total_shares = total_shares + 1, updated_at = now()
    WHERE address = NEW.wallet_address;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to track species views
CREATE OR REPLACE FUNCTION public.track_species_view()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.species_stats 
    SET view_count = view_count + 1, last_viewed_at = now(), updated_at = now()
    WHERE species_id = NEW.species_id;
    
    IF NOT FOUND THEN
        INSERT INTO public.species_stats (species_id, view_count, last_viewed_at)
        VALUES (NEW.species_id, 1, now());
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Triggers
CREATE TRIGGER on_species_vote
    AFTER INSERT ON public.species_votes
    FOR EACH ROW EXECUTE FUNCTION public.increment_species_votes();

CREATE TRIGGER on_species_share
    AFTER INSERT ON public.species_shares
    FOR EACH ROW EXECUTE FUNCTION public.increment_species_shares();

CREATE TRIGGER on_species_view
    AFTER INSERT ON public.species_views
    FOR EACH ROW EXECUTE FUNCTION public.track_species_view();

-- Function to generate unique invite code
CREATE OR REPLACE FUNCTION public.generate_invite_code()
RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    result TEXT := '';
    i INTEGER;
BEGIN
    FOR i IN 1..8 LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::INTEGER, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;