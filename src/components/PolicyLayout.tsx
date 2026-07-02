import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { NavBar } from '@/components/NavBar';
import { useMessagesDrawer } from '@/hooks/useMessagesDrawer';

/** Inline "message Eden" affordance used across the policy pages. */
export function MessageEdenLink({ children }: { children: ReactNode }) {
  const { openMessages } = useMessagesDrawer();
  return (
    <button
      type="button"
      onClick={openMessages}
      className="underline text-primary hover:text-primary/80"
    >
      {children}
    </button>
  );
}

/**
 * Shared frame for the policy pages: NavBar, a titled prose column, and a
 * compact footer cross-linking the other policies.
 */
export function PolicyLayout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <NavBar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold mb-8 text-foreground">{title}</h1>
        <div className="prose prose-slate max-w-none space-y-6 text-muted-foreground">
          {children}
        </div>
      </main>

      <footer className="bg-gradient-to-br from-violet-100 to-indigo-100 py-8 mt-24">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-violet-700">
            <Link to="/shipping-policy" className="hover:text-violet-900 underline">
              Shipping
            </Link>
            <Link to="/refund-policy" className="hover:text-violet-900 underline">
              Refunds
            </Link>
            <Link to="/privacy-policy" className="hover:text-violet-900 underline">
              Privacy
            </Link>
            <Link to="/terms-of-service" className="hover:text-violet-900 underline">
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
