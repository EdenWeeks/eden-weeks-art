import { useSeoMeta } from '@unhead/react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useProduct } from '@/hooks/useProducts';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Bitcoin } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Eden's npub: npub1enuxqa5g0cggf849yqzd53nu0x28w69sk6xzpx2q4ej75r8tuz2sh9l3eu
const EDEN_PUBKEY = 'ccf86076887e10849ea52004da467c79947768b0b68c209940ae65ea0cebe095';

const ProductDetail = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { data: product, isLoading } = useProduct(EDEN_PUBKEY, productId || '');
  const [selectedImage, setSelectedImage] = useState(0);

  useSeoMeta({
    title: product ? `${product.data.name} - Eden Weeks Art` : 'Product - Eden Weeks Art',
    description: product?.data.description || 'View this beautiful artwork by Eden Weeks',
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        {/* Navigation */}
        <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-border">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link to="/" className="flex items-center gap-3">
                <img
                  src="/logo.jpg"
                  alt="Eden Weeks Logo"
                  className="h-12 w-auto"
                />
                <span className="font-serif text-2xl font-bold text-foreground hidden sm:inline">
                  Eden Weeks
                </span>
              </Link>
            </div>
          </div>
        </nav>

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
        <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-border">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link to="/" className="flex items-center gap-3">
                <img
                  src="/logo.jpg"
                  alt="Eden Weeks Logo"
                  className="h-12 w-auto"
                />
                <span className="font-serif text-2xl font-bold text-foreground hidden sm:inline">
                  Eden Weeks
                </span>
              </Link>
            </div>
          </div>
        </nav>

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
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3 group">
              <img
                src="/logo.jpg"
                alt="Eden Weeks Logo"
                className="h-12 w-auto transition-transform group-hover:scale-105"
              />
              <span className="font-serif text-2xl font-bold text-foreground hidden sm:inline">
                Eden Weeks
              </span>
            </Link>
          </div>
        </div>
      </nav>

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
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
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
              <Alert>
                <Bitcoin className="h-4 w-4" />
                <AlertDescription>
                  This artwork is available for purchase with Bitcoin.
                  Contact Eden directly to arrange payment and shipping.
                </AlertDescription>
              </Alert>

              <Button
                size="lg"
                className="w-full text-lg"
                disabled={!isAvailable}
              >
                {isAvailable ? 'Contact to Purchase' : 'Currently Unavailable'}
              </Button>

              <p className="text-sm text-muted-foreground text-center">
                Questions? Reach out to discuss custom commissions or this piece
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-purple-900 to-purple-950 text-white py-12 mt-24">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-center space-y-6">
            <div className="flex items-center gap-3">
              <img
                src="/logo.jpg"
                alt="Eden Weeks Logo"
                className="h-12 w-auto brightness-0 invert"
              />
              <span className="font-serif text-2xl font-bold">
                Eden Weeks
              </span>
            </div>

            <p className="text-purple-200 text-center max-w-md">
              Young artist from Cambridgeshire, England. Creating original artwork
              and custom commissions with passion.
            </p>

            <div className="flex items-center gap-2 text-sm text-purple-300">
              <span>Powered by Nostr & Bitcoin</span>
              <span>•</span>
              <a
                href="https://shakespeare.diy"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors underline"
              >
                Vibed with Shakespeare
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ProductDetail;
