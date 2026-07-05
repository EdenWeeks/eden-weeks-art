import { useSeoMeta } from '@unhead/react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useUnifiedProduct } from '@/hooks/useUnifiedProducts';
import { useStall } from '@/hooks/useStall';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Expand, ShoppingBag } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { NavBar } from '@/components/NavBar';
import { SiteFooter } from '@/components/SiteFooter';
import { ProductFeedbackTabs } from '@/components/ProductFeedbackTabs';
import { ZapButton } from '@/components/ZapButton';
import { CheckoutDialog } from '@/components/CheckoutDialog';
import { GammaCheckoutDialog } from '@/components/GammaCheckoutDialog';
import { productReviewCoord } from '@/lib/productReviews';
import { OwnerProductActions } from '@/components/admin/OwnerProductActions';

const EDEN_PUBKEY = import.meta.env.VITE_EDEN_PUBKEY;
const STALL_ID = import.meta.env.VITE_STALL_ID;

const ProductDetail = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { data: product, isLoading } = useUnifiedProduct(productId || '');
  const { data: stall } = useStall(EDEN_PUBKEY, STALL_ID);
  const [selectedImage, setSelectedImage] = useState(0);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useSeoMeta({
    title: product ? `${product.name} - Eden Weeks Art` : 'Product - Eden Weeks Art',
    description: product?.description || 'View this beautiful artwork by Eden Weeks',
  });

  // The main image container adopts the FIRST image's natural aspect ratio
  // (previously a fixed square that cropped non-square artwork). Preload image 1
  // to read its natural dimensions; until known (or on failure) it stays square.
  const firstImageUrl = product?.images?.[0];
  const [firstImageRatio, setFirstImageRatio] = useState<number | null>(null);
  useEffect(() => {
    setFirstImageRatio(null);
    if (!firstImageUrl) return;
    let cancelled = false;
    const probe = new Image();
    probe.onload = () => {
      if (!cancelled && probe.naturalWidth > 0 && probe.naturalHeight > 0) {
        setFirstImageRatio(probe.naturalWidth / probe.naturalHeight);
      }
    };
    probe.src = firstImageUrl;
    return () => {
      cancelled = true;
    };
  }, [firstImageUrl]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <NavBar />

        <div className="container mx-auto px-4 py-12">
          <Button variant="ghost" className="mb-8" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <Skeleton className="w-full aspect-square rounded-2xl" />
            <div className="space-y-6">
              <Skeleton className="h-12 w-3/4" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-16 w-1/2" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-white">
        <NavBar />

        <div className="container mx-auto px-4 py-12">
          <Button variant="ghost" className="mb-8" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <Card className="border-dashed">
            <CardContent className="py-16 px-8 text-center">
              <div className="max-w-sm mx-auto space-y-4">
                <p className="text-lg text-muted-foreground">
                  Product not found
                </p>
                <Button onClick={() => navigate('/')}>
                  Return to Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const images = product.images;
  const isAvailable = product.stock == null || product.stock > 0;
  const specs = product.nip15?.specs ?? product.gamma?.specs;

  return (
    <div className="min-h-screen bg-white">
      <NavBar />

      <div className="container mx-auto px-4 py-12">
        <Button variant="ghost" className="mb-8 hover:text-primary" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Shop
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Image Gallery */}
          <div className="space-y-4">
            {images.length > 0 ? (
              <>
                <div
                  className="relative rounded-2xl overflow-hidden bg-muted shadow-xl"
                  style={{ aspectRatio: firstImageRatio ?? 1 }}
                >
                  {/* object-contain (not cover): the container adopts the first
                      image's natural aspect ratio, so image 1 fills it exactly
                      and differently-shaped artwork letterboxes instead of being
                      cropped. */}
                  <img
                    src={images[selectedImage]}
                    alt={product.name}
                    className="w-full h-full object-contain"
                  />
                  <button
                    type="button"
                    onClick={() => setLightboxOpen(true)}
                    aria-label="Expand image"
                    title="Expand image"
                    className="absolute top-3 right-3 rounded-md bg-black/50 p-2 text-white transition-colors hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
                  >
                    <Expand className="h-4 w-4" />
                  </button>
                  {!isAvailable && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <Badge variant="secondary" className="text-xl px-6 py-3">
                        Sold Out
                      </Badge>
                    </div>
                  )}
                </div>

                {images.length > 1 && (
                  <div className="grid grid-cols-4 gap-4">
                    {images.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImage(index)}
                        className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                          selectedImage === index
                            ? 'border-primary shadow-lg'
                            : 'border-transparent hover:border-muted-foreground/30'
                        }`}
                      >
                        <img
                          src={image}
                          alt={`${product.name} - View ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-indigo-100 to-pink-100 flex items-center justify-center">
                <div className="text-center space-y-2">
                  <div className="text-6xl">🎨</div>
                  <p className="text-muted-foreground">No image available</p>
                </div>
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-8">
            <OwnerProductActions product={product} onDeleted={() => navigate('/')} />
            <div>
              <h1 className="font-serif text-4xl sm:text-5xl font-bold text-foreground mb-4">
                {product.name}
              </h1>

              <div className="flex items-baseline gap-3 mb-6">
                <span className="text-4xl font-bold text-foreground">
                  {product.price.toLocaleString()}
                </span>
                <span className="text-xl text-muted-foreground">
                  {product.currency}
                </span>
              </div>

              <div className="flex items-center gap-4">
                {product.stock != null && (
                  <Badge
                    variant={isAvailable ? "default" : "secondary"}
                    className="text-sm"
                  >
                    {isAvailable ? `${product.stock} available` : 'Out of stock'}
                  </Badge>
                )}
                <div className="flex items-center gap-2 bg-amber-50 hover:bg-amber-100 rounded-full px-4 py-2 transition-colors cursor-pointer">
                  <ZapButton target={product.event} className="text-amber-600 hover:text-amber-700 text-base" />
                </div>
              </div>
            </div>

            {product.description && (
              <div className="prose prose-lg max-w-none">
                <p className="text-muted-foreground leading-relaxed">
                  {product.description}
                </p>
              </div>
            )}

            {/* Specifications */}
            {specs && specs.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-4">Specifications</h3>
                  <dl className="space-y-3">
                    {specs.map(([key, value], index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <dt className="text-muted-foreground capitalize">
                          {key.replace(/_/g, ' ')}:
                        </dt>
                        <dd className="font-medium">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </CardContent>
              </Card>
            )}

            {/* Purchase Info */}
            <div className="space-y-4 pt-4">
              <Button
                size="lg"
                className="w-full text-lg"
                disabled={!isAvailable}
                onClick={() => setCheckoutOpen(true)}
              >
                <ShoppingBag className="w-5 h-5 mr-2" />
                {isAvailable ? 'Buy Now' : 'Currently Unavailable'}
              </Button>

              <p className="text-sm text-muted-foreground text-center">
                Pay with Bitcoin Lightning. Questions? Reach out for custom commissions.
              </p>
            </div>
          </div>
        </div>

        {/* Reviews & Comments. Reviews always target the NIP-99 (30402)
            coordinate — the migration keeps the product id, so reviews written
            against a NIP-15 listing survive its transfer to Gamma. */}
        <div className="mt-16">
          <ProductFeedbackTabs
            event={product.event}
            coord={productReviewCoord(EDEN_PUBKEY, product.id)}
          />
        </div>
      </div>

      <SiteFooter />

      {/* Checkout: NIP-15 listings keep the LNbits flow; Gamma listings use
          the country-first Gamma order flow. */}
      {product.protocol === 'nip15' && product.nip15 && stall && (
        <CheckoutDialog
          open={checkoutOpen}
          onOpenChange={setCheckoutOpen}
          merchantPubkey={EDEN_PUBKEY}
          product={{
            id: product.nip15.id,
            name: product.nip15.name,
            price: product.nip15.price,
            currency: product.nip15.currency,
            images: product.nip15.images,
            shipping: product.nip15.shipping,
          }}
          shippingZones={stall.data.shipping || []}
        />
      )}
      {product.protocol === 'gamma' && (
        <GammaCheckoutDialog open={checkoutOpen} onOpenChange={setCheckoutOpen} product={product} />
      )}

      {/* Full-size image lightbox (opened by the main image's Expand button) */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-[90vw] border-none bg-black/90 p-2">
          <DialogTitle className="sr-only">{product.name} — full size image</DialogTitle>
          {images.length > 0 && (
            <img
              src={images[selectedImage]}
              alt={`${product.name} - full size`}
              className="mx-auto max-h-[85vh] w-auto max-w-full object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductDetail;
