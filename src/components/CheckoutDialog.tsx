import { useState, useMemo, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { useCheckout } from '@/hooks/useCheckout';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useAuthor } from '@/hooks/useAuthor';
import { useWallet } from '@/hooks/useWallet';
import { useNWC } from '@/hooks/useNWCContext';
import { useNostr } from '@nostrify/react';
import LoginDialog from '@/components/auth/LoginDialog';
import { isDigitalShipping, type ShippingAddress } from '@/types/order';
import { useToast } from '@/hooks/useToast';
import {
  fetchLnurlPayParams,
  requestInvoice,
  payWithWebLN,
  fiatToSats,
} from '@/lib/lightning';
import { ShoppingBag, Loader2, Zap, Copy, Check, ExternalLink, Wallet } from 'lucide-react';
import QRCode from 'qrcode';

interface StallShippingZone {
  id: string;
  name?: string;
  cost: number;
  countries?: string[];
}

interface ProductShipping {
  id: string;
  cost: number;
}

interface CheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  merchantPubkey: string;
  product: {
    id: string;
    name: string;
    price: number;
    currency: string;
    images?: string[];
    shipping?: ProductShipping[];
  };
  shippingZones: StallShippingZone[];
}

type CheckoutStep = 'details' | 'payment' | 'success';

