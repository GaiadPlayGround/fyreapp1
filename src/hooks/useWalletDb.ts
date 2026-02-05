import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useWalletDb = () => {
  const registerWallet = useCallback(async (address: string, invitedBy?: string) => {
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
  }, []);

  const getWalletByAddress = useCallback(async (address: string) => {
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
  }, []);

  const getWalletByInviteCode = useCallback(async (inviteCode: string) => {
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
  }, []);

  const getTaskCompletions = useCallback(async (walletAddress: string) => {
    try {
      const { data, error } = await supabase
        .from('task_completions')
        .select('task_id')
        .eq('wallet_address', walletAddress);

      if (error) throw error;
      return new Set(data?.map(t => t.task_id) || []);
    } catch (err) {
      console.error('Error getting task completions:', err);
      return new Set<string>();
    }
  }, []);

  const completeTask = useCallback(async (walletAddress: string, taskId: string, fyreKeysAwarded: number = 10) => {
    try {
      console.log('Completing task:', { walletAddress, taskId, fyreKeysAwarded });
      
      const { data, error } = await supabase
        .from('task_completions')
        .insert({
          wallet_address: walletAddress,
          task_id: taskId,
          fyre_keys_awarded: fyreKeysAwarded
        })
        .select()
        .single();

      if (error) {
        // If task already completed (unique constraint), fetch current fyre_keys and return success
        if (error.code === '23505') {
          console.log('Task already completed, fetching current fyre_keys');
          const { data: walletData } = await supabase
            .from('wallets')
            .select('fyre_keys')
            .eq('address', walletAddress)
            .maybeSingle();
          return { success: true, fyreKeys: walletData?.fyre_keys || 0, alreadyCompleted: true };
        }
        
        // Check if table doesn't exist (migration not applied)
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          console.error('Table task_completions does not exist. Migration may not be applied.');
          return { 
            success: false, 
            fyreKeys: 0, 
            error: 'Database migration not applied. Please apply the migration first.' 
          };
        }
        
        console.error('Error inserting task completion:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('Error details:', error.details);
        console.error('Error hint:', error.hint);
        throw error;
      }

      console.log('Task completion inserted successfully:', data);

      // Refresh wallet to get updated fyre_keys
      const { data: walletData, error: walletError } = await supabase
        .from('wallets')
        .select('fyre_keys')
        .eq('address', walletAddress)
        .maybeSingle();

      if (walletError) {
        console.error('Error fetching wallet after task completion:', walletError);
        // Still return success since the task was completed, just couldn't fetch fyre_keys
        return { success: true, fyreKeys: 0 };
      }

      console.log('Updated fyre_keys:', walletData?.fyre_keys);
      return { success: true, fyreKeys: walletData?.fyre_keys || 0 };
    } catch (err: any) {
      console.error('Error completing task:', err);
      console.error('Error details:', {
        message: err?.message,
        code: err?.code,
        details: err?.details,
        hint: err?.hint,
        name: err?.name
      });
      
      // Check for common database errors
      let errorMessage = 'Unknown error';
      if (err?.code === '42P01') {
        errorMessage = 'Database table does not exist. Please apply the migration.';
      } else if (err?.message) {
        errorMessage = err.message;
      }
      
      return { success: false, fyreKeys: 0, error: errorMessage };
    }
  }, []);

  const refreshFyreKeys = useCallback(async (walletAddress: string) => {
    try {
      const { data, error } = await supabase
        .from('wallets')
        .select('fyre_keys')
        .eq('address', walletAddress)
        .maybeSingle();

      if (error) throw error;
      return data?.fyre_keys || 0;
    } catch (err) {
      console.error('Error refreshing fyre keys:', err);
      return 0;
    }
  }, []);

  return {
    registerWallet,
    getWalletByAddress,
    getWalletByInviteCode,
    getTaskCompletions,
    completeTask,
    refreshFyreKeys
  };
};
