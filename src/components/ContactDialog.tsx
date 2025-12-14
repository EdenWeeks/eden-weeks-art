import { useState } from 'react';
import { Mail, Send, LogIn } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useLoggedInAccounts } from '@/hooks/useLoggedInAccounts';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useAuthor } from '@/hooks/useAuthor';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useToast } from '@/hooks/useToast';

const EDEN_PUBKEY = import.meta.env.VITE_EDEN_PUBKEY;
const CONTACT_EMAIL = import.meta.env.VITE_CONTACT_EMAIL;

interface ContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoginClick: () => void;
}

export function ContactDialog({ open, onOpenChange, onLoginClick }: ContactDialogProps) {
  const { currentUser } = useLoggedInAccounts();
  const { user } = useCurrentUser();
  const { data: senderProfile } = useAuthor(currentUser?.pubkey);
  const { mutateAsync: createEvent } = useNostrPublish();
  const { toast } = useToast();
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [messageSent, setMessageSent] = useState(false);

  const handleSendMessage = async () => {
    if (!message.trim() || !currentUser || !user?.signer?.nip04) return;

    setIsSending(true);
    try {
      // Encrypt the message using NIP-04
      const encryptedContent = await user.signer.nip04.encrypt(EDEN_PUBKEY, message.trim());

      // Create and publish NIP-04 DM
      await createEvent({
        kind: 4,
        content: encryptedContent,
        tags: [['p', EDEN_PUBKEY]],
      });

      setMessage('');
      setMessageSent(true);
    } catch (error) {
      console.error('Failed to send message:', error);
      toast({
        title: 'Failed to send message',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleLoginClick = () => {
    onOpenChange(false);
    onLoginClick();
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      // Reset state when dialog closes
      setMessage('');
      setMessageSent(false);
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Contact Eden
          </DialogTitle>
          <DialogDescription>
            {currentUser
              ? 'Send a direct message to Eden via Nostr.'
              : 'Log in to send a direct message, or use email.'}
          </DialogDescription>
        </DialogHeader>

        {messageSent ? (
          <div className="py-8 text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <Send className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-foreground">Message Sent!</h3>
              <p className="text-sm text-muted-foreground">
                Thanks for reaching out. Eden will receive your message on Nostr and get back to you soon.
              </p>
            </div>
            <Button onClick={() => handleOpenChange(false)} className="mt-4">
              Close
            </Button>
          </div>
        ) : currentUser ? (
          <div className="space-y-4">
            {/* Sender info */}
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Avatar className="h-10 w-10">
                <AvatarImage src={senderProfile?.metadata?.picture} />
                <AvatarFallback>
                  {senderProfile?.metadata?.name?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {senderProfile?.metadata?.name || 'Nostr User'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Sending via Nostr DM
                </p>
              </div>
              <img
                src="/nostr-logo.png"
                alt="Nostr"
                className="h-6 w-auto opacity-60"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Your Message</Label>
              <Textarea
                id="message"
                placeholder="Hi Eden, I'm interested in..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={!message.trim() || isSending}
              className="w-full"
            >
              <Send className="w-4 h-4 mr-2" />
              {isSending ? 'Sending...' : 'Send Message'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg text-center space-y-3">
              <p className="text-sm text-muted-foreground">
                Log in with Nostr to send a direct message to Eden.
              </p>
              <Button onClick={handleLoginClick} className="w-full">
                <LogIn className="w-4 h-4 mr-2" />
                Log In to Message
              </Button>
            </div>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or contact via email
                </span>
              </div>
            </div>
            <div className="text-center">
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="text-primary hover:underline font-medium"
              >
                {CONTACT_EMAIL}
              </a>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
