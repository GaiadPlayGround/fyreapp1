import { useEffect, useState, useCallback, useRef } from 'react';
import { ArrowLeft, Info, ChevronLeft, ChevronRight, Share2, ExternalLink, Volume2, VolumeX, Pause, Play, X, MousePointerClick, Copy, Check } from 'lucide-react';
import { Species, getStatusColor, getStatusLabel } from '@/data/species';
import { cn } from '@/lib/utils';
import VoteSquares from './VoteSquares';
import ShareButtons from './ShareButtons';
import SlideshowControls from './SlideshowControls';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { useElevenLabsVoice, ELEVENLABS_VOICES } from '@/hooks/useElevenLabsVoice';
import { useSpeciesStats } from '@/hooks/useSpeciesStats';
import { useWallet } from '@/contexts/WalletContext';
import { toast } from '@/hooks/use-toast';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, usePublicClient, useSwitchChain, useReadContract } from 'wagmi';
import { createWalletClient, custom } from 'viem';
import { parseUnits, formatUnits, Address, erc20Abi } from 'viem';
import { base } from 'wagmi/chains';
import { setApiKey, tradeCoin } from '@zoralabs/coins-sdk';
import { usePaymentSettings } from './PaymentSettings';
import { AdaptiveBackdrop } from './AdaptiveBackdrop';
import BuyDnaPopup from './BuyDnaPopup';

// Trigger haptic feedback on mobile
const triggerHaptic = () => {
  if ('vibrate' in navigator) {
    navigator.vibrate(10);
  }
};

