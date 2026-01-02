import { supabase } from '@/integrations/supabase/client';

export const useWalletDb = () => {
  const registerWallet = async (address: string, invitedBy?: string) => {
    try {
      // Check if wallet already exists
      const { data: existing } = await supabase
        .from('wallets')
        .select('*')
        .eq('address', address)
        .maybeSingle();

      if (existing) {
        return existing;
      }

      // Generate invite code
      const { data: codeData } = await supabase.rpc('generate_invite_code');
      const inviteCode = codeData || `INV${Date.now().toString(36).toUpperCase()}`;

      // Insert new wallet
      const { data, error } = await supabase
        .from('wallets')
        .insert({
          address,
          invite_code: inviteCode,
          invited_by: invitedBy || null,
          total_votes: 0,
          total_shares: 0
        })
        .select()
        .single();

      if (error) {
        console.error('Error registering wallet:', error);
        // If invite code collision, try with timestamp-based code
        if (error.code === '23505') {
          const fallbackCode = `INV${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
          const { data: retryData, error: retryError } = await supabase
            .from('wallets')
            .insert({
              address,
              invite_code: fallbackCode,
              invited_by: invitedBy || null,
              total_votes: 0,
              total_shares: 0
            })
            .select()
            .single();
          
          if (retryError) throw retryError;
          return retryData;
        }
        throw error;
      }

      return data;
    } catch (err) {
      console.error('Error in registerWallet:', err);
      return null;
    }
  };

  const getWalletByAddress = async (address: string) => {
    try {
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('address', address)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error getting wallet:', err);
      return null;
    }
  };

  const getWalletByInviteCode = async (inviteCode: string) => {
    try {
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('invite_code', inviteCode)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error getting wallet by invite code:', err);
      return null;
    }
  };

  return {
    registerWallet,
    getWalletByAddress,
    getWalletByInviteCode
  };
};
