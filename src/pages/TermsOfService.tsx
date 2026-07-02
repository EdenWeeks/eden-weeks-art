import { useSeoMeta } from '@unhead/react';
import { PolicyLayout, MessageEdenLink } from '@/components/PolicyLayout';

const TermsOfService = () => {
  useSeoMeta({
    title: 'Terms of Service - Eden Weeks Art',
    description: 'Terms of service for Eden Weeks Art.',
  });

  return (
    <PolicyLayout title="Terms of Service">
      <p className="text-lg">
        These terms cover purchases and use of edenweeks.art. Buying artwork or using the site
        means you accept them.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-4 text-foreground">Orders and payment</h2>
      <ul className="list-disc pl-6 space-y-2">
        <li>Prices are shown on each listing; shipping is added at checkout.</li>
        <li>
          Payment is by Bitcoin Lightning invoice. An order is confirmed once its invoice is paid.
        </li>
        <li>
          Listings are for original artwork unless stated otherwise — each piece is unique and
          colours may vary slightly from photographs.
        </li>
      </ul>

      <h2 className="text-2xl font-semibold mt-8 mb-4 text-foreground">Commissions</h2>
      <ul className="list-disc pl-6 space-y-2">
        <li>Commission scope, price and timeline are agreed in Messages before work starts.</li>
        <li>Commissions are non-refundable once work has begun (see the Refund Policy).</li>
      </ul>

      <h2 className="text-2xl font-semibold mt-8 mb-4 text-foreground">Copyright</h2>
      <p>
        I retain copyright in all artwork, including commissions, unless we agree otherwise in
        writing. Buying a piece gives you the physical artwork for personal display; it doesn't
        include rights to reproduce or sell copies.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-4 text-foreground">Community content</h2>
      <p>
        Comments, reviews and replies are public Nostr events signed by their authors. Be kind;
        I may hide abusive content from this site's pages, though I can't remove events from the
        wider Nostr network.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-4 text-foreground">Liability</h2>
      <p>
        Nothing in these terms limits rights you have under UK consumer law. Beyond what the law
        requires, my liability is limited to the amount you paid for your order.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-4 text-foreground">Contact</h2>
      <p>
        Questions about these terms? <MessageEdenLink>Message me</MessageEdenLink>.
      </p>
    </PolicyLayout>
  );
};

export default TermsOfService;
