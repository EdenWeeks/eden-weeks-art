import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// Plain-http pages are insecure contexts, where the browser disables
// crypto.randomUUID — which the Nostr stack needs to open relay
// subscriptions — so every query silently dies and the whole site looks
// empty. Bounce production traffic to https before the app boots.
// (localhost and LAN IPs stay untouched for development.)
if (
  window.location.protocol === 'http:' &&
  window.location.hostname.endsWith('edenweeks.art')
) {
  window.location.replace(window.location.href.replace(/^http:/, 'https:'));
}

// Import polyfills first
import './lib/polyfills.ts';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import App from './App.tsx';
import './index.css';

// Import custom fonts
import '@fontsource-variable/inter';
import '@fontsource-variable/playfair-display';

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);
