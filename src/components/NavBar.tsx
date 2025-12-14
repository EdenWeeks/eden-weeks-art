import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LoginArea } from '@/components/auth/LoginArea';
import { ShoppingBag } from 'lucide-react';
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
          "text-sm font-medium transition-colors hidden sm:inline",
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
        "text-sm font-medium transition-colors hidden sm:inline",
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

  return (
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
          <div className="flex items-center gap-6">
            <NavLink to="/" isActive={isHome}>
              Home
            </NavLink>
            <NavLink to="/gallery" isActive={isGallery}>
              Gallery
            </NavLink>
            <NavLink to={isHome ? "#about" : "/#about"}>
              About
            </NavLink>
            <Button size="sm" asChild className="hidden sm:inline-flex">
              <a href={isHome ? "#shop" : "/#shop"}>
                <ShoppingBag className="w-4 h-4 mr-2" />
                Shop
              </a>
            </Button>
            <LoginArea />
          </div>
        </div>
      </div>
    </nav>
  );
}
