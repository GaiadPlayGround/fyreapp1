import { createConfig, http } from 'wagmi';
import { base, mainnet } from 'wagmi/chains';
import { injected, walletConnect } from 'wagmi/connectors';

// WalletConnect Project ID - you may want to move this to env vars
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '';

export const config = createConfig({
  chains: [base, mainnet],
  connectors: [
    // Generic injected connector (catches MetaMask, Phantom, Coinbase, Rabby, Trust, etc.)
    // This works for all browser extension wallets
    injected({
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

