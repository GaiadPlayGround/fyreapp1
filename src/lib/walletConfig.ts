import { createConfig, http } from 'wagmi';
import { base, mainnet } from 'wagmi/chains';
import { injected, walletConnect } from 'wagmi/connectors';

// WalletConnect Project ID - you may want to move this to env vars
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '';

export const config = createConfig({
  chains: [base, mainnet],
  connectors: [
    injected({
      // Disable auto-connect - only connect when user explicitly clicks
      shimDisconnect: true,
    }),
    ...(projectId ? [walletConnect({ projectId })] : []),
  ],
  transports: {
    [base.id]: http(),
    [mainnet.id]: http(),
  },
  ssr: false, // Disable SSR to prevent auto-connect on page load
});

