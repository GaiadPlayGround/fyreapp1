import { useAccount, useBalance, useReadContracts } from 'wagmi';
import { erc20Abi } from 'viem';
import { base } from 'viem/chains';

// Token contract addresses on Base
const FCBCC_CONTRACT = '0x17d8d3c956a9b2d72257d7c9624cfcfd8ba8672b' as const;
const USDC_CONTRACT = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as const; // USDC on Base

export interface WalletBalances {
  ethBalance: string;
  usdcBalance: string;
  fcbccBalance: string;
  isLoading: boolean;
}

export const useWalletBalances = (): WalletBalances => {
  const { address, isConnected } = useAccount();

  // ETH balance
  const { data: ethData, isLoading: ethLoading } = useBalance({
    address: address,
    chainId: base.id,
  });

  // Read USDC and FCBCC balances
  const { data: tokenData, isLoading: tokenLoading } = useReadContracts({
    contracts: [
      {
        address: USDC_CONTRACT,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: address ? [address] : undefined,
        chainId: base.id,
      },
      {
        address: USDC_CONTRACT,
        abi: erc20Abi,
        functionName: 'decimals',
        chainId: base.id,
      },
      {
        address: FCBCC_CONTRACT,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: address ? [address] : undefined,
        chainId: base.id,
      },
      {
        address: FCBCC_CONTRACT,
        abi: erc20Abi,
        functionName: 'decimals',
        chainId: base.id,
      },
    ],
    query: {
      enabled: isConnected && !!address,
    },
  });

  const formatBalance = (balance: bigint | undefined, decimals: number): string => {
    if (!balance) return '0';
    const value = Number(balance) / Math.pow(10, decimals);
    if (value >= 1000000) return `${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(2)}K`;
    return value.toFixed(2);
  };

  const usdcBalance = tokenData?.[0]?.result as bigint | undefined;
  const usdcDecimals = (tokenData?.[1]?.result as number) || 6;
  const fcbccBalance = tokenData?.[2]?.result as bigint | undefined;
  const fcbccDecimals = (tokenData?.[3]?.result as number) || 18;

  const formatEthBalance = (balance: { value: bigint; decimals: number } | undefined): string => {
    if (!balance) return '0';
    const value = Number(balance.value) / Math.pow(10, balance.decimals);
    return value.toFixed(4);
  };

  return {
    ethBalance: formatEthBalance(ethData),
    usdcBalance: formatBalance(usdcBalance, usdcDecimals),
    fcbccBalance: formatBalance(fcbccBalance, fcbccDecimals),
    isLoading: ethLoading || tokenLoading,
  };
};
