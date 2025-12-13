import { useSeoMeta } from '@unhead/react';
import { Link } from 'react-router-dom';
import { useProducts } from '@/hooks/useProducts';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from '@/components/ui/carousel';
import { ShoppingBag, Palette, Heart } from 'lucide-react';

// Eden's npub: npub1enuxqa5g0cggf849yqzd53nu0x28w69sk6xzpx2q4ej75r8tuz2sh9l3eu
const EDEN_PUBKEY = 'ccf86076887e10849ea52004da467c79947768b0b68c209940ae65ea0cebe095';
const STALL_ID = 'ic5HtZ7CBy7JZPPFs36Kas';

const Index = () => {
  useSeoMeta({
    title: 'Eden Weeks - Young Artist & Creative | Original Artwork',
    description: 'Discover original artwork by Eden Weeks, a young artist from Cambridgeshire, England. Specializing in animal portraits, custom commissions, and creative experimentation.',
  });

  const { data: products, isLoading } = useProducts(EDEN_PUBKEY, STALL_ID);

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

            <div className="flex items-center gap-6">
              <a
                href="#about"
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                About
              </a>
              <a
                href="#shop"
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                Shop
              </a>
              <Button size="sm" asChild>
                <a href="#shop">
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  Browse Art
                </a>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-purple-200/20 via-transparent to-transparent"></div>

        <div className="container mx-auto px-4 py-24 relative">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 backdrop-blur border border-purple-200 text-sm font-medium text-purple-700 mb-4">
              <Palette className="w-4 h-4" />
              Young Artist from Cambridgeshire, England
            </div>

            <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-bold text-foreground leading-tight">
              Bringing Your
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500">
                {' '}Vision to Life
              </span>
            </h1>

            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Original artwork, custom commissions, and creative experimentation.
              Join me on my journey to become a successful artist.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Button size="lg" className="text-base" asChild>
                <a href="#shop">
                  <ShoppingBag className="w-5 h-5 mr-2" />
                  Explore Artwork
                </a>
              </Button>
              <Button size="lg" variant="outline" className="text-base" asChild>
                <a href="#about">
                  <Heart className="w-5 h-5 mr-2" />
                  My Story
                </a>
              </Button>
            </div>

            {/* Artwork Preview Carousel */}
            {products && products.length > 0 && (
              <div className="pt-12 w-full max-w-3xl mx-auto">
                <Carousel
                  opts={{
                    align: "center",
                    loop: true,
                  }}
                  className="w-full"
                >
                  <CarouselContent className="-ml-2 md:-ml-4">
                    {products.slice(0, 6).map((product) => (
                      <CarouselItem key={product.data.id} className="pl-2 md:pl-4 basis-1/2 md:basis-1/3">
                        <Link to={`/product/${product.data.id}`} className="block">
                          <div className="relative aspect-square rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 group">
                            {product.data.images && product.data.images.length > 0 ? (
                              <img
                                src={product.data.images[0]}
                                alt={product.data.name}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                                <Palette className="w-8 h-8 text-purple-300" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              <div className="absolute bottom-3 left-3 right-3">
                                <p className="text-white text-sm font-medium truncate">{product.data.name}</p>
                              </div>
                            </div>
                          </div>
                        </Link>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="left-0 md:-left-12 bg-white/80 hover:bg-white" />
                  <CarouselNext className="right-0 md:-right-12 bg-white/80 hover:bg-white" />
                </Carousel>
              </div>
            )}
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-purple-300/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-pink-300/20 rounded-full blur-3xl"></div>
      </section>

      {/* About Section */}
      <section id="about" className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="font-serif text-4xl sm:text-5xl font-bold text-foreground mb-4">
                About Me
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-purple-600 to-pink-600 mx-auto rounded-full"></div>
            </div>

            <Card className="border-none shadow-lg overflow-hidden">
              <CardContent className="p-8 sm:p-12">
                <div className="flex flex-col md:flex-row gap-8 md:gap-12">
                  <div className="flex-shrink-0 mx-auto md:mx-0">
                    <img
                      src="/eden-weeks.webp"
                      alt="Eden Weeks"
                      className="w-48 h-48 md:w-64 md:h-64 rounded-2xl object-cover shadow-lg"
                    />
                  </div>
                  <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
                    <p className="text-foreground font-medium text-xl">
                      Hello! I'm Eden, a young artist based in Cambridgeshire, England.
                    </p>

                  <p>
                    I have always had a passion to be creative and have loved to draw and paint ever
                    since I can remember. Join me on my journey to become a successful artist as I
                    set up my small business.
                  </p>

                  <p>
                    At the moment, the majority of my work is animal-based, consisting of mainly pets.
                    However, I love to do portraiture as it can often be a challenge but is extremely
                    rewarding. Within my art, experimentation is always key. As I am not too experienced,
                    I love to throw myself in at the deep end and try things I haven't done before.
                  </p>

                  <div className="pt-6 space-y-4">
                    <h3 className="font-serif text-2xl font-bold text-foreground">
                      What I Offer
                    </h3>

                    <ul className="space-y-3">
                      <li className="flex items-start gap-3">
                        <Badge className="mt-1 bg-purple-100 text-purple-700 hover:bg-purple-200">
                          ✓
                        </Badge>
                        <span>Bespoke commissions both painted and drawn</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <Badge className="mt-1 bg-purple-100 text-purple-700 hover:bg-purple-200">
                          ✓
                        </Badge>
                        <span>Pre-made art available for purchase</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <Badge className="mt-1 bg-purple-100 text-purple-700 hover:bg-purple-200">
                          ✓
                        </Badge>
                        <span>In-person experience days (coming soon!) where you can paint/draw with me</span>
                      </li>
                    </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section id="shop" className="py-24 bg-gradient-to-b from-white to-purple-50/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-serif text-4xl sm:text-5xl font-bold text-foreground mb-4">
              Available Artwork
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-purple-600 to-pink-600 mx-auto rounded-full mb-6"></div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Browse my collection of original artwork. Each piece is unique and made with passion.
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="w-full aspect-square" />
                  <CardContent className="p-6 space-y-3">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-10 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : products && products.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {products.map((product) => (
                <Card
                  key={product.data.id}
                  className="group overflow-hidden hover:shadow-2xl transition-all duration-300 border-border/50"
                >
                  {product.data.images && product.data.images.length > 0 ? (
                    <div className="relative aspect-square overflow-hidden">
                      <img
                        src={product.data.images[0]}
                        alt={product.data.name}
                        className="absolute inset-0 w-full h-full object-cover scale-125 transition-transform duration-500 group-hover:scale-150"
                      />
                      {product.data.quantity !== null && product.data.quantity <= 0 && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <Badge variant="secondary" className="text-lg px-4 py-2">
                            Sold Out
                          </Badge>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="aspect-square bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                      <Palette className="w-16 h-16 text-purple-300" />
                    </div>
                  )}

                  <CardContent className="p-6 space-y-2">
                    <h3 className="font-serif text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                      {product.data.name}
                    </h3>

                    {product.data.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {product.data.description}
                      </p>
                    )}

                    <div className="flex items-baseline gap-2 pt-2">
                      <span className="text-2xl font-bold text-foreground">
                        {product.data.price.toLocaleString()}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {product.data.currency}
                      </span>
                    </div>

                    {product.data.quantity !== null && (
                      <p className="text-xs text-muted-foreground">
                        {product.data.quantity > 0
                          ? `${product.data.quantity} available`
                          : 'Out of stock'}
                      </p>
                    )}
                  </CardContent>

                  <CardFooter className="p-6 pt-0">
                    <Button
                      className="w-full group-hover:shadow-lg transition-shadow"
                      disabled={product.data.quantity !== null && product.data.quantity <= 0}
                      asChild
                    >
                      <Link to={`/product/${product.data.id}`}>
                        View Details
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="py-16 px-8 text-center">
                <div className="max-w-sm mx-auto space-y-4">
                  <Palette className="w-16 h-16 text-muted-foreground mx-auto" />
                  <p className="text-lg text-muted-foreground">
                    New artwork coming soon! Check back later for beautiful pieces.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-purple-900 to-purple-950 text-white py-12">
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

export default Index;
