# Eden Weeks Art

A beautiful, immersive portfolio and marketplace website for Eden Weeks, a young artist from Cambridgeshire, England. This site showcases Eden's original artwork and enables customers to browse and purchase pieces using Bitcoin.

## Features

- **Portfolio Showcase**: Beautiful gallery displaying Eden's artwork with high-quality images
- **Nostr Marketplace Integration**: Built on NIP-15 (Nostr Marketplace) for decentralized commerce
- **Bitcoin Payments**: Products listed for Bitcoin purchases
- **Responsive Design**: Optimized for all devices with a clean, artistic aesthetic
- **Product Details**: Individual product pages with image galleries and specifications
- **Artist Story**: Comprehensive "About Me" section sharing Eden's journey and services

## Technology Stack

- **React 18** with TypeScript
- **Nostr Protocol** (NIP-15 Marketplace)
- **TailwindCSS** for styling
- **shadcn/ui** components
- **Nostrify** for Nostr integration
- **Vite** for fast development and building

## Design

The site features:
- Clean white background for an art gallery feel
- Soft lilac/indigo accent colors representing creativity
- Beautiful typography combining Inter and Playfair Display fonts
- Smooth animations and hover effects
- Professional, Apple-level polish

## Artist Information

**Eden Weeks**
- **Nostr npub**: `npub1enuxqa5g0cggf849yqzd53nu0x28w69sk6xzpx2q4ej75r8tuz2sh9l3eu`
- **Stall ID**: `ic5HtZ7CBy7JZPPFs36Kas`
- **Location**: Cambridgeshire, England
- **Website**: [www.EdenWeeks.art](https://www.EdenWeeks.art)

## Services Offered

1. **Bespoke Commissions** - Custom painted and drawn artwork
2. **Pre-made Art** - Original pieces available for purchase
3. **Experience Days** - In-person painting/drawing sessions (coming soon)

## Specializations

- Animal portraits (especially pets)
- Human portraiture
- Creative experimentation
- Mixed media

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Development

The project uses:
- Hot module replacement for instant updates
- TypeScript for type safety
- ESLint for code quality
- Vitest for testing

## Project Structure

```
src/
├── components/         # React components
│   └── ui/            # shadcn/ui components
├── hooks/             # Custom React hooks
│   ├── useStall.ts   # Fetch marketplace stall data
│   └── useProducts.ts # Fetch product listings
├── pages/             # Page components
│   ├── Index.tsx     # Home page with gallery
│   └── ProductDetail.tsx # Individual product pages
├── lib/              # Utility functions
└── contexts/         # React contexts

public/
└── logo.jpg          # Eden Weeks logo
```

## Nostr Integration

This site integrates with Nostr using:

- **Kind 30402** (NIP-99 / Gamma Markets): product listings (the current catalog)
- **Kind 30017 / 30018** (NIP-15): legacy LNbits stall and listings, still shown until migrated

Products are fetched directly from the shop relays (see [Relays](#relays)) using Eden's public key, with a signed snapshot as fallback (see [Backups & restore](#backups--restore)).

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

| Variable | Description |
|----------|-------------|
| `VITE_EDEN_PUBKEY` | Artist's Nostr public key (hex format) |
| `VITE_STALL_ID` | Marketplace stall ID from LNbits |

## Relays

The shop's catalog, profile and story notes live on these relays (`src/lib/shopRelays.ts`, mirrored in `order-service/lib/archiveConfig.js` and the order-service `FALLBACK_RELAYS` default):

| Relay | Notes |
| --- | --- |
| `wss://relay.weeksfamily.me` | Family relay (strfry on black-panther). First in the list, but everything tolerates it being unreachable |
| `wss://relay.ditto.pub` | Long-standing home of the shop's events |
| `wss://relay.primal.net` | Accepts and serves the shop |
| `wss://relay.damus.io` | Accepts the shop (rate-limits aggressively) |
| `wss://relay.plebeian.market` | Marketplace relay; accepts the shop |

`nos.lol`, `relay.nostr.band` and `relay.nostr.net` were removed: they are dead or never held the shop's events.

Shop data is always queried from these relays directly (outbox model), even when a logged-in visitor has their own relay list. A query resolves about 1 s after the **first** relay finishes (NPool `eoseTimeout`), with a hard 3 s ceiling, so dead relays never hold the page.

## Backups & restore

The container keeps an append-only archive of every signed event the shop key publishes. It needs only the shop's **public** key (`MERCHANT_NPUB`); no nsec is ever read for backups.

### What runs

`order-service/archiver.js` starts from `docker-entrypoint.sh` when `MERCHANT_NPUB` is set. If it exits, it is restarted, at most once a minute. It never takes the shop down.

- **Live:** one subscription across the shop relays saves each publish within seconds. It is re-armed every 30 minutes to pick up relays that were down.
- **On startup, and nightly at 03:00 UTC:** a full sync from each relay (3 REQs per relay), which rewrites `latest.jsonl` and the catalog snapshot.
- **Nightly only:**
  - a dated tarball, rotated after 90 days;
  - an optional copy to `BACKUP_COPY_DIR`;
  - an optional status POST to `N8N_WEBHOOK_URL`.

Archived kinds: `0` profile, `1` posts, `3` contacts, `5` deletions (kept as evidence, never re-broadcast), `10002` relay list, `30402` products, `30405` collections, `30406` shipping options, and the legacy NIP-15 `30017` stall and `30018` products.

### Layout (`/data/backups` — mount a volume here)

```
/data/backups/
  events/<kind>/<d-tag | pubkey | id>/<created_at>.json   original signed events, one file per version
  events/latest.jsonl                                     newest version of every event
  catalog-snapshot.json                                   also published as /catalog-snapshot.json on the site
  tarballs/events-YYYY-MM-DD.tar.gz                       nightly, 90-day rotation
  monitor-state.json                                      last night's listing count + seen deletions
```

Addressable kinds are grouped by d-tag, replaceable kinds (0, 3, 10002) by pubkey, and regular kinds by event id. Files are **never overwritten or deleted**. Only the dated tarballs rotate.

When the shop key publishes a kind-5 deletion, the archiver logs a `WARNING` naming the deleted product, and keeps the archived copy.

### Cached snapshot (the site never renders blank)

The archiver writes `catalog-snapshot.json`: the newest signed version of the profile, the catalog (Gamma and NIP-15), and the last 100 notes, with deleted events left out. It writes the file to `/data/backups` and to `dist/`, so the site serves it at `/catalog-snapshot.json`.

1. The storefront (`src/hooks/useShopQuery.ts`) loads the snapshot first.
2. It **verifies every signature in the browser** against the shop pubkey (`src/lib/catalogSnapshot.ts`) and shows the snapshot immediately.
3. Live relay data is merged in as it arrives: the newest version of each event wins, and the shop's deletions are applied.

If every relay is down, the site still shows the last good catalog. A tampered snapshot can only lose events, never forge them.

### Restore

`restore.js` is a **dry run by default**. Pass `--execute` to act.

```bash
# What would be restored? (all catalog + profile/relay list/contacts, newest versions)
docker exec eden-weeks-art node /app/order-service/restore.js

# One product, by d-tag: dry run, then for real
docker exec eden-weeks-art node /app/order-service/restore.js --d <product-d-tag>
docker exec eden-weeks-art node /app/order-service/restore.js --d <product-d-tag> --execute

# The version that was live at a given time
docker exec eden-weeks-art node /app/order-service/restore.js --d <tag> --at 1767225600
```

| Mode | When | Key needed |
| --- | --- | --- |
| `--mode rebroadcast` (default) | Relays lost the data. Re-sends the **original signed events** | None |
| `--mode republish` | The product was **deleted** (kind 5), or you want to roll back to an older version. Relays refuse a deleted event, and keep only the newest replaceable one | Owner signs in the browser |

The dry run warns when an event was deleted or superseded, and when rebroadcast therefore won't work.

**Republish (owner signs in the browser).** `--mode republish` prints **unsigned** templates: the original tags and content with a fresh `created_at`. Add `--execute --out /data/backups/restore.json` to write them to a file. The container never holds the key. To publish:

1. Log in to the site as the shop owner (browser extension / NIP-07 signer).
2. Open the product editor for that product (or "Add product" if it's gone), paste the title, description, price and images from the template, and save. The browser signs a fresh event with your key.
3. Re-run `restore.js` in dry-run mode, or wait for the archiver, to confirm the new version is archived.

### Monitoring (n8n)

When `N8N_WEBHOOK_URL` is set, the nightly sync POSTs:

```json
{
  "shop": "eden-weeks-art", "merchantPubkey": "…", "timestamp": "2026-10-12T03:00:04Z",
  "liveListings": 4, "previousListings": 4, "listingDropPct": 0,
  "archivedListings": 4, "liveVsArchivedPct": 100,
  "archivedEvents": 42, "relaysReached": ["wss://relay.ditto.pub", "…"],
  "newDeletions": [{ "id": "…", "created_at": 0, "targets": ["a:30402:…"], "archivedTargets": [{ "kind": 30402, "title": "…" }] }]
}
```

Suggested n8n rule: Webhook → IF → alert (email / Signal / Nostr DM) when **any** of these hold:

- `listingDropPct > 20`: live listings fell more than 20% since last night (Gamma + NIP-15; a migrated product counts once);
- `liveVsArchivedPct < 80`: relays are serving less than 80% of what we have archived;
- `newDeletions.length > 0`: the shop key published a deletion;
- `relaysReached.length == 0`: no relay answered.

### Environment

| Variable | Default | Purpose |
| --- | --- | --- |
| `MERCHANT_NPUB` | (required for backups) | Shop public key, npub or hex. Never an nsec |
| `BACKUP_DIR` | `/data/backups` | Archive root |
| `ARCHIVE_RELAYS` | the shop relays | Relays to archive from; `FALLBACK_RELAYS` are merged in |
| `BACKUP_COPY_DIR` | (unset) | Copy nightly tarballs here, e.g. a mounted Nextcloud folder. Never pruned |
| `N8N_WEBHOOK_URL` | (unset) | Nightly status POST |
| `BACKUP_RETENTION_DAYS` | `90` | Tarball retention |
| `NIGHTLY_SYNC_HOUR_UTC` | `3` | Hour of the nightly sync |
| `SNAPSHOT_PUBLIC_PATH` | `/app/dist/catalog-snapshot.json` | Where the site serves the snapshot from |

## Customization

To customize for another artist:

1. Update environment variables in `.env`
2. Replace `/public/logo.jpg` with the artist's logo
3. Replace `/public/eden-weeks.webp` with the artist's photo
4. Update the "About Me" section content in `src/pages/Index.tsx`
5. Customize colors in `src/index.css`

## Deployment

The project can be deployed to:
- Netlify
- Vercel
- GitHub Pages
- Any static hosting service

Build the project first:
```bash
npm run build
```

Then deploy the `dist/` directory.

Production runs as a Docker container (`Dockerfile`, `docker-entrypoint.sh`) on black-panther's `apps-stack`. It serves the static site on port 80 and runs the order service, which needs `MERCHANT_NSEC` and `LIGHTNING_ADDRESS`, plus the event archiver, which needs only `MERCHANT_NPUB`. Mount a volume at `/data/backups` so the archive survives rebuilds:

```bash
docker build -t eden-weeks-art .
docker run -d -p 8082:80 \
  -e MERCHANT_NPUB=npub1enuxqa5g0cggf849yqzd53nu0x28w69sk6xzpx2q4ej75r8tuz2sh9l3eu \
  -v eden-weeks-art-backups:/data/backups \
  --name eden-weeks-art eden-weeks-art
```

## Contributing

This project was built using [Shakespeare](https://shakespeare.diy), an AI-powered website builder.

## License

MIT License - See LICENSE file for details

## Contact

For inquiries about artwork or custom commissions, contact Eden Weeks through her Nostr profile.

---

**Powered by Nostr & Bitcoin** | Built with [Shakespeare](https://shakespeare.diy)
