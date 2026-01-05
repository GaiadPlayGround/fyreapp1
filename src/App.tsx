import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { WalletProvider } from "@/contexts/WalletContext";
import { OnchainProvider } from "@/providers/OnchainProvider";
import { useAccount } from "wagmi";
import Index from "./pages/Index";
import WalletGate from "./pages/WalletGate";
import NotFound from "./pages/NotFound";

const ProtectedRoutes = () => {
  const { isConnected } = useAccount();

  if (!isConnected) {
    return <WalletGate />;
  }

  return (
    <Routes>
      <Route path="/" element={<Index />} />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <ThemeProvider>
    <OnchainProvider>
      <WalletProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ProtectedRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </WalletProvider>
    </OnchainProvider>
  </ThemeProvider>
);

export default App;
