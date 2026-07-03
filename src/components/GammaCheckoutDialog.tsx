import { useEffect, useMemo, useState } from 'react';
import { Check, Copy, ExternalLink, Loader2, Mail, ShoppingBag, Zap } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import LoginDialog from '@/components/auth/LoginDialog';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useToast } from '@/hooks/useToast';
import { useGammaCheckout } from '@/hooks/useGammaCheckout';
import { useMerchantShippingOptions } from '@/hooks/useMerchantShippingOptions';
import { useMessagesDrawer } from '@/hooks/useMessagesDrawer';
import { useExchangeRate } from '@/hooks/useExchangeRate';
import { useGammaPaymentRequest } from '@/hooks/useGammaPaymentRequest';
import { payWithWebLN } from '@/lib/lightning';
import QRCode from 'qrcode';
import { parseShippingOptionEvent, type ShippingOptionData } from '@/lib/productUtils';
import { allCountries, detectLocaleCountry } from '@/lib/countries';
import type { UnifiedProduct } from '@/hooks/useUnifiedProducts';

interface GammaCheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: UnifiedProduct;
}

/**
 * Checkout for Gamma (NIP-99, kind 30402) listings — country-first shipping
 * selection: pick the destination country, see only the shipping options that
 * deliver there, then send the order as a gift-wrapped Gamma kind-16 event.
 * Eden replies with a Lightning invoice in Messages.
 */
