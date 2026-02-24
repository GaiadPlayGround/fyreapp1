import { createPublicClient, http, isAddress, getAddress } from 'viem';
import { base, mainnet } from 'viem/chains';

// Known address mappings (contracts, pools, etc.)
const KNOWN_ADDRESSES: Record<string, string> = {
  '0x498581ff718922c3f8e6a244956af099b2652b2b': 'Uniswap V4: Pool Manager',
  '0xae28916f0bc703fccbaf9502d15f838a1caa01b3': 'Warplette',
};

// Create public clients for both chains
const baseClient = createPublicClient({
  chain: base,
  transport: http(),
});

const mainnetClient = createPublicClient({
  chain: mainnet,
  transport: http(),
});

/**
 * Resolves a Base name (e.g., name.base.eth) to an address
 * Base names use ENS infrastructure on Base chain
 */
async function resolveBaseName(name: string): Promise<string | null> {
  try {
    // Base names typically end with .base.eth
    if (!name.endsWith('.base.eth')) {
      return null;
    }

    // Try to resolve using Base chain ENS resolver
    try {
      const address = await baseClient.getEnsAddress({
        name: name.toLowerCase(),
      });
      if (address && isAddress(address)) {
        return address.toLowerCase();
      }
    } catch (ensError) {
      // If Base chain doesn't support ENS directly, try alternative API
      console.debug('Base ENS resolver failed, trying API:', ensError);
    }

    // Fallback: Try Base Name API if available
    try {
      const response = await fetch(`https://api.basename.org/v1/name/${name.toLowerCase()}`, {
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });
      if (response.ok) {
        const data = await response.json();
        if (data.address && isAddress(data.address)) {
          return data.address.toLowerCase();
        }
      }
    } catch (apiError) {
      console.debug('Base name API lookup failed:', apiError);
    }
  } catch (error) {
    console.debug('Error resolving Base name:', error);
  }
  return null;
}

/**
 * Resolves an ENS name (e.g., name.eth) to an address
 */
async function resolveENSName(name: string): Promise<string | null> {
  try {
    if (!name.endsWith('.eth')) {
      return null;
    }

    // Use viem's built-in ENS resolver on mainnet
    const address = await mainnetClient.getEnsAddress({
      name: name.toLowerCase(),
    });

    return address ? address.toLowerCase() : null;
  } catch (error) {
    console.debug('Error resolving ENS name:', error);
    return null;
  }
}

/**
 * Performs reverse lookup to get the primary name for an address
 * Priority: Base name > ENS name
 */
export async function getPrimaryName(address: string): Promise<{
  name: string;
  type: 'base' | 'ens' | null;
}> {
  if (!address || !isAddress(address)) {
    return { name: '', type: null };
  }

  const normalizedAddress = address.toLowerCase();

  try {
    // Try Base name reverse lookup first (priority)
    try {
      // Try Base chain ENS reverse lookup
      try {
        const baseName = await baseClient.getEnsName({
          address: normalizedAddress as `0x${string}`,
        });

        if (baseName && baseName.endsWith('.base.eth')) {
          // Verify forward resolution
          const resolvedAddr = await resolveBaseName(baseName);
          if (resolvedAddr === normalizedAddress) {
            return { name: baseName, type: 'base' };
          }
        }
      } catch (ensError) {
        console.debug('Base ENS reverse lookup failed, trying API:', ensError);
      }

      // Fallback: Try Base Name API
      try {
        const response = await fetch(`https://api.basename.org/v1/address/${normalizedAddress}`, {
          signal: AbortSignal.timeout(5000), // 5 second timeout
        });
        if (response.ok) {
          const data = await response.json();
          if (data.name && data.name.endsWith('.base.eth')) {
            // Verify forward resolution
            const resolvedAddr = await resolveBaseName(data.name);
            if (resolvedAddr === normalizedAddress) {
              return { name: data.name, type: 'base' };
            }
          }
        }
      } catch (apiError) {
        console.debug('Base name API lookup failed:', apiError);
      }
    } catch (error) {
      // Base name lookup failed, continue to ENS
      console.debug('Base name lookup failed:', error);
    }

    // Try ENS reverse lookup on mainnet
    try {
      const ensName = await mainnetClient.getEnsName({
        address: normalizedAddress as `0x${string}`,
      });

      if (ensName && ensName.endsWith('.eth') && !ensName.endsWith('.base.eth')) {
        // Verify forward resolution
        const resolvedAddr = await resolveENSName(ensName);
        if (resolvedAddr === normalizedAddress) {
          return { name: ensName, type: 'ens' };
        }
      }
    } catch (error) {
      console.debug('ENS lookup failed:', error);
    }
  } catch (error) {
    console.error('Error in getPrimaryName:', error);
  }

  return { name: '', type: null };
}

/**
 * Gets known address name synchronously (for contracts, pools, etc.)
 */
export function getKnownAddressName(address: string | null): string | null {
  if (!address) return null;
  const normalizedAddress = address.toLowerCase();
  return KNOWN_ADDRESSES[normalizedAddress] || null;
}

/**
 * Formats an address for display (truncated)
 */
export function formatAddressForDisplay(address: string): string {
  if (!address || !isAddress(address)) {
    return '';
  }
  try {
    // Get checksummed address
    const checksummed = getAddress(address);
    // Return truncated format: 0x1234...5678
    return `${checksummed.slice(0, 6)}...${checksummed.slice(-4)}`;
  } catch (error) {
    // Fallback to simple truncation if getAddress fails
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }
}

/**
 * Gets display name with priority: Known address > Base name > ENS name > truncated address
 */
export async function getDisplayName(address: string | null): Promise<{
  displayName: string;
  type: 'base' | 'ens' | 'address';
}> {
  if (!address) {
    return { displayName: 'Not Connected', type: 'address' };
  }

  const normalizedAddress = address.toLowerCase();
  
  // Check known addresses first (highest priority)
  if (KNOWN_ADDRESSES[normalizedAddress]) {
    return {
      displayName: KNOWN_ADDRESSES[normalizedAddress],
      type: 'address', // Treat as address type but with custom label
    };
  }

  const primaryName = await getPrimaryName(address);
  
  if (primaryName.name) {
    return {
      displayName: primaryName.name,
      type: primaryName.type || 'ens',
    };
  }

  return {
    displayName: formatAddressForDisplay(address),
    type: 'address',
  };
}

