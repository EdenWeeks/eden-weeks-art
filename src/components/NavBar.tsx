import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { LoginArea } from '@/components/auth/LoginArea';
import { Menu, ShoppingBag, Home, Image, BookOpen, User, Mail } from 'lucide-react';
import { useMessagesDrawer } from '@/hooks/useMessagesDrawer';
import { cn } from '@/lib/utils';

interface NavItemProps {
  /** Route path (Link) or hash target (anchor) — see `hash`. */
  to: string;
  /** Render as a plain <a> for in-page hash navigation instead of a router <Link>. */
  hash?: boolean;
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
}

/**
 * A desktop nav entry showing both icon and text label. Route links render as a
 * router <Link>. Links flagged with `hash` — the in-page section links, whether
 * `#about` on the home page or `/#about` from another route — always render as a
 * plain <a> so the browser's native anchor behaviour scrolls to the section;
 * they intentionally avoid <Link>, which would not scroll to the fragment.
 */
function NavItem({ to, hash, icon, label, isActive }: NavItemProps) {
  const className = cn(
    'flex items-center gap-1.5 text-sm font-medium transition-colors',
    isActive ? 'text-primary' : 'text-muted-foreground hover:text-primary'
  );

  if (hash) {
    return (
      <a href={to} aria-current={isActive ? 'location' : undefined} className={className}>
        {icon}
        {label}
      </a>
    );
  }

  return (
    <Link to={to} aria-current={isActive ? 'page' : undefined} className={className}>
      {icon}
      {label}
    </Link>
  );
}

export function NavBar() {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const isGallery = location.pathname === '/gallery';
  const isMyStory = location.pathname === '/my-story';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { openMessages } = useMessagesDrawer();

  // Track the URL hash so the in-page section links (About/Shop) can reflect an
  // active state. Initialised from the router location (SSR-safe — no `window`).
  const [hash, setHash] = useState(location.hash);
  // Native `<a href="#about">` clicks change the hash without a router navigation,
  // so register a single `hashchange` listener to keep the active state in sync.
  useEffect(() => {
    const sync = () => setHash(window.location.hash);
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);
  // Router navigations (e.g. /gallery → /#about) update `location.hash` directly.
  useEffect(() => {
    setHash(location.hash);
  }, [location.hash]);

  const isAboutActive = isHome && hash === '#about';
  const isShopActive = isHome && hash === '#shop';
  // Home is only the active item on the home route when no in-page section is targeted.
  const isHomeActive = isHome && !isAboutActive && !isShopActive;

  const handleMobileNavClick = () => {
    setMobileMenuOpen(false);
  };

  const handleMobileMessagesClick = () => {
    setMobileMenuOpen(false);
    openMessages();
  };

  return (
    <>
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Left: logo + primary nav (icon + text), left-aligned */}
            <div className="flex items-center gap-4 lg:gap-8">
              <Link to="/" className="flex items-center gap-3 group">
                <img
                  src="/logo.jpg"
                  alt="Eden Weeks"
                  className="h-14 w-auto transition-transform group-hover:scale-105"
                />
              </Link>

              <div className="hidden sm:flex items-center gap-4 lg:gap-6">
                <NavItem to="/" icon={<Home className="h-4 w-4" />} label="Home" isActive={isHomeActive} />
                <NavItem to="/gallery" icon={<Image className="h-4 w-4" />} label="Gallery" isActive={isGallery} />
                <NavItem to="/my-story" icon={<BookOpen className="h-4 w-4" />} label="My Story" isActive={isMyStory} />
                <NavItem to={isHome ? '#about' : '/#about'} hash icon={<User className="h-4 w-4" />} label="About" isActive={isAboutActive} />
                <NavItem to={isHome ? '#shop' : '/#shop'} hash icon={<ShoppingBag className="h-4 w-4" />} label="Shop" isActive={isShopActive} />
              </div>
            </div>

            {/* Right: Contact (icon-only) + account, right-aligned */}
            <div className="hidden sm:flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={openMessages}
                aria-label="Contact"
                title="Contact"
              >
                <Mail className="h-5 w-5" />
              </Button>
              <LoginArea />
            </div>

            {/* Mobile Navigation */}
            <div className="flex sm:hidden items-center gap-2">
              <LoginArea />
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-72">
                  <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                  <SheetDescription className="sr-only">
                    Site navigation links
                  </SheetDescription>
                  <nav className="flex flex-col gap-4 mt-8">
                    <Link
                      to="/"
                      onClick={handleMobileNavClick}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                        isHome ? "bg-primary/10 text-primary" : "hover:bg-muted"
                      )}
                    >
                      <Home className="w-5 h-5" />
                      Home
                    </Link>
                    <Link
                      to="/gallery"
                      onClick={handleMobileNavClick}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                        isGallery ? "bg-primary/10 text-primary" : "hover:bg-muted"
                      )}
                    >
                      <Image className="w-5 h-5" />
                      Gallery
                    </Link>
                    <Link
                      to="/my-story"
                      onClick={handleMobileNavClick}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                        isMyStory ? "bg-primary/10 text-primary" : "hover:bg-muted"
                      )}
                    >
                      <BookOpen className="w-5 h-5" />
                      My Story
                    </Link>
                    <a
                      href={isHome ? "#about" : "/#about"}
                      onClick={handleMobileNavClick}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors hover:bg-muted"
                    >
                      <User className="w-5 h-5" />
                      About
                    </a>
                    <a
                      href={isHome ? "#shop" : "/#shop"}
                      onClick={handleMobileNavClick}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary text-primary-foreground"
                    >
                      <ShoppingBag className="w-5 h-5" />
                      Shop
                    </a>
                    <button
                      onClick={handleMobileMessagesClick}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors hover:bg-muted text-left"
                    >
                      <Mail className="w-5 h-5" />
                      Contact
                    </button>
                  </nav>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </nav>

    </>
  );
}
