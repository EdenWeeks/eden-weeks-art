import { Link } from 'react-router-dom';
import { POLICY_LINKS } from '@/lib/policyLinks';
import { ReleaseVersionLink } from '@/components/ReleaseVersionLink';

/**
 * The site-wide footer — one component so every page (home, gallery, story,
 * product, policies) shows the same thing: logo, blurb, socials, policy links
 * and the powered-by row with the deployed version.
 */
export function SiteFooter() {
  return (
    <footer className="bg-gradient-to-br from-violet-100 to-indigo-100 py-12 mt-24">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center justify-center space-y-6">
          <img src="/logo.jpg" alt="Eden Weeks signature" className="h-14 w-auto" />

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

          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm text-violet-600">
            {POLICY_LINKS.map(({ path, label }) => (
              <Link key={path} to={path} className="hover:text-violet-900 underline">
                {label}
              </Link>
            ))}
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
            <span>|</span>
            <ReleaseVersionLink />
          </div>
        </div>
      </div>
    </footer>
  );
}