export function CheckoutDialog({
  open,
  onOpenChange,
  merchantPubkey,
  product,
  shippingZones,
}: CheckoutDialogProps) {
  const { user } = useCurrentUser();
  const { mutateAsync: submitOrder, isPending: isSubmitting } = useCheckout();
  const { data: merchant } = useAuthor(merchantPubkey);
  const { toast } = useToast();
  const { webln, activeNWC, hasNWC } = useWallet();
  const { sendPayment } = useNWC();
  const { nostr } = useNostr();

  const [step, setStep] = useState<CheckoutStep>('details');
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [selectedShippingId, setSelectedShippingId] = useState<string>('');
  const [quantity] = useState(1);

  // Address fields
  const [fullName, setFullName] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [postcode, setPostcode] = useState('');
  const [country, setCountry] = useState('');

  // Contact fields
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');

  // Payment state
  const [isLoadingPayment, setIsLoadingPayment] = useState(false);
  const [invoice, setInvoice] = useState<string | null>(null);
  const [amountSats, setAmountSats] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  // Get merchant's Lightning address
  const lightningAddress = merchant?.metadata?.lud16;

  // Generate QR code when invoice changes
  useEffect(() => {
    let isCancelled = false;

    const generateQR = async () => {
      if (!invoice) {
        setQrCodeUrl('');
        return;
      }

      try {
        const url = await QRCode.toDataURL(invoice.toUpperCase(), {
          width: 256,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF',
          },
        });

        if (!isCancelled) {
          setQrCodeUrl(url);
        }
      } catch (err) {
        console.error('Failed to generate QR code:', err);
      }
    };

    generateQR();

    return () => {
      isCancelled = true;
    };
  }, [invoice]);

  // Merge stall shipping zones with product-level cost overrides
  const mergedShippingZones = useMemo(() => {
    return shippingZones.map(zone => {
      const productOverride = product.shipping?.find(ps => ps.id === zone.id);
      return {
        ...zone,
        cost: productOverride?.cost ?? zone.cost,
      };
    });
  }, [shippingZones, product.shipping]);

  // Get selected shipping zone
  const selectedZone = useMemo(() => {
    return mergedShippingZones.find(z => z.id === selectedShippingId);
  }, [mergedShippingZones, selectedShippingId]);

  // Check if digital
  const isDigital = useMemo(() => {
    if (!selectedZone) return false;
    if (selectedZone.cost === 0) return true;
    return isDigitalShipping(selectedZone);
  }, [selectedZone]);

  // Calculate totals
  const shippingCost = selectedZone?.cost ?? 0;
  const subtotal = product.price * quantity;
  const total = subtotal + shippingCost;

  // Form validation
  const isFormValid = useMemo(() => {
    if (!selectedShippingId) return false;
    if (!email) return false;

    if (!isDigital) {
      if (!fullName || !addressLine1 || !city || !postcode || !country) {
        return false;
      }
    }

    return true;
  }, [selectedShippingId, email, isDigital, fullName, addressLine1, city, postcode, country]);

  const resetForm = useCallback(() => {
    setStep('details');
    setSelectedShippingId('');
    setFullName('');
    setAddressLine1('');
    setAddressLine2('');
    setCity('');
    setPostcode('');
    setCountry('');
    setEmail('');
    setPhone('');
    setMessage('');
    setInvoice(null);
    setAmountSats(null);
    setCopied(false);
    setOrderId(null);
    setQrCodeUrl('');
  }, []);

  const handleClose = useCallback((open: boolean) => {
    if (!open) {
      resetForm();
    }
    onOpenChange(open);
  }, [onOpenChange, resetForm]);

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setShowLoginDialog(true);
      return;
    }

    if (!lightningAddress) {
      toast({
        title: 'Payment not available',
        description: 'The merchant has not set up a Lightning address.',
        variant: 'destructive',
      });
      return;
    }

    const address: ShippingAddress | undefined = isDigital ? undefined : {
      fullName,
      addressLine1,
      addressLine2: addressLine2 || undefined,
      city,
      postcode,
      country,
    };

    try {
      // Submit order first
      const result = await submitOrder({
        merchantPubkey,
        productId: product.id,
        productName: product.name,
        quantity,
        shippingId: selectedShippingId,
        shippingZoneName: selectedZone?.name || 'Shipping',
        price: product.price,
        shippingCost,
        currency: product.currency,
        address,
        email,
        phone: phone || undefined,
        message: message || undefined,
      });

      setOrderId(result.orderId);

      // Now set up payment
      setIsLoadingPayment(true);
      setStep('payment');

      try {
        // Convert fiat to sats
        console.log('Converting', total, product.currency, 'to sats...');
        const sats = await fiatToSats(total, product.currency);
        console.log('Amount in sats:', sats);
        setAmountSats(sats);

        // Fetch LNURL-pay params and get invoice
        console.log('Fetching LNURL params from:', lightningAddress);
        const lnurlParams = await fetchLnurlPayParams(lightningAddress);
        console.log('LNURL params:', lnurlParams);

        console.log('Requesting invoice for', sats, 'sats...');
        const invoiceResponse = await requestInvoice(
          lnurlParams,
          sats,
          `Order #${result.orderId.slice(0, 8)} - ${product.name}`
        );
        console.log('Got invoice:', invoiceResponse.pr.substring(0, 50) + '...');

        setInvoice(invoiceResponse.pr);
        setIsLoadingPayment(false);
      } catch (paymentError) {
        console.error('Payment setup error:', paymentError);
        setIsLoadingPayment(false);
        toast({
          title: 'Payment setup failed',
          description: paymentError instanceof Error ? paymentError.message : 'Could not generate invoice',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Checkout error:', error);
      setIsLoadingPayment(false);

      // If we already sent the order, stay on payment step
      if (orderId) {
        toast({
          title: 'Payment setup failed',
          description: error instanceof Error ? error.message : 'Could not generate invoice. Please contact Eden directly.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Checkout error',
          description: error instanceof Error ? error.message : 'Something went wrong',
          variant: 'destructive',
        });
      }
    }
  };

  const handleCopyInvoice = async () => {
    if (invoice) {
      await navigator.clipboard.writeText(invoice);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Handle successful payment - send confirmation to Eden
  const handlePaymentSuccess = async () => {
    setStep('success');

    // Send confirmation message to Eden
    if (user?.signer.nip04) {
      try {
        const confirmationLines = [
          `✅ PAYMENT RECEIVED`,
          ``,
          `Order #${orderId?.slice(0, 8).toUpperCase()} has been paid!`,
          ``,
          `📦 Product: ${product.name}`,
          `💰 Amount: ${amountSats?.toLocaleString()} sats (${total.toLocaleString()} ${product.currency})`,
          ``,
          `Please process this order. Thank you!`,
        ];

        const plaintext = confirmationLines.join('\n');
        const encrypted = await user.signer.nip04.encrypt(merchantPubkey, plaintext);

        const event = await user.signer.signEvent({
          kind: 4,
          content: encrypted,
          tags: [['p', merchantPubkey]],
          created_at: Math.floor(Date.now() / 1000),
        });

        // Publish confirmation
        await nostr.event(event, { signal: AbortSignal.timeout(5000) });
      } catch (error) {
        console.error('Failed to send payment confirmation:', error);
      }
    }

    toast({
      title: 'Payment successful!',
      description: 'Your order has been paid. Eden will process it shortly.',
    });
  };

  const handlePayWithWebLN = async () => {
    if (!invoice) return;

    setIsPaying(true);
    const result = await payWithWebLN(invoice);
    setIsPaying(false);

    if (result.success) {
      await handlePaymentSuccess();
    } else {
      toast({
        title: 'Payment cancelled',
        description: 'You can still pay by copying the invoice to your Lightning wallet.',
      });
    }
  };

  const handlePayWithNWC = async () => {
    if (!invoice || !activeNWC) return;

    setIsPaying(true);
    try {
      await sendPayment(activeNWC, invoice);
      await handlePaymentSuccess();
    } catch (error) {
      console.error('NWC payment failed:', error);
      toast({
        title: 'Payment failed',
        description: error instanceof Error ? error.message : 'Could not complete payment',
        variant: 'destructive',
      });
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          {step === 'details' && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5" />
                  Checkout
                </DialogTitle>
                <DialogDescription>
                  Complete your order for {product.name}
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmitOrder} className="space-y-6">
                {/* Product Summary */}
                <div className="flex gap-4 p-4 bg-muted/50 rounded-lg">
                  {product.images && product.images[0] && (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold">{product.name}</h3>
                    <p className="text-lg font-bold">
                      {product.price.toLocaleString()} {product.currency}
                    </p>
                  </div>
                </div>

                {/* Shipping Zone Selection */}
                <div className="space-y-2">
                  <Label htmlFor="shipping">Shipping Zone *</Label>
                  <Select value={selectedShippingId} onValueChange={setSelectedShippingId}>
                    <SelectTrigger id="shipping">
                      <SelectValue placeholder="Select shipping zone" />
                    </SelectTrigger>
                    <SelectContent>
                      {mergedShippingZones.map((zone) => (
                        <SelectItem key={zone.id} value={zone.id}>
                          {zone.name || (zone.countries?.join(', ') || 'Shipping')} - {zone.cost === 0 ? 'Free' : `${zone.cost} ${product.currency}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Address Fields (only for physical products) */}
                {selectedShippingId && !isDigital && (
                  <div className="space-y-4">
                    <Separator />
                    <h4 className="font-medium">Shipping Address</h4>

                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name *</Label>
                      <Input
                        id="fullName"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="John Doe"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="addressLine1">Address Line 1 *</Label>
                      <Input
                        id="addressLine1"
                        value={addressLine1}
                        onChange={(e) => setAddressLine1(e.target.value)}
                        placeholder="123 Main Street"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="addressLine2">Address Line 2</Label>
                      <Input
                        id="addressLine2"
                        value={addressLine2}
                        onChange={(e) => setAddressLine2(e.target.value)}
                        placeholder="Apartment, suite, etc. (optional)"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city">City *</Label>
                        <Input
                          id="city"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="Cambridge"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="postcode">Postcode *</Label>
                        <Input
                          id="postcode"
                          value={postcode}
                          onChange={(e) => setPostcode(e.target.value)}
                          placeholder="CB1 2AB"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="country">Country *</Label>
                      <Input
                        id="country"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        placeholder="United Kingdom"
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Contact Information */}
                {selectedShippingId && (
                  <div className="space-y-4">
                    <Separator />
                    <h4 className="font-medium">Contact Information</h4>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        required
                      />
                      {isDigital && (
                        <p className="text-xs text-muted-foreground">
                          Digital products will be delivered to this email
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone (optional)</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+44 7123 456789"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Message to Seller (optional)</Label>
                      <Textarea
                        id="message"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Any special requests or notes..."
                        rows={3}
                      />
                    </div>
                  </div>
                )}

                {/* Order Summary */}
                {selectedShippingId && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Subtotal</span>
                        <span>{subtotal.toLocaleString()} {product.currency}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Shipping</span>
                        <span>{shippingCost === 0 ? 'Free' : `${shippingCost.toLocaleString()} ${product.currency}`}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-bold">
                        <span>Total</span>
                        <span>{total.toLocaleString()} {product.currency}</span>
                      </div>
                    </div>
                  </>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={!isFormValid || isSubmitting || !lightningAddress}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : !user ? (
                    'Log in to Order'
                  ) : !lightningAddress ? (
                    'Payment not available'
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Continue to Payment
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  Pay with Bitcoin Lightning. Your order details will be sent to the artist.
                </p>
              </form>
            </>
          )}

          {step === 'payment' && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-500" />
                  Pay with Lightning
                </DialogTitle>
                <DialogDescription>
                  Complete your payment for order #{orderId?.slice(0, 8).toUpperCase()}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {isLoadingPayment ? (
                  <div className="py-12 text-center">
                    <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-amber-500" />
                    <p className="text-muted-foreground">Preparing payment...</p>
                  </div>
                ) : invoice ? (
                  <>
                    {/* Amount */}
                    <div className="text-center p-4 bg-amber-50 rounded-lg">
                      <p className="text-sm text-amber-700 mb-1">Amount to pay</p>
                      <p className="text-3xl font-bold text-amber-900">
                        {amountSats?.toLocaleString()} sats
                      </p>
                      <p className="text-sm text-amber-600 mt-1">
                        ({total.toLocaleString()} {product.currency})
                      </p>
                    </div>

                    {/* QR Code */}
                    <Card className="mx-auto max-w-[200px]">
                      <CardContent className="p-2">
                        {qrCodeUrl ? (
                          <img
                            src={qrCodeUrl}
                            alt="Lightning Invoice QR Code"
                            className="w-full h-auto aspect-square"
                          />
                        ) : (
                          <div className="w-full aspect-square bg-muted animate-pulse rounded" />
                        )}
                      </CardContent>
                    </Card>

                    {/* Payment buttons */}
                    <div className="space-y-3">
                      {/* NWC Payment - highest priority if connected */}
                      {hasNWC && activeNWC && (
                        <Button
                          onClick={handlePayWithNWC}
                          className="w-full bg-indigo-600 hover:bg-indigo-700"
                          size="lg"
                          disabled={isPaying}
                        >
                          {isPaying ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Paying...
                            </>
                          ) : (
                            <>
                              <Wallet className="w-4 h-4 mr-2" />
                              Pay with Connected Wallet
                            </>
                          )}
                        </Button>
                      )}

                      {/* WebLN Payment */}
                      {webln && (
                        <Button
                          onClick={handlePayWithWebLN}
                          className="w-full bg-amber-500 hover:bg-amber-600"
                          size="lg"
                          disabled={isPaying}
                        >
                          {isPaying ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Waiting for payment...
                            </>
                          ) : (
                            <>
                              <Zap className="w-4 h-4 mr-2" />
                              Pay with Browser Wallet
                            </>
                          )}
                        </Button>
                      )}

                      {/* External wallet link */}
                      <Button
                        variant="outline"
                        className="w-full"
                        asChild
                      >
                        <a href={`lightning:${invoice}`}>
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Open in Wallet App
                        </a>
                      </Button>
                    </div>

                    <div className="relative">
                      <Separator />
                      <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-xs text-muted-foreground">
                        or copy invoice
                      </span>
                    </div>

                    {/* Invoice */}
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          value={invoice}
                          readOnly
                          className="font-mono text-xs"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={handleCopyInvoice}
                        >
                          {copied ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground text-center">
                        Scan QR or copy invoice to pay with any Lightning wallet
                      </p>
                    </div>

                    <Separator />

                    {/* Manual confirmation for external payments */}
                    <Button
                      variant="ghost"
                      className="w-full text-muted-foreground"
                      onClick={() => setStep('success')}
                    >
                      I've already paid
                    </Button>
                  </>
                ) : (
                  <div className="py-12 text-center">
                    <p className="text-destructive">Failed to load payment</p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => setStep('details')}
                    >
                      Go Back
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}

          {step === 'success' && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-500" />
                  Payment Complete!
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6 py-6 text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <p className="text-lg font-semibold">Thank you for your order!</p>
                  <p className="text-muted-foreground mt-2">
                    Order #{orderId?.slice(0, 8).toUpperCase()} has been paid.
                    Eden will process your order and be in touch soon.
                  </p>
                </div>
                <Button onClick={() => handleClose(false)} className="w-full">
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
      />
    </>
  );
}
