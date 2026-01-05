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
        },
      }}
    >
      {children}
    </OnchainKitProvider>
  );
}
