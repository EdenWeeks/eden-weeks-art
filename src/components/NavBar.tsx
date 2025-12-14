import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { LoginArea } from '@/components/auth/LoginArea';
import { ContactDialog } from '@/components/ContactDialog';
import LoginDialog from '@/components/auth/LoginDialog';
import { Menu, ShoppingBag, Home, Image, BookOpen, User, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavLinkProps {
  to: string;
  children: React.ReactNode;
  isActive?: boolean;
}

function NavLink({ to, children, isActive }: NavLinkProps) {
  const isHashLink = to.startsWith('#') || to.includes('/#');

  if (isHashLink) {
    return (
      <a
        href={to}
        className={cn(
          "text-sm font-medium transition-colors",
          isActive ? "text-primary" : "text-muted-foreground hover:text-primary"
        )}
      >
        {children}
      </a>
    );
  }

  return (
    <Link
      to={to}
      className={cn(
        "text-sm font-medium transition-colors",
        isActive ? "text-primary" : "text-muted-foreground hover:text-primary"
      )}
    >
      {children}
    </Link>
  );
}

export function NavBar() {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const isGallery = location.pathname === '/gallery';
  const isMyStory = location.pathname === '/my-story';
  const [contactOpen, setContactOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleMobileNavClick = () => {
    setMobileMenuOpen(false);
  };

  const handleMobileContactClick = () => {
    setMobileMenuOpen(false);
    setContactOpen(true);
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

            {/* Desktop Navigation */}
            <div className="hidden sm:flex items-center gap-6">
              <NavLink to="/" isActive={isHome}>
                Home
              </NavLink>
              <NavLink to="/gallery" isActive={isGallery}>
                Gallery
              </NavLink>
              <NavLink to="/my-story" isActive={isMyStory}>
                My Story
              </NavLink>
              <NavLink to={isHome ? "#about" : "/#about"}>
                About
              </NavLink>
              <button
                onClick={() => setContactOpen(true)}
                className="text-sm font-medium transition-colors text-muted-foreground hover:text-primary"
              >
                Contact
              </button>
              <Button size="sm" asChild>
                <a href={isHome ? "#shop" : "/#shop"}>
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  Shop
                </a>
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
                      onClick={handleMobileContactClick}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors hover:bg-muted text-left"
                    >
                      <Mail className="w-5 h-5" />
                      Contact
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

      <ContactDialog
        open={contactOpen}
        onOpenChange={setContactOpen}
        onLoginClick={() => setLoginOpen(true)}
      />

      <LoginDialog
        isOpen={loginOpen}
        onClose={() => setLoginOpen(false)}
        onLogin={() => {
          setLoginOpen(false);
          setContactOpen(true);
        }}
        onSignup={() => {}}
      />
    </>
  );
}