export function GammaCheckoutDialog({ open, onOpenChange, product }: GammaCheckoutDialogProps) {
  const { user } = useCurrentUser();
  const { data: shippingEvents } = useMerchantShippingOptions();
  const { mutateAsync: submitOrder, isPending } = useGammaCheckout();
  const { openMessages } = useMessagesDrawer();
  const { toast } = useToast();
  const { convertToSats } = useExchangeRate();

  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [step, setStep] = useState<'details' | 'sent' | 'paid'>('details');
  const [orderId, setOrderId] = useState<string | null>(null);

  const [country, setCountry] = useState<string>(() => detectLocaleCountry() ?? '');
  const [shippingId, setShippingId] = useState('');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postcode, setPostcode] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [isPaying, setIsPaying] = useState(false);

  // The order service's automatic invoice, once it lands (kind-16 type 2).
  const { data: paymentRequest } = useGammaPaymentRequest(step === 'sent' ? orderId : null);

  useEffect(() => {
    let cancelled = false;
    if (!paymentRequest?.invoice) {
      setQrCodeUrl('');
      return;
    }
    QRCode.toDataURL(paymentRequest.invoice.toUpperCase(), { width: 256, margin: 2 })
      .then((url) => { if (!cancelled) setQrCodeUrl(url); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [paymentRequest?.invoice]);

  const countries = useMemo(() => allCountries(), []);

  const shippingOptions = useMemo(
    () =>
      (shippingEvents ?? [])
        .map((event) => parseShippingOptionEvent(event))
        .filter((option): option is ShippingOptionData => option !== null),
    [shippingEvents]
  );

  // Country-first: only offer options that ship to the chosen country
  // (an option with no country list counts as worldwide).
  const compatibleOptions = useMemo(
    () =>
      shippingOptions.filter(
        (option) => option.countries.length === 0 || (country && option.countries.includes(country))
      ),
    [shippingOptions, country]
  );

  const selectedOption = compatibleOptions.find((option) => option.id === shippingId);

  const handleCountryChange = (code: string) => {
    setCountry(code);
    // Re-filtering can invalidate the current selection; force a re-pick.
    setShippingId('');
  };

  // Submittable when a compatible option is chosen — or the merchant has no
  // shipping options published at all (delivery arranged over Messages).
  const isValid = Boolean(
    country && email && name && address && (selectedOption || shippingOptions.length === 0)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setShowLoginDialog(true);
      return;
    }
    const countryLabel = countries.find((entry) => entry.code === country)?.name ?? country;
    try {
      const shippingSats = selectedOption
        ? convertToSats(Number(selectedOption.price.amount), selectedOption.price.currency)
        : 0;
      const totalSats = convertToSats(product.price, product.currency) + shippingSats;
      const result = await submitOrder({
        totalSats: totalSats > 0 ? totalSats : undefined,
        item: {
          productId: product.id,
          productPubkey: product.event.pubkey,
          title: product.name,
          quantity: 1,
          priceAmount: String(product.price),
          priceCurrency: product.currency,
        },
        shipping: {
          name,
          address,
          city,
          postcode,
          country: countryLabel,
          email,
          phone: phone || undefined,
          message: message || undefined,
        },
        shippingOption: selectedOption,
      });
      setOrderId(result.orderId);
      setStep('sent');
    } catch (error) {
      console.error('Gamma checkout failed:', error);
      toast({
        title: 'Could not send order',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      // Fresh dialog next time — otherwise a completed order's "sent" screen
      // (and the previous address) would greet the next checkout.
      setStep('details');
      setOrderId(null);
      setShippingId('');
      setName('');
      setAddress('');
      setCity('');
      setPostcode('');
      setEmail('');
      setPhone('');
      setMessage('');
      setShowLoginDialog(false);
      setQrCodeUrl('');
      setCopied(false);
      setIsPaying(false);
    }
    onOpenChange(nextOpen);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          {step === 'details' ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5" />
                  Checkout
                </DialogTitle>
                <DialogDescription>Complete your order for {product.name}</DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Country first — everything else follows from it */}
                <div className="space-y-2">
                  <Label htmlFor="gamma-country">Ship to *</Label>
                  <Select value={country} onValueChange={handleCountryChange}>
                    <SelectTrigger id="gamma-country">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((entry) => (
                        <SelectItem key={entry.code} value={entry.code}>
                          {entry.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {country && compatibleOptions.length > 0 && (
                  <div className="space-y-2">
                    <Label htmlFor="gamma-shipping">Shipping *</Label>
                    <Select value={shippingId} onValueChange={setShippingId}>
                      <SelectTrigger id="gamma-shipping">
                        <SelectValue placeholder="Select shipping option" />
                      </SelectTrigger>
                      <SelectContent>
                        {compatibleOptions.map((option) => (
                          <SelectItem key={option.id} value={option.id}>
                            {option.title} — {option.price.amount} {option.price.currency}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {country && compatibleOptions.length === 0 && shippingOptions.length > 0 && (
                  <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                    We don't ship to this country yet —{' '}
                    <button
                      type="button"
                      className="underline hover:text-primary"
                      onClick={() => {
                        handleOpenChange(false);
                        openMessages();
                      }}
                    >
                      message Eden
                    </button>{' '}
                    to arrange delivery.
                  </div>
                )}

                {country && (
                  <div className="space-y-4">
                    <Separator />
                    <h4 className="font-medium">Delivery details</h4>
                    <div className="space-y-2">
                      <Label htmlFor="gamma-name">Full name *</Label>
                      <Input id="gamma-name" value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gamma-address">Address *</Label>
                      <Input
                        id="gamma-address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="gamma-city">City</Label>
                        <Input id="gamma-city" value={city} onChange={(e) => setCity(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="gamma-postcode">Postcode</Label>
                        <Input
                          id="gamma-postcode"
                          value={postcode}
                          onChange={(e) => setPostcode(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gamma-email">Email *</Label>
                      <Input
                        id="gamma-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gamma-phone">Phone (optional)</Label>
                      <Input id="gamma-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gamma-message">Message to Eden (optional)</Label>
                      <Textarea
                        id="gamma-message"
                        rows={3}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {/* Order summary */}
                {country && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Subtotal</span>
                        <span>
                          {product.price.toLocaleString()} {product.currency}
                        </span>
                      </div>
                      {selectedOption && (
                        <div className="flex justify-between text-sm">
                          <span>Shipping</span>
                          <span>
                            {selectedOption.price.amount} {selectedOption.price.currency}
                          </span>
                        </div>
                      )}
                    </div>
                  </>
                )}

                <Button type="submit" className="w-full" size="lg" disabled={!isValid || isPending}>
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending order…
                    </>
                  ) : !user ? (
                    'Log in to Order'
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Place Order
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  Your order is sent to Eden as an encrypted Nostr message. She replies with a
                  Lightning invoice to complete payment.
                </p>
              </form>
            </>
          ) : step === 'sent' ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-500" />
                  Order sent!
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-6 py-6">
                {paymentRequest ? (
                  <>
                    <div className="text-center p-4 bg-amber-50 rounded-lg">
                      <p className="text-sm text-amber-700 mb-1">Amount to pay</p>
                      <p className="text-3xl font-bold text-amber-900">
                        {paymentRequest.amountSats?.toLocaleString() ?? '—'} sats
                      </p>
                    </div>
                    {qrCodeUrl && (
                      <img
                        src={qrCodeUrl}
                        alt="Lightning invoice QR code"
                        className="mx-auto w-48 h-48 rounded-lg border"
                      />
                    )}
                    <div className="space-y-3">
                      <Button
                        className="w-full bg-amber-500 hover:bg-amber-600"
                        size="lg"
                        disabled={isPaying}
                        onClick={async () => {
                          setIsPaying(true);
                          const result = await payWithWebLN(paymentRequest.invoice);
                          setIsPaying(false);
                          if (result.success) {
                            setStep('paid');
                          } else {
                            toast({
                              title: 'Payment not completed',
                              description:
                                'No browser wallet responded — open the invoice in a wallet app or copy it instead.',
                              variant: 'destructive',
                            });
                          }
                        }}
                      >
                        {isPaying ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Zap className="w-4 h-4 mr-2" />
                        )}
                        Pay with Browser Wallet
                      </Button>
                      <Button variant="outline" className="w-full" asChild>
                        <a href={`lightning:${paymentRequest.invoice}`}>
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Open in Wallet App
                        </a>
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(paymentRequest.invoice);
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000);
                          } catch {
                            toast({
                              title: 'Could not copy',
                              description: 'Clipboard unavailable — long-press or select the invoice in a wallet app instead.',
                              variant: 'destructive',
                            });
                          }
                        }}
                      >
                        {copied ? (
                          <Check className="w-4 h-4 mr-2 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4 mr-2" />
                        )}
                        Copy invoice
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      className="w-full text-muted-foreground"
                      onClick={() => setStep('paid')}
                    >
                      I've already paid
                    </Button>
                  </>
                ) : (
                  <div className="text-center space-y-6">
                    <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center">
                      <Check className="w-8 h-8 text-green-600" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold">
                        Order #{orderId?.slice(0, 8).toUpperCase()} is on its way to Eden.
                      </p>
                      <p className="text-muted-foreground mt-2">
                        Waiting for your Lightning invoice — it appears here automatically,
                        and also lands in Messages.
                      </p>
                      <Loader2 className="w-5 h-5 mx-auto mt-3 animate-spin text-amber-500" />
                    </div>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        handleOpenChange(false);
                        openMessages();
                      }}
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Open Messages
                    </Button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-500" />
                  Payment complete!
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-6 py-6 text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <p className="text-lg font-semibold">
                  Thank you! Order #{orderId?.slice(0, 8).toUpperCase()} is paid.
                </p>
                <p className="text-muted-foreground">
                  Eden will be in touch in Messages with dispatch updates.
                </p>
                <Button className="w-full" onClick={() => handleOpenChange(false)}>
                  Close
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <LoginDialog
        isOpen={showLoginDialog}
        onClose={() => setShowLoginDialog(false)}
        onLogin={() => setShowLoginDialog(false)}
        onSignup={() => {}}
      />
    </>
  );
}
