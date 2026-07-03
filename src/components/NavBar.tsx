import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { LoginArea } from '@/components/auth/LoginArea';
import { Menu, ShoppingBag, Home, Image, BookOpen, User, Mail } from 'lucide-react';
import { useMessagesDrawer } from '@/hooks/useMessagesDrawer';
import { cn } from '@/lib/utils';


export function NavBar() {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const isGallery = location.pathname === '/gallery';
  const isMyStory = location.pathname === '/my-story';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { openMessages } = useMessagesDrawer();

  // Track the URL hash so the in-page section links (About/Shop) can reflect an
  // active state. Native `<a href="#about">` clicks fire `hashchange` rather than
  // a React Router navigation, so we listen for both hashchange and route changes.
  const [hash, setHash] = useState(() =>
    typeof window !== 'undefined' ? window.location.hash : ''
  );
  useEffect(() => {
    const sync = () => setHash(window.location.hash);
    sync();
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, [location]);

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
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3 group">
              <img
                src="/logo.jpg"
                alt="Eden Weeks"
                className="h-14 w-auto transition-transform group-hover:scale-105"
              />
            </Link>

            {/* Desktop Navigation — icon-only, matching robotechy.com */}
            <div className="hidden sm:flex items-center gap-1">
              <Link
                to="/"
                title="Home"
                aria-label="Home"
                aria-current={isHomeActive ? 'page' : undefined}
                className={cn(
                  'p-2 transition-colors hover:text-primary',
                  isHomeActive ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                <Home className="h-5 w-5" />
              </Link>
              <Link
                to="/gallery"
                title="Gallery"
                aria-label="Gallery"
                aria-current={isGallery ? 'page' : undefined}
                className={cn(
                  'p-2 transition-colors hover:text-primary',
                  isGallery ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                <Image className="h-5 w-5" />
              </Link>
              <Link
                to="/my-story"
                title="My Story"
                aria-label="My Story"
                aria-current={isMyStory ? 'page' : undefined}
                className={cn(
                  'p-2 transition-colors hover:text-primary',
                  isMyStory ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                <BookOpen className="h-5 w-5" />
              </Link>
              <a
                href={isHome ? '#about' : '/#about'}
                title="About"
                aria-label="About"
                aria-current={isAboutActive ? 'true' : undefined}
                className={cn(
                  'p-2 transition-colors hover:text-primary',
                  isAboutActive ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                <User className="h-5 w-5" />
              </a>
              <a
                href={isHome ? '#shop' : '/#shop'}
                title="Shop"
                aria-label="Shop"
                aria-current={isShopActive ? 'true' : undefined}
                className={cn(
                  'p-2 transition-colors hover:text-primary',
                  isShopActive ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                <ShoppingBag className="h-5 w-5" />
              </a>
              <Button
                variant="ghost"
                size="icon"
                onClick={openMessages}
                aria-label="Messages"
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
                    <button
                      onClick={handleMobileMessagesClick}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors hover:bg-muted text-left"
                    >
                      <Mail className="w-5 h-5" />
                      Messages
                    </button>
                    <a
                      href={isHome ? "#shop" : "/#shop"}
                      onClick={handleMobileNavClick}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary text-primary-foreground"
                    >
                      <ShoppingBag className="w-5 h-5" />
                      Shop
                    </a>
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
