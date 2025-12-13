# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Eden Weeks Art is a portfolio and marketplace website for an artist, built on the Nostr protocol (NIP-15 Marketplace). The site showcases artwork and enables Bitcoin purchases through decentralized commerce.

**Artist Information:**
- Nostr npub: `npub1enuxqa5g0cggf849yqzd53nu0x28w69sk6xzpx2q4ej75r8tuz2sh9l3eu`
- Stall ID: `ic5HtZ7CBy7JZPPFs36Kas`

## Commands

```bash
# Install dependencies and start dev server (port 8080)
npm run dev

# Run full test suite (TypeScript check, ESLint, Vitest tests, production build)
npm run test

# Production build only
npm run build

# Deploy to Nostr (builds first)
npm run deploy
```

## Architecture

### Tech Stack
- React 18 + TypeScript + Vite
- TailwindCSS + shadcn/ui components
- Nostrify for Nostr protocol integration
- TanStack Query for data fetching/caching
- React Router for client-side routing

### Key Files
- `src/App.tsx` - Provider setup (QueryClient, NostrProvider, etc.) - **read before modifying**
- `src/AppRouter.tsx` - Route configuration - add new routes above the catch-all `*` route
- `src/pages/Index.tsx` - Home page with product gallery
- `src/pages/ProductDetail.tsx` - Individual product view

### Nostr Integration
- Kind 30017: Stall information (marketplace setup)
- Kind 30018: Product listings (individual artworks)
- Uses NIP-15 Marketplace protocol
- Products fetched from Nostr relays using Eden's public key

### Custom Hooks
- `useNostr` - Core Nostr queries (`nostr.query()`, `nostr.event()`)
- `useStall` / `useProducts` - Marketplace data
- `useAuthor` - User profile data by pubkey
- `useCurrentUser` - Logged-in user
- `useNostrPublish` - Publish events to Nostr
- `useUploadFile` - File uploads via Blossom servers

### Path Aliases
Use `@/` prefix for imports from `src/`:
```typescript
import { useNostr } from '@/hooks/useNostr';
import { Button } from '@/components/ui/button';
```

## Nostr Development Guidelines

1. Always check existing NIPs before implementing features - prioritize interoperability
2. Use single-letter tags (like `t`) for relay-queryable data
3. Combine related queries into single requests to avoid rate limiting
4. For custom kinds, generate numbers using available tools and document in `NIP.md`
5. Filter events through validators when kinds have required tags/fields

## Documentation

See `docs/` for implementation patterns:
- `AI_CHAT.md` - Shakespeare API integration
- `NOSTR_COMMENTS.md` - Comment systems
- `NOSTR_DIRECT_MESSAGES.md` - DM implementation (NIP-04/NIP-17)
- `NOSTR_INFINITE_SCROLL.md` - Feed pagination

## Custom ESLint Rules

- `no-inline-script` - Prevents inline scripts in HTML
- `no-placeholder-comments` - Flags "// In a real" comments
- `require-webmanifest` - Ensures manifest.json exists

## Testing

- Vitest with jsdom environment
- Use `TestApp` wrapper component for context providers
- Run `npm run test` after all code changes
- Do not write new tests unless explicitly requested
