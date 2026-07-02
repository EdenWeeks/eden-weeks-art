import { useState } from 'react';
import { Mail, MessageCircle, LogIn } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { DMChatArea } from '@/components/dm/DMChatArea';
import LoginDialog from '@/components/auth/LoginDialog';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useMessagesDrawer } from '@/hooks/useMessagesDrawer';

const EDEN_PUBKEY = import.meta.env.VITE_EDEN_PUBKEY;
const CONTACT_EMAIL = import.meta.env.VITE_CONTACT_EMAIL;

/**
 * Right-side drawer that lets a customer message Eden and read their full
 * conversation history, including order and payment messages. The thread is
 * scoped to Eden's pubkey and reuses the existing DM stack (`DMChatArea`).
 *
 * Mounted once globally by `MessagesDrawerProvider`; opened from the NavBar
 * via `useMessagesDrawer`.
 */
export function MessagesDrawer() {
  const { isOpen, setIsOpen } = useMessagesDrawer();
  const { user } = useCurrentUser();
  const [showLoginDialog, setShowLoginDialog] = useState(false);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    // Reset the nested login dialog when the drawer closes so it does not
    // immediately reopen the next time the drawer is shown.
    if (!open) {
      setShowLoginDialog(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="flex flex-col p-0 w-full sm:max-w-md">
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Messages
          </SheetTitle>
          <SheetDescription className="sr-only">
            Your conversation with Eden, including order and payment history.
          </SheetDescription>
        </SheetHeader>

        {!user ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <LogIn className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Sign in to message Eden
            </h3>
            <p className="text-muted-foreground text-sm mb-4">
              Sign up / log in to message Eden and track your orders.
            </p>
            <Button onClick={() => setShowLoginDialog(true)}>
              Sign In
            </Button>
            <LoginDialog
              isOpen={showLoginDialog}
              onClose={() => setShowLoginDialog(false)}
              onLogin={() => setShowLoginDialog(false)}
              onSignup={() => {}}
            />
          </div>
        ) : (
          <div className="flex-1 min-h-0 p-2">
            <DMChatArea
              pubkey={EDEN_PUBKEY}
              className="h-full border-0 shadow-none"
            />
          </div>
        )}

        {CONTACT_EMAIL && (
          <div className="border-t p-3 text-center text-sm text-muted-foreground">
            Or contact via email:{' '}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              <Mail className="h-3.5 w-3.5" />
              {CONTACT_EMAIL}
            </a>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
