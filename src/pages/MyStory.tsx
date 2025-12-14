import { useMemo } from 'react';
import { useSeoMeta } from '@unhead/react';
import { Link, useSearchParams } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { usePosts } from '@/hooks/usePosts';
import { useAuthor } from '@/hooks/useAuthor';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { NoteContent } from '@/components/NoteContent';
import { NavBar } from '@/components/NavBar';
import { ZapButton } from '@/components/ZapButton';
import { ArrowLeft, Heart, X } from 'lucide-react';

const EDEN_PUBKEY = import.meta.env.VITE_EDEN_PUBKEY;

const MyStory = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tagFilter = searchParams.get('tag');

  useSeoMeta({
    title: tagFilter ? `#${tagFilter} - Eden Weeks Art` : 'My Story - Eden Weeks Art',
    description: 'Follow Eden Weeks\' artistic journey through her posts and updates on Nostr.',
  });

  const { data: posts, isLoading } = usePosts(EDEN_PUBKEY, 50, { excludeReplies: true, mediaOnly: true });
  const { data: author } = useAuthor(EDEN_PUBKEY);

  // Filter posts by hashtag if a tag filter is active
  const filteredPosts = useMemo(() => {
    if (!posts || !tagFilter) return posts;
    return posts.filter(post => {
      // Check if post content contains the hashtag (case insensitive)
      const regex = new RegExp(`#${tagFilter}\\b`, 'i');
      return regex.test(post.content);
    });
  }, [posts, tagFilter]);

  const clearFilter = () => {
    searchParams.delete('tag');
    setSearchParams(searchParams);
  };

  return (
    <div className="min-h-screen bg-white">
      <NavBar />

      {/* Profile Banner */}
      <div className="relative h-48 sm:h-64 md:h-80 overflow-hidden">
        <img
          src={author?.metadata?.banner || 'https://m.primal.net/JhNt.jpg'}
          alt="Profile banner"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button variant="ghost" className="mb-6" asChild>
          <Link to="/">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </Button>

        {/* Profile Header */}
        <div className="text-center mb-12 -mt-20 relative z-10">
          <div className="flex justify-center mb-6">
            <Avatar className="h-32 w-32 ring-4 ring-white shadow-lg">
              <AvatarImage src={author?.metadata?.picture || '/eden-weeks.webp'} />
              <AvatarFallback className="text-4xl bg-gradient-to-br from-indigo-100 to-pink-100">
                EW
              </AvatarFallback>
            </Avatar>
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-foreground mb-4">
            My Story
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {author?.metadata?.about ||
              'Follow my artistic journey, thoughts, and updates as I explore creativity and share my passion for art.'}
          </p>
        </div>

        {/* Tag Filter Indicator */}
        {tagFilter && (
          <div className="max-w-2xl mx-auto mb-6">
            <div className="flex items-center gap-2 p-3 bg-indigo-50 rounded-lg">
              <span className="text-sm text-indigo-700">Filtering by:</span>
              <Badge variant="secondary" className="bg-indigo-100 text-indigo-800">
                #{tagFilter}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilter}
                className="ml-auto h-7 px-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100"
              >
                <X className="w-4 h-4 mr-1" />
                Clear
              </Button>
            </div>
          </div>
        )}

        {/* Posts Feed */}
        <div className="max-w-2xl mx-auto space-y-6">
          {isLoading ? (
            // Loading skeletons
            Array.from({ length: 5 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-3">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-20 w-full" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : filteredPosts && filteredPosts.length > 0 ? (
            filteredPosts.map((post) => (
              <Card key={post.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={author?.metadata?.picture || '/eden-weeks.webp'} />
                      <AvatarFallback>EW</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm">
                          {author?.metadata?.name || 'Eden Weeks'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(post.created_at * 1000), { addSuffix: true })}
                        </span>
                      </div>
                      <div className="prose prose-sm max-w-none">
                        <NoteContent event={post} />
                      </div>

                      {/* Zap Button */}
                      <div className="mt-4 flex items-center">
                        <div className="flex items-center gap-2 bg-amber-50 hover:bg-amber-100 rounded-full px-3 py-1.5 transition-colors">
                          <ZapButton
                            target={post}
                            className="text-amber-600 hover:text-amber-700 text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="border-dashed">
              <CardContent className="py-16 text-center">
                <Heart className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-muted-foreground">
                  No posts yet. Check back soon for updates!
                </p>
              </CardContent>
            </Card>
          )}
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

            <div className="flex items-center gap-4">
              <a
                href="https://primal.net/p/nprofile1qqsve7rqw6y8uyyyn6jjqpx6ge78n9rhdzctdrpqn9q2ue02pn47p9gqlc40f"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-80 transition-opacity"
                title="Follow on Nostr"
              >
                <img src="/nostr-logo.png" alt="Nostr" className="h-8 w-auto" />
              </a>
              <a
                href="https://instagram.com/edenjennifer.artist"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-80 transition-opacity"
                title="Follow on Instagram"
              >
                <img src="/instagram-logo.png" alt="Instagram" className="h-8 w-auto" />
              </a>
              <a
                href="https://github.com/edenweeks"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-80 transition-opacity"
                title="View GitHub"
              >
                <img src="/github-logo.png" alt="GitHub" className="h-8 w-auto" />
              </a>
            </div>

            <div className="flex items-center gap-2 text-sm text-violet-600">
              <span>Powered by Nostr & Bitcoin</span>
              <span>|</span>
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
    </div>
  );
};

export default MyStory;
