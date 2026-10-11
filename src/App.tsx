// NOTE: This file should normally not be modified unless you are adding a new provider.
// To add new routes, edit the AppRouter.tsx file.

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createHead, UnheadProvider } from '@unhead/react/client';
import { InferSeoMetaPlugin } from '@unhead/addons';
import { Suspense } from 'react';
import NostrProvider from '@/components/NostrProvider';
import { NostrSync } from '@/components/NostrSync';
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { NostrLoginProvider } from '@nostrify/react/login';
import { AppProvider } from '@/components/AppProvider';
import { DMProvider } from '@/components/DMProvider';
import { NWCProvider } from '@/contexts/NWCContext';
import { AppConfig } from '@/contexts/AppContext';
import { MessagesDrawerProvider } from '@/contexts/MessagesDrawerContext';
import { PROTOCOL_MODE } from '@/lib/dmConstants';
import { shopRelayMetadata } from '@/lib/shopRelays';
import AppRouter from './AppRouter';

const head = createHead({
  plugins: [
    InferSeoMetaPlugin(),
  ],
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 60000, // 1 minute
      gcTime: Infinity,
    },
  },
});

// Shop relays (src/lib/shopRelays.ts): family relay first, then Ditto, Primal,
// Damus and Plebeian Market. relay.nostr.band / nos.lol / relay.nostr.net were
// removed — dead, or never held the shop's events (Ditto, where they live,
// was missing, so the site rendered empty).
const defaultConfig: AppConfig = {
  theme: "light",
  relayMetadata: shopRelayMetadata(),
};

export function App() {
  return (
    <UnheadProvider head={head}>
      <AppProvider storageKey="nostr:app-config" defaultConfig={defaultConfig}>
        <QueryClientProvider client={queryClient}>
          <NostrLoginProvider storageKey='nostr:login'>
            <NostrProvider>
              <NostrSync />
              <NWCProvider>
                <TooltipProvider>
                  <Toaster />
                  {/* Both protocols: NIP-15/LNbits orders flow over kind-4 DMs,
                      Gamma (NIP-99) orders over NIP-17 gift wraps */}
                  <DMProvider config={{ enabled: true, protocolMode: PROTOCOL_MODE.NIP04_OR_NIP17 }}>
                    <MessagesDrawerProvider>
                      <Suspense>
                        <AppRouter />
                      </Suspense>
                    </MessagesDrawerProvider>
                  </DMProvider>
                </TooltipProvider>
              </NWCProvider>
            </NostrProvider>
          </NostrLoginProvider>
        </QueryClientProvider>
      </AppProvider>
    </UnheadProvider>
  );
}

export default App;
