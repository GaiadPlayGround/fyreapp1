import { useAccount } from 'wagmi';
import { useName, useAvatar } from '@coinbase/onchainkit/identity';
import { base } from 'viem/chains';

export interface WalletIdentity {
  address: `0x${string}` | undefined;
  shortAddress: string;
  basename: string | null;
  avatar: string | null;
  isConnected: boolean;
  isLoading: boolean;
}

export const useWalletIdentity = (): WalletIdentity => {
  const { address, isConnected } = useAccount();

  // Get Basename
  const { data: basename, isLoading: nameLoading } = useName({
    address: address,
    chain: base,
  });

  // Get Avatar
  const { data: avatar, isLoading: avatarLoading } = useAvatar({
    ensName: basename || undefined,
    chain: base,
  });

  const shortAddress = address 
    ? `${address.slice(0, 6)}...${address.slice(-4)}` 
    : '';

  return {
    address,
    shortAddress,
    basename: basename || null,
    avatar: avatar || null,
    isConnected,
    isLoading: nameLoading || avatarLoading,
  };
};
