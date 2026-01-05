import { ReactNode } from 'react';
import { OnchainKitProvider } from '@coinbase/onchainkit';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { base } from 'viem/chains';
import { coinbaseWallet } from 'wagmi/connectors';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const wagmiConfig = createConfig({
  chains: [base],
  connectors: [
    coinbaseWallet({
      appName: 'FyreApp 1',
    }),
  ],
  transports: {
    [base.id]: http(),
  },
});

const queryClient = new QueryClient();

interface OnchainProviderProps {
  children: ReactNode;
}

export function OnchainProvider({ children }: OnchainProviderProps) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <OnchainKitProvider
          chain={base}
          config={{
            appearance: {
              mode: 'auto',
              theme: 'default',
            },
          }}
        >
          {children}
        </OnchainKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