// Quick buy button component with long press and double-tap for popup
const BuyDnaButton = ({ 
  onClick,
  onLongPress,
}: { 
  onClick: () => void;
  onLongPress: () => void;
}) => {
  const { currency, amount } = usePaymentSettings();
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastTapTimeRef = useRef<number>(0);
  const longPressTriggeredRef = useRef(false);
  
  const handlePressStart = () => {
    longPressTriggeredRef.current = false;
    longPressTimerRef.current = setTimeout(() => {
      longPressTriggeredRef.current = true;
      triggerHaptic(); // Haptic on long press
      onLongPress();
    }, 500); // 500ms long press
  };
  
  const handlePressEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleClick = () => {
    if (longPressTriggeredRef.current) return; // Ignore click after long press
    
    const now = Date.now();
    const timeSinceLastTap = now - lastTapTimeRef.current;
    
    if (timeSinceLastTap < 300 && timeSinceLastTap > 0) {
      // Double-tap detected - open popup (same as long press)
      triggerHaptic();
      onLongPress();
      lastTapTimeRef.current = 0;
    } else {
      lastTapTimeRef.current = now;
      onClick();
    }
  };
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className="relative w-full p-[2px] rounded-full animate-pulse shadow-[0_0_15px_rgba(168,85,247,0.4),0_0_30px_rgba(236,72,153,0.3),0_0_45px_rgba(59,130,246,0.2)]"
            style={{
              background: 'linear-gradient(to right, #a855f7, #ec4899, #3b82f6, #06b6d4)'
            }}
          >
            <button
              onClick={handleClick}
              onMouseDown={handlePressStart}
              onMouseUp={handlePressEnd}
              onMouseLeave={handlePressEnd}
              onTouchStart={handlePressStart}
              onTouchEnd={handlePressEnd}
              className="relative px-3 py-1.5 bg-[#8b8b8b] w-full backdrop-blur-sm rounded-full hover:bg-[#8b8b8bde] transition-colors text-xs font-sans text-card"
            >
              Buy DNA
            </button>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>Tap to buy ${amount} {currency} • Double-tap or long press to change</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

interface SpeciesSlideshowProps {
  species: Species[];
  initialIndex: number;
  onClose: () => void;
}

// Analyze image brightness (simplified - assumes animal images are typically darker on edges)
const getTextColorForBackground = (brightness: 'light' | 'dark' = 'dark') => {
  return brightness === 'light' ? 'text-black' : 'text-white';
};

const CONTRACT_ADDRESS = '0x17d8d3c956a9b2d72257d7c9624cfcfd8ba8672b';

type PaymentCurrency = 'USDC' | 'ETH';

const SpeciesSlideshow = ({ 
  species, 
  initialIndex, 
  onClose
}: SpeciesSlideshowProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [showInfo, setShowInfo] = useState(false);
  const [showArrows, setShowArrows] = useState(true);
  const [showShare, setShowShare] = useState(false);
  // Defaults: 3 seconds timer but paused
  const [autoPlayInterval, setAutoPlayInterval] = useState<number | null>(3);
  const [isPaused, setIsPaused] = useState(true);
  const [voteKey, setVoteKey] = useState(0);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [showVoiceSelector, setShowVoiceSelector] = useState(false);
  const [iconsVisible, setIconsVisible] = useState(true);
  const [arrowsHoverActive, setArrowsHoverActive] = useState(false);
  const [contractCopied, setContractCopied] = useState(false);
  const [speciesContractCopied, setSpeciesContractCopied] = useState(false);
  const [showBuyPopup, setShowBuyPopup] = useState(false);
  
  const arrowHideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);
  const idleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartRef = useRef<number | null>(null);
  const touchEndRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastTapRef = useRef<number>(0);
  const wasPausedBeforeTxRef = useRef<boolean>(true);

  const currentSpecies = species[currentIndex];
  const { speakSpeciesName, stopSpeaking, voices, selectedVoice, setSelectedVoice, isLoading: voiceLoading, useFallback } = useElevenLabsVoice();
  const { recordView } = useSpeciesStats();
  const { address, isConnected, usdcBalance, connect } = useWallet();
  const { address: wagmiAddress, connector, chainId } = useAccount();
  const { currency: paymentCurrency, amount: quickBuyAmount } = usePaymentSettings();
  const publicClient = usePublicClient();
  const { switchChain } = useSwitchChain();
  const { writeContract, data: hash, isPending: isBuying } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  console.log('current species', currentSpecies);
  // Set Zora API key if available (optional but recommended)
  useEffect(() => {
    const zoraApiKey = import.meta.env.VITE_ZORA_API_KEY;
    if (zoraApiKey) {
      setApiKey(zoraApiKey);
    }
  }, []);

  const copyContractAddress = () => {
    navigator.clipboard.writeText(CONTRACT_ADDRESS);
    setContractCopied(true);
    toast({
      title: "Copied!",
      description: "Creator contract address copied to clipboard",
      duration: 1500,
    });
    setTimeout(() => setContractCopied(false), 2000);
  };

  const copySpeciesContractAddress = () => {
    if (currentSpecies.tokenAddress) {
      navigator.clipboard.writeText(currentSpecies.tokenAddress);
      setSpeciesContractCopied(true);
      toast({
        title: "Copied!",
        description: "Species contract address copied to clipboard",
        duration: 1500,
      });
      setTimeout(() => setSpeciesContractCopied(false), 2000);
    }
  };

  const handleDoubleTap = async () => {
    // Pause slideshow when attempting to buy
    wasPausedBeforeTxRef.current = isPaused;
    setIsPaused(true);
    
    if (!isConnected || !wagmiAddress) {
      // Auto-connect wallet
      connect();
      toast({
        title: "Connecting Wallet...",
        description: "Please approve the connection to buy DNA tokens.",
        duration: 2000,
      });
      setIsPaused(wasPausedBeforeTxRef.current);
      return;
    }

    // Check if species has token address (ERC-20 coin address from Zora)
    // Each DNA species has its own unique tokenAddress from the API
    if (!currentSpecies.tokenAddress) {
      toast({
        title: "Token Not Available",
        description: `${currentSpecies.name} token address not found. This species may not be on-chain yet.`,
        variant: "destructive",
      });
      return;
    }

    // We use USDC for purchases, so no need to check poolCurrencyToken

    // Check if tradable - if tokenAddress exists, it should be tradable
    const isTradable = currentSpecies.tradable !== false && currentSpecies.tokenAddress;
    if (!isTradable) {
      toast({
        title: "Not Tradable",
        description: "This token is not currently available for trading.",
        variant: "destructive",
      });
      return;
    }

    if (isBuying || isConfirming) {
      return; // Already processing
    }

    try {
      setIsPaused(true);
      
      // Use the tokenAddress from API - this is the ERC-20 coin address for this specific species
      // Each DNA species has its own unique tokenAddress (e.g., 0x73f71321ceb926c189332bb0f1b334858a27a36d)
      const tokenAddress = currentSpecies.tokenAddress as Address;
      
      // Payment token addresses on Base
      const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as Address;
      const USDC_DECIMALS = 6;
      const WETH_ADDRESS = '0x4200000000000000000000000000000000000006' as Address; // Wrapped ETH on Base
      const ETH_DECIMALS = 18;
      
      // Determine currency based on user selection - read FRESH from localStorage
      // to avoid stale hook values when Buy DNA popup changes settings
      const freshCurrency = (localStorage.getItem('fyreapp-payment-currency') || paymentCurrency) as 'USDC' | 'ETH';
      const freshAmount = parseFloat(localStorage.getItem('fyreapp-quick-buy-amount') || quickBuyAmount.toString());
      
      const currencyTokenAddress = freshCurrency === 'ETH' ? WETH_ADDRESS : USDC_ADDRESS;
      const currencyDecimals = freshCurrency === 'ETH' ? ETH_DECIMALS : USDC_DECIMALS;
      
      // Validate addresses are properly formatted
      if (!tokenAddress || !tokenAddress.startsWith('0x') || tokenAddress.length !== 42) {
        throw new Error(`Invalid token address: ${tokenAddress}`);
      }
      
      // Amount to swap: user-selected amount worth of selected currency
      // We always work in USD, only convert to ETH when user wants to pay in ETH
      const swapAmountUSD = freshAmount;
      
      let swapAmount: bigint;
      if (freshCurrency === 'ETH') {
        // Fetch real ETH price for transaction conversion
        const ethPriceResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
        const ethPriceData = await ethPriceResponse.json();
        const ethPrice = ethPriceData.ethereum?.usd || 3000; // Fallback to 3000 if API fails
        
        // Convert USD to ETH: swapAmountUSD / ethPrice
        const ethAmount = swapAmountUSD / ethPrice;
        swapAmount = parseUnits(ethAmount.toFixed(6), currencyDecimals);
      } else {
        // For USDC, use USD amount directly
        swapAmount = parseUnits(swapAmountUSD.toString(), currencyDecimals);
      }
      
      // Check user's balance before attempting trade
      console.log('=== BALANCE CHECK ===');
      console.log('Wallet address:', wagmiAddress);
      console.log('Currency:', freshCurrency);
      console.log('Currency address:', currencyTokenAddress);
      console.log('Swap amount:', swapAmount.toString());
      console.log('Swap amount (formatted):', formatUnits(swapAmount, currencyDecimals));
      
      try {
        if (publicClient && wagmiAddress) {
          let balance: bigint;
          
          if (freshCurrency === 'ETH') {
            // For native ETH, get balance directly
            balance = await publicClient.getBalance({ address: wagmiAddress as Address });
          } else {
            // For ERC-20 tokens (USDC), use readContract
            balance = (await publicClient.readContract({
              address: currencyTokenAddress,
              abi: erc20Abi,
              functionName: 'balanceOf',
              args: [wagmiAddress as Address],
            } as any)) as bigint;
          }

          const balanceFormatted = parseFloat(formatUnits(balance, currencyDecimals));
          const requiredFormatted = parseFloat(formatUnits(swapAmount, currencyDecimals));
          
          console.log('Balance (raw):', balance.toString());
          console.log('Balance (formatted):', balanceFormatted);
          console.log('Required (formatted):', requiredFormatted);
          console.log('Has enough?', balance >= swapAmount);
          
          if (balance < swapAmount) {
            toast({
              title: "Insufficient Balance",
              description: `You need at least ${requiredFormatted.toFixed(6)} ${freshCurrency}. Your current balance is ${balanceFormatted.toFixed(6)} ${freshCurrency}.`,
              variant: "destructive",
            });
            return;
          }
        }
      } catch (balanceError) {
        console.error('Balance check error:', balanceError);
        console.warn('Could not check balance:', balanceError);
        // Continue anyway - the transaction will fail with a better error if balance is insufficient
      }
      console.log('=== END BALANCE CHECK ===');
      
      toast({
        title: "Preparing Purchase...",
        description: "Generating transaction...",
        duration: 2000,
      });

      // Use Zora Coins SDK to execute trade
      // This will handle approvals and swap in one transaction
      if (!publicClient || !wagmiAddress || !connector) {
        throw new Error('Wallet not properly connected');
      }

      // Check if wallet is on the correct chain (Base)
      if (chainId !== base.id) {
        toast({
          title: "Switching Network",
          description: "Please switch to Base network to continue",
          duration: 2000,
        });
        
        try {
          await switchChain({ chainId: base.id });
          // Wait a bit for chain switch to complete
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (switchError: any) {
          if (switchError?.code === 4902 || switchError?.name === 'UserRejectedRequestError') {
            // User rejected chain switch
            toast({
              title: "Network Switch Required",
              description: "Please switch to Base network in your wallet to buy DNA tokens",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Network Switch Failed",
              description: switchError?.message || "Failed to switch to Base network",
              variant: "destructive",
            });
          }
          return;
        }
      }

      // Create wallet client from connector
      const provider = await connector.getProvider();
      if (!provider) {
        throw new Error('Provider not available');
      }
      const walletClient = createWalletClient({
        chain: base,
        transport: custom(provider as any),
        account: wagmiAddress as Address,
      });

      // Execute the trade using Zora SDK in a single transaction
      // The SDK uses Permit2 signatures which allow approval + trade in one transaction
      // No separate approval needed - Permit2 signature handles it all
      toast({
        title: "Preparing Purchase",
        description: "This will complete in one transaction",
        duration: 2000,
      });

      try {
        // The tradeCoin function uses Permit2 signatures for a single transaction
        // It handles approval + trade in one transaction using Permit2
        toast({
          title: "Confirm Purchase",
          description: "Please confirm the transaction in your wallet",
          duration: 3000,
        });

        // Execute the trade - SDK handles Permit2 signature creation and execution
        // For native ETH, we need to handle it differently
        // Zora SDK supports native ETH via 'eth' type
        const result = await tradeCoin({
          tradeParameters: {
            sell: freshCurrency === 'ETH'
              ? { type: 'eth' as const }
              : {
                  type: 'erc20',
                  address: currencyTokenAddress,
                },
            buy: {
              type: 'erc20',
              address: tokenAddress,
            },
            amountIn: swapAmount,
            sender: wagmiAddress as Address,
            slippage: 0.5, // 0.5% slippage tolerance
          },
          walletClient: walletClient,
          account: wagmiAddress as Address,
          publicClient: publicClient as any, // Zora SDK expects GenericPublicClient
        });

        // tradeCoin may return a hash or receipt - check what we got
        let transactionHash: string | undefined;
        if (typeof result === 'string') {
          transactionHash = result;
        } else if (result?.transactionHash) {
          transactionHash = result.transactionHash;
        } else if (result?.hash) {
          transactionHash = result.hash;
        }

        if (!transactionHash) {
          throw new Error('Transaction failed - no transaction hash received');
        }

        // Wait for transaction confirmation
        toast({
          title: "Transaction Submitted",
          description: "Waiting for confirmation...",
          duration: 2000,
        });

        // Wait for the transaction to be confirmed
        const receipt = await publicClient.waitForTransactionReceipt({
          hash: transactionHash as `0x${string}`,
          timeout: 120_000, // 2 minute timeout
        });

        if (receipt.status === 'reverted') {
          throw new Error('Transaction was reverted');
        }

        toast({
          title: "Purchase Successful!",
          description: "Your DNA tokens have been purchased",
          duration: 3000,
        });
        
        triggerHaptic();
      } catch (tradeError: any) {
        // Log the FULL error for debugging
        console.error('=== FULL TRADE ERROR ===');
        console.error('Error object:', tradeError);
        console.error('Error type:', typeof tradeError);
        console.error('Error constructor:', tradeError?.constructor?.name);
        console.error('Error name:', tradeError?.name);
        console.error('Error code:', tradeError?.code);
        console.error('Error message:', tradeError?.message);
        console.error('Error shortMessage:', tradeError?.shortMessage);
        console.error('Error details:', tradeError?.details);
        console.error('Error cause:', tradeError?.cause);
        console.error('Error error:', tradeError?.error);
        console.error('Error stack:', tradeError?.stack);
        console.error('Error stringified:', JSON.stringify(tradeError, null, 2));
        console.error('Error keys:', Object.keys(tradeError || {}));
        console.error('Error values:', Object.values(tradeError || {}));
        console.error('=== END ERROR LOG ===');

        // Handle user rejection gracefully
        if (tradeError?.name === 'UserRejectedRequestError' || 
            tradeError?.code === 4001 ||
            tradeError?.message?.toLowerCase().includes('user rejected') ||
            tradeError?.message?.toLowerCase().includes('user denied')) {
          toast({
            title: "Transaction Cancelled",
            description: "You cancelled the transaction. No tokens were purchased.",
            variant: "destructive",
          });
          return;
        }

        // Extract error message for user-friendly display
        let errorTitle = "Purchase Failed";
        let errorMessage = "Please try again.";

        const errorString = JSON.stringify(tradeError).toLowerCase();
        const errorMessageLower = (tradeError?.message || '').toLowerCase();
        const errorDetails = (tradeError?.details || '').toLowerCase();
        const shortMessage = (tradeError?.shortMessage || '').toLowerCase();

        // Check for specific error types
        if (errorString.includes('transfer_from_failed') ||
            errorMessageLower.includes('transfer_from_failed') ||
            errorDetails.includes('transfer_from_failed')) {
          errorTitle = "Insufficient Balance";
          errorMessage = `You don't have enough ${freshCurrency}. Please ensure you have at least $${freshAmount} ${freshCurrency} in your wallet.`;
        } else if (errorString.includes('insufficient') || 
                   errorMessageLower.includes('insufficient') ||
                   errorMessageLower.includes('insufficient balance')) {
          errorTitle = "Insufficient Balance";
          errorMessage = "You don't have enough USDC to complete this purchase. Please check your wallet balance.";
        } else if (errorString.includes('slippage') || 
                   errorMessageLower.includes('slippage') ||
                   errorMessageLower.includes('price changed')) {
          errorTitle = "Price Changed";
          errorMessage = "The token price changed during the transaction. Please try again.";
        } else if (errorString.includes('network') || 
                   errorMessageLower.includes('network') ||
                   errorMessageLower.includes('connection')) {
          errorTitle = "Network Error";
          errorMessage = "Network error occurred. Please check your connection and try again.";
        } else if (shortMessage) {
          errorMessage = shortMessage;
        } else if (tradeError?.message) {
          errorMessage = tradeError.message;
        } else if (tradeError?.error?.message) {
          errorMessage = tradeError.error.message;
        }

        toast({
          title: errorTitle,
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }
    } catch (error: any) {
      // This catch handles any errors outside the tradeCoin call
      let errorTitle = "Purchase Failed";
      let errorMessage = "Please try again.";

      if (error?.name === 'UserRejectedRequestError' || error?.code === 4001) {
        errorTitle = "Transaction Cancelled";
        errorMessage = "You cancelled the transaction. No tokens were purchased.";
      } else if (error?.message) {
        errorMessage = error.message;
      }

      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsPaused(wasPausedBeforeTxRef.current);
    }
  };

  // Reset idle timer on any interaction
  const resetIdleTimer = useCallback(() => {
    setIconsVisible(true);
    if (idleTimeoutRef.current) {
      clearTimeout(idleTimeoutRef.current);
    }
    idleTimeoutRef.current = setTimeout(() => {
      if (!showInfo) {
        setIconsVisible(false);
      }
    }, 15000);
  }, [showInfo]);

  // Speak species name when voice is enabled and slide changes
  useEffect(() => {
    if (voiceEnabled && currentSpecies) {
      speakSpeciesName(currentSpecies.name);
    }
  }, [currentIndex, voiceEnabled, currentSpecies, speakSpeciesName]);

  // Record view when species changes
  useEffect(() => {
    if (currentSpecies) {
      recordView(currentSpecies.id, address || undefined);
    }
  }, [currentSpecies?.id, address, recordView]);

  // Stop speaking when voice is disabled
  useEffect(() => {
    if (!voiceEnabled) {
      stopSpeaking();
    }
  }, [voiceEnabled, stopSpeaking]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = e.targetTouches[0].clientX;
    showArrowsTemporarily();
    resetIdleTimer();
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartRef.current || !touchEndRef.current) return;
    
    const distance = touchStartRef.current - touchEndRef.current;
    const minSwipeDistance = 50;

    // Check for double-tap (if swipe distance is small, it might be a tap)
    if (Math.abs(distance) < 10) {
      const now = Date.now();
      const timeSinceLastTap = now - lastTapRef.current;
      
      if (timeSinceLastTap < 300 && timeSinceLastTap > 0) {
        // Double-tap detected
        handleDoubleTap();
        lastTapRef.current = 0; // Reset to prevent triple-tap
        touchStartRef.current = null;
        touchEndRef.current = null;
        return;
      }
      
      lastTapRef.current = now;
    }

    if (Math.abs(distance) > minSwipeDistance) {
      if (distance > 0) {
        navigate('next');
      } else {
        navigate('prev');
      }
    }

    touchStartRef.current = null;
    touchEndRef.current = null;
  };

  const showArrowsTemporarily = useCallback(() => {
    setShowArrows(true);
    if (arrowHideTimeoutRef.current) {
      clearTimeout(arrowHideTimeoutRef.current);
    }
    arrowHideTimeoutRef.current = setTimeout(() => {
      if (!arrowsHoverActive) {
        setShowArrows(false);
      }
    }, 3000);
  }, [arrowsHoverActive]);

  const navigate = useCallback((direction: 'prev' | 'next') => {
    setCurrentIndex((prev) => {
      if (direction === 'next') {
        return (prev + 1) % species.length;
      }
      return prev === 0 ? species.length - 1 : prev - 1;
    });
    setVoteKey((k) => k + 1);
    showArrowsTemporarily();
    resetIdleTimer();
  }, [species.length, showArrowsTemporarily, resetIdleTimer]);

  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setShowInfo(false);
      resetIdleTimer();
    }
  };

  const handleIconClick = (callback: () => void) => {
    triggerHaptic();
    callback();
    resetIdleTimer();
  };

  // Auto-play effect
  useEffect(() => {
    if (autoPlayInterval !== null && !isPaused) {
      autoPlayRef.current = setInterval(() => {
        navigate('next');
      }, autoPlayInterval * 1000);
    }

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [autoPlayInterval, isPaused, navigate]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') navigate('prev');
      if (e.key === 'ArrowRight') navigate('next');
      if (e.key === 'Escape') onClose();
      if (e.key === 'i') setShowInfo((v) => !v);
      if (e.key === ' ') {
        e.preventDefault();
        setIsPaused((p) => !p);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, onClose]);

  // Initial arrow hide and idle timer setup
  useEffect(() => {
    showArrowsTemporarily();
    resetIdleTimer();
    return () => {
      if (arrowHideTimeoutRef.current) clearTimeout(arrowHideTimeoutRef.current);
      if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
    };
  }, [showArrowsTemporarily, resetIdleTimer]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
      stopSpeaking();
    };
  }, [stopSpeaking]);

  // Mouse move on edges for arrows
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const container = containerRef.current;
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    const edgeThreshold = 100;
    const x = e.clientX - rect.left;
    
    if (x < edgeThreshold || x > rect.width - edgeThreshold) {
      setArrowsHoverActive(true);
      setShowArrows(true);
    } else {
      setArrowsHoverActive(false);
    }
    
    resetIdleTimer();
  }, [resetIdleTimer]);

  const truncateDescription = (text: string, maxWords: number = 50) => {
    const words = text.split(' ');
    if (words.length <= maxWords) return text;
    return words.slice(0, maxWords).join(' ') + '...';
  };

  const getFcbcUrl = () => {
    // Build URL using symbol and code from species data
    const speciesSymbol = currentSpecies.symbol || `FCBC${currentSpecies.id.replace(/\D/g, '')}`;
    const speciesCode = (currentSpecies as any).code || `${currentSpecies.id.replace(/\D/g, '')}0/12345678`;
    return `https://www.fcbc.fun/species/${speciesSymbol}?code=${speciesCode}`;
  };

  // Dynamic text color (guardrail based on backdrop luminance)
  const infoTextColor = 'text-white';
  const infoTextColorMuted = 'text-white/80';

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-50 bg-foreground"
      onMouseMove={handleMouseMove}
      onClick={() => resetIdleTimer()}
    >
      {/* Adaptive full-screen backdrop + main image (object-contain) */}
      <AdaptiveBackdrop imageSrc={currentSpecies.image}>
        {() => (
          <div
            className="absolute inset-0"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onClick={handleBackgroundClick}
            onDoubleClick={handleDoubleTap}
          >
            <img
              src={currentSpecies.image}
              alt={currentSpecies.name}
              className="w-full h-full object-contain gallery-transition"
              draggable={false}
            />
            {/* keep the existing overlay so UI/popups remain unchanged */}
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-transparent to-foreground/30" />
          </div>
        )}
      </AdaptiveBackdrop>

      {/* Top bar - Back arrow, Pause (left) and Info/Voice (right) */}
      <TooltipProvider>
        <div className={cn(
          "absolute top-0 left-0 right-0 p-4 flex items-center justify-between safe-area-top z-10 transition-opacity duration-300",
          iconsVisible ? "opacity-100" : "opacity-0 pointer-events-none"
        )}>
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => handleIconClick(onClose)}
                  className="p-2 bg-card/10 backdrop-blur-sm rounded-full hover:bg-card/20 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-card" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Back to gallery</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => handleIconClick(() => setIsPaused(!isPaused))}
                  className={cn(
                    "p-2 backdrop-blur-sm rounded-full transition-colors",
                    isPaused ? "bg-primary/30" : "bg-card/10 hover:bg-card/20"
                  )}
                >
                  {isPaused ? (
                    <Play className="w-5 h-5 text-card" />
                  ) : (
                    <Pause className="w-5 h-5 text-card" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>{isPaused ? 'Resume slideshow' : 'Pause slideshow'}</p>
              </TooltipContent>
            </Tooltip>
          </div>
          
          <div className="flex items-center gap-2 relative">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => handleIconClick(() => {
                    if (!voiceEnabled) {
                      setVoiceEnabled(true);
                      setShowVoiceSelector(true);
                    } else {
                      setShowVoiceSelector(!showVoiceSelector);
                    }
                  })}
                  className={cn(
                    "p-2 backdrop-blur-sm rounded-full transition-colors",
                    voiceEnabled ? "bg-primary/30" : "bg-card/10 hover:bg-card/20"
                  )}
                >
                  {voiceEnabled ? (
                    <Volume2 className="w-5 h-5 text-card" />
                  ) : (
                    <VolumeX className="w-5 h-5 text-card" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Voice callouts {useFallback ? '(fallback)' : ''}</p>
              </TooltipContent>
            </Tooltip>
            
            {/* Voice selector dropdown */}
            {showVoiceSelector && voiceEnabled && (
              <div className="absolute top-full right-0 mt-2 w-52 bg-card/95 backdrop-blur-sm rounded-lg shadow-lg p-2 animate-fade-in z-20">
                <div className="flex items-center justify-between mb-2 pb-2 border-b border-border/50">
                  <span className="text-xs text-card-foreground font-medium">
                    Voice {useFallback && <span className="text-muted-foreground">(fallback)</span>}
                  </span>
                  <button
                    onClick={() => handleIconClick(() => setShowVoiceSelector(false))}
                    className="text-muted-foreground hover:text-foreground p-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {ELEVENLABS_VOICES.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => handleIconClick(() => setSelectedVoice(v.id))}
                      className={cn(
                        "w-full text-left text-xs px-2 py-1.5 rounded transition-colors flex items-center justify-between",
                        selectedVoice === v.id
                          ? "bg-primary text-primary-foreground"
                          : "text-card-foreground hover:bg-muted/50"
                      )}
                    >
                      <span>{v.name}</span>
                      <span className="text-[10px] opacity-70">{v.gender}</span>
                    </button>
                  ))}
                  <div className="border-t border-border/50 pt-1 mt-1">
                    <button
                      onClick={() => handleIconClick(() => { setVoiceEnabled(false); setShowVoiceSelector(false); })}
                      className="w-full text-left text-xs px-2 py-1.5 rounded text-destructive hover:bg-destructive/10"
                    >
                      Turn Off Voice
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => handleIconClick(() => setShowInfo(!showInfo))}
                  className={cn(
                    "p-2 backdrop-blur-sm rounded-full transition-colors",
                    showInfo ? "bg-card/30" : "bg-card/10 hover:bg-card/20"
                  )}
                >
                  <Info className="w-5 h-5 text-card" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Species details</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </TooltipProvider>

      {/* Navigation arrows - show on hover near edges */}
      <button
        onClick={() => handleIconClick(() => navigate('prev'))}
        onMouseEnter={() => setArrowsHoverActive(true)}
        onMouseLeave={() => setArrowsHoverActive(false)}
        className={cn(
          "absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-card/10 backdrop-blur-sm rounded-full hover:bg-card/20 transition-all duration-300",
          (showArrows || arrowsHoverActive) ? "opacity-100" : "opacity-0"
        )}
      >
        <ChevronLeft className="w-6 h-6 text-card" />
      </button>
      <button
        onClick={() => handleIconClick(() => navigate('next'))}
        onMouseEnter={() => setArrowsHoverActive(true)}
        onMouseLeave={() => setArrowsHoverActive(false)}
        className={cn(
          "absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-card/10 backdrop-blur-sm rounded-full hover:bg-card/20 transition-all duration-300",
          (showArrows || arrowsHoverActive) ? "opacity-100" : "opacity-0"
        )}
      >
        <ChevronRight className="w-6 h-6 text-card" />
      </button>

      {/* Species info - shows at bottom when info toggled */}
      {showInfo && (
        <div className="absolute bottom-32 left-4 right-4 z-10 animate-fade-in">
          <div className="p-4 bg-black/60 backdrop-blur-sm rounded-md">
            <h2 className={cn("font-serif text-xl font-semibold mb-2", infoTextColor)}>
              {currentSpecies.name}
            </h2>
            <div className="flex items-center gap-2 mb-1">
              <span
                className={cn(
                  "px-2 py-0.5 rounded-sm text-xs font-sans font-medium",
                  getStatusColor(currentSpecies.status),
                  currentSpecies.status === 'CR' ? 'text-white' : 'text-foreground'
                )}
              >
                {getStatusLabel(currentSpecies.status)}
              </span>
              <span className={cn("font-sans text-xs", infoTextColorMuted)}>
                ${currentSpecies.symbol || `FCBC${currentSpecies.id.replace(/\D/g, '')}`}
              </span>
            </div>
            {/* Mcap and Holders row */}
            {(currentSpecies.marketCapFormatted || currentSpecies.holders !== undefined) && (
              <div className="flex items-center gap-4 mb-2">
                {currentSpecies.marketCapFormatted && (
                  <span className={cn("font-sans text-xs", infoTextColorMuted)}>
                    Mcap: <span className={cn("font-medium", infoTextColor)}>{currentSpecies.marketCapFormatted}</span>
                  </span>
                )}
                {currentSpecies.holders !== undefined && (
                  <span className={cn("font-sans text-xs", infoTextColorMuted)}>
                    Holders: <span className={cn("font-medium", infoTextColor)}>{currentSpecies.holders.toLocaleString()}</span>
                  </span>
                )}
              </div>
            )}
            <p className={cn("font-sans text-sm mb-3", infoTextColorMuted)}>
              {truncateDescription(currentSpecies.description)}
            </p>
            {/* Species Contract - individual token address */}
            {currentSpecies.tokenAddress && (
              <button
                onClick={copySpeciesContractAddress}
                className={cn("flex items-center gap-2 text-xs font-sans mb-2 hover:opacity-80 transition-opacity", infoTextColorMuted)}
              >
                <span className="font-medium">Species Contract:</span>
                <span className="font-mono text-[10px]">{currentSpecies.tokenAddress.slice(0, 6)}...{currentSpecies.tokenAddress.slice(-4)}</span>
                {speciesContractCopied ? <Check className="w-3 h-3 text-primary" /> : <Copy className="w-3 h-3" />}
              </button>
            )}
            {/* Creator Contract */}
            <button
              onClick={copyContractAddress}
              className={cn("flex items-center gap-2 text-xs font-sans mb-3 hover:opacity-80 transition-opacity", infoTextColorMuted)}
            >
              <span className="font-medium">Creator Contract:</span>
              <span className="font-mono text-[10px]">{CONTRACT_ADDRESS.slice(0, 6)}...{CONTRACT_ADDRESS.slice(-4)}</span>
              {contractCopied ? <Check className="w-3 h-3 text-primary" /> : <Copy className="w-3 h-3" />}
            </button>
            <a
              href={getFcbcUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-sans hover:bg-primary/90 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              View PureBreed on FCBC
            </a>
          </div>
        </div>
      )}

      {/* Bottom left - Slideshow timer */}
      <div className={cn(
        "absolute bottom-6 left-4 safe-area-bottom z-10 transition-opacity duration-300",
        iconsVisible ? "opacity-100" : "opacity-0 pointer-events-none"
      )}>
        <SlideshowControls
          interval={autoPlayInterval}
          onIntervalChange={setAutoPlayInterval}
        />
      </div>

      {/* Bottom center - Buy DNA button on top, vote panel below */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 safe-area-bottom z-10 flex flex-col items-center gap-0.5">
        {/* Buy DNA button on top */}
        <BuyDnaButton 
          onClick={handleDoubleTap}
          onLongPress={() => {
            wasPausedBeforeTxRef.current = isPaused;
            setIsPaused(true);
            setShowBuyPopup(true);
          }}
        />
        {/* Hint text */}
        <span className="text-card/50 text-[9px] font-sans leading-tight">
          Double-tap or long press for options
        </span>
        {/* Vote squares below - tighter spacing */}
        <VoteSquares 
          key={`${currentSpecies.id}-${voteKey}`}
          speciesId={currentSpecies.id}
          onTransactionStart={() => {
            wasPausedBeforeTxRef.current = isPaused;
            setIsPaused(true);
          }}
          onTransactionEnd={() => setIsPaused(wasPausedBeforeTxRef.current)}
          onPanelOpen={() => {
            wasPausedBeforeTxRef.current = isPaused;
            setIsPaused(true);
          }}
          onPanelClose={() => setIsPaused(wasPausedBeforeTxRef.current)}
        />
      </div>

      {/* Buy DNA Popup */}
      <BuyDnaPopup
        isOpen={showBuyPopup}
        onClose={() => {
          setShowBuyPopup(false);
          setIsPaused(wasPausedBeforeTxRef.current);
        }}
        onConfirm={(amount, currency) => {
          setShowBuyPopup(false);
          // The BuyDnaPopup already persists settings via usePaymentSettings
          // so the next handleDoubleTap will use the updated settings
          handleDoubleTap();
        }}
        speciesName={currentSpecies.name}
        isSubmitting={isBuying || isConfirming}
      />

      {/* Bottom right - Share button */}
      <TooltipProvider>
        <div className={cn(
          "absolute bottom-6 right-4 safe-area-bottom z-10 transition-opacity duration-300",
          iconsVisible ? "opacity-100" : "opacity-0 pointer-events-none"
        )}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => handleIconClick(() => setShowShare(!showShare))}
                className={cn(
                  "p-3 backdrop-blur-sm rounded-full transition-colors",
                  showShare ? "bg-card/30" : "bg-card/10 hover:bg-card/20"
                )}
              >
                <Share2 className="w-5 h-5 text-card" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>Share species</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>

      {/* Share buttons popup */}
      {showShare && (
        <div className="absolute bottom-20 right-4 animate-fade-in safe-area-bottom z-10">
          <ShareButtons species={currentSpecies} />
        </div>
      )}
    </div>
  );
};

export default SpeciesSlideshow;