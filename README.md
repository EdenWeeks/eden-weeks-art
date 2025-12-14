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

- **Kind 30017**: Stall information (marketplace setup)
- **Kind 30018**: Product listings (individual artworks)
- **NIP-15**: Full marketplace protocol support

Products are fetched directly from Nostr relays using Eden's public key, ensuring decentralized and censorship-resistant commerce.

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

| Variable | Description |
|----------|-------------|
| `VITE_EDEN_PUBKEY` | Artist's Nostr public key (hex format) |
| `VITE_STALL_ID` | Marketplace stall ID from LNbits |

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

## Contributing

This project was built using [Shakespeare](https://shakespeare.diy), an AI-powered website builder.

## License

MIT License - See LICENSE file for details

## Contact

For inquiries about artwork or custom commissions, contact Eden Weeks through her Nostr profile.

---

**Powered by Nostr & Bitcoin** | Built with [Shakespeare](https://shakespeare.diy)
