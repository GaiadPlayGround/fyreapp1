import { ReactNode } from 'react';
import { OnchainKitProvider } from '@coinbase/onchainkit';
import { base } from 'viem/chains';

interface OnchainProviderProps {
  children: ReactNode;
}

export function OnchainProvider({ children }: OnchainProviderProps) {
  return (
    <OnchainKitProvider
      chain={base}
      config={{
        appearance: {
          mode: 'auto',
          theme: 'default',
          name: 'FyreApp 1',
        },
        wallet: {
          display: 'modal',
          preference: 'all',
        },
      }}
    >
      {children}
    </OnchainKitProvider>
  );
}
