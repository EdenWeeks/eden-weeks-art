import { useSeoMeta } from '@unhead/react';
import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useProduct } from '@/hooks/useProducts';
import { useStall } from '@/hooks/useStall';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ShoppingBag } from 'lucide-react';
import { NavBar } from '@/components/NavBar';
import { CommentsSection } from '@/components/comments/CommentsSection';
import { ZapButton } from '@/components/ZapButton';
import { CheckoutDialog } from '@/components/CheckoutDialog';

const EDEN_PUBKEY = import.meta.env.VITE_EDEN_PUBKEY;
const STALL_ID = import.meta.env.VITE_STALL_ID;

const ProductDetail = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { data: product, isLoading } = useProduct(EDEN_PUBKEY, productId || '');
  const { data: stall } = useStall(EDEN_PUBKEY, STALL_ID);
  const [selectedImage, setSelectedImage] = useState(0);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  useSeoMeta({
    title: product ? `${product.data.name} - Eden Weeks Art` : 'Product - Eden Weeks Art',
    description: product?.data.description || 'View this beautiful artwork by Eden Weeks',
  });

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

  const images = product.data.images || [];
  const isAvailable = product.data.quantity === null || product.data.quantity > 0;

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
                <div className="relative aspect-square rounded-2xl overflow-hidden bg-muted shadow-xl">
                  <img
                    src={images[selectedImage]}
                    alt={product.data.name}
                    className="w-full h-full object-cover"
                  />
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
                          alt={`${product.data.name} - View ${index + 1}`}
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
            <div>
              <h1 className="font-serif text-4xl sm:text-5xl font-bold text-foreground mb-4">
                {product.data.name}
              </h1>

              <div className="flex items-baseline gap-3 mb-6">
                <span className="text-4xl font-bold text-foreground">
                  {product.data.price.toLocaleString()}
                </span>
                <span className="text-xl text-muted-foreground">
                  {product.data.currency}
                </span>
              </div>

              <div className="flex items-center gap-4">
                {product.data.quantity !== null && (
                  <Badge
                    variant={isAvailable ? "default" : "secondary"}
                    className="text-sm"
                  >
                    {isAvailable
                      ? `${product.data.quantity} available`
                      : 'Out of stock'}
                  </Badge>
                )}
                <div className="flex items-center gap-2 bg-amber-50 hover:bg-amber-100 rounded-full px-4 py-2 transition-colors cursor-pointer">
                  <ZapButton target={product.event} className="text-amber-600 hover:text-amber-700 text-base" />
                </div>
              </div>
            </div>

            {product.data.description && (
              <div className="prose prose-lg max-w-none">
                <p className="text-muted-foreground leading-relaxed">
                  {product.data.description}
                </p>
              </div>
            )}

            {/* Specifications */}
            {product.data.specs && product.data.specs.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-4">Specifications</h3>
                  <dl className="space-y-3">
                    {product.data.specs.map(([key, value], index) => (
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

        {/* Comments Section */}
        <div className="mt-16">
          <CommentsSection
            root={product.event}
            title="Comments & Discussion"
            emptyStateMessage="No comments yet"
            emptyStateSubtitle="Be the first to share your thoughts about this artwork!"
          />
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-violet-100 to-indigo-100 py-12 mt-24">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-center space-y-6">
            <div className="flex items-center gap-3">
              <img
                src="/logo.jpg"
                alt="Eden Weeks Logo"
                className="h-12 w-auto"
              />
              <span className="font-serif text-2xl font-bold text-violet-900">
                Eden Weeks
              </span>
            </div>

            <p className="text-violet-700 text-center max-w-md">
              Young artist from Cambridgeshire, England. Creating original artwork
              and custom commissions with passion.
            </p>

            <div className="flex items-center gap-2 text-sm text-violet-600">
              <span>Powered by Nostr & Bitcoin</span>
              <span>•</span>
              <a
                href="https://shakespeare.diy"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-violet-900 transition-colors underline"
              >
                Vibed with Shakespeare
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Checkout Dialog */}
      {product && stall && (
        <CheckoutDialog
          open={checkoutOpen}
          onOpenChange={setCheckoutOpen}
          merchantPubkey={EDEN_PUBKEY}
          product={{
            id: product.data.id,
            name: product.data.name,
            price: product.data.price,
            currency: product.data.currency,
            images: product.data.images,
            shipping: product.data.shipping,
          }}
          shippingZones={stall.data.shipping || []}
        />
      )}
    </div>
  );
};

export default ProductDetail;
