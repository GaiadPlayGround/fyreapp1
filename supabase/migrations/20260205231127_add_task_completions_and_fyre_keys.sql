-- Add fyre_keys column to wallets table
ALTER TABLE public.wallets 
ADD COLUMN IF NOT EXISTS fyre_keys INTEGER DEFAULT 0;

-- Create task_completions table to track completed tasks
CREATE TABLE IF NOT EXISTS public.task_completions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address TEXT NOT NULL,
    task_id TEXT NOT NULL,
    fyre_keys_awarded INTEGER DEFAULT 10,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(wallet_address, task_id)
);

-- Enable RLS on task_completions
ALTER TABLE public.task_completions ENABLE ROW LEVEL SECURITY;

-- Public read access for task completions (for checking completion status)
CREATE POLICY "Anyone can read task completions" ON public.task_completions FOR SELECT USING (true);
-- Users can insert their own task completions
CREATE POLICY "Anyone can insert task completions" ON public.task_completions FOR INSERT WITH CHECK (true);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_task_completions_wallet ON public.task_completions(wallet_address);
CREATE INDEX IF NOT EXISTS idx_task_completions_task ON public.task_completions(task_id);
CREATE INDEX IF NOT EXISTS idx_task_completions_wallet_task ON public.task_completions(wallet_address, task_id);

-- Function to award Fyre Keys when a task is completed
CREATE OR REPLACE FUNCTION public.award_task_fyre_keys()
RETURNS TRIGGER AS $$
BEGIN
    -- Award 10 Fyre Keys to the wallet when a task is completed
    UPDATE public.wallets 
    SET fyre_keys = COALESCE(fyre_keys, 0) + NEW.fyre_keys_awarded,
        updated_at = now()
    WHERE address = NEW.wallet_address;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to award Fyre Keys on task completion
CREATE TRIGGER on_task_completion
    AFTER INSERT ON public.task_completions
    FOR EACH ROW EXECUTE FUNCTION public.award_task_fyre_keys();

