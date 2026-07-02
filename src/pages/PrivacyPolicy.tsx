import { useSeoMeta } from '@unhead/react';
import { PolicyLayout, MessageEdenLink } from '@/components/PolicyLayout';

const PrivacyPolicy = () => {
  useSeoMeta({
    title: 'Privacy Policy - Eden Weeks Art',
    description: 'Privacy policy for Eden Weeks Art — a Nostr-native shop with no accounts and no tracking.',
  });

  return (
    <PolicyLayout title="Privacy Policy">
      <p className="text-lg">
        This site is built on the Nostr protocol and is deliberately minimal about data: there are
        no shop accounts, no analytics trackers, and no customer database.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-4 text-foreground">What this site stores</h2>
      <ul className="list-disc pl-6 space-y-2">
        <li>
          <strong>Nothing on a server of mine.</strong> The site is a static app; it has no backend
          and keeps no customer records.
        </li>
        <li>
          <strong>Local settings in your browser</strong> — your Nostr login, theme and message
          cache live in your own browser storage and never leave your device unencrypted.
        </li>
      </ul>

      <h2 className="text-2xl font-semibold mt-8 mb-4 text-foreground">What goes over Nostr</h2>
      <ul className="list-disc pl-6 space-y-2">
        <li>
          <strong>Orders and messages</strong> are sent as end-to-end encrypted direct messages to
          my Nostr key. Relays carry the encrypted events but cannot read the contents — including
          your delivery address and email.
        </li>
        <li>
          <strong>Public activity</strong> — comments, reviews, replies and zaps you post are
          public Nostr events signed by your key, visible to anyone, and outside this site's
          control once published.
        </li>
      </ul>

      <h2 className="text-2xl font-semibold mt-8 mb-4 text-foreground">What I use your details for</h2>
      <p>
        The delivery details in an order are used only to fulfil that order. I don't run mailing
        lists, share details with third parties, or use them for anything else.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-4 text-foreground">Payments</h2>
      <p>
        Payments are Bitcoin Lightning invoices. I never see card numbers or bank details — there
        are none involved.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-4 text-foreground">Questions</h2>
      <p>
        <MessageEdenLink>Message me</MessageEdenLink> if you have any questions about your data.
      </p>
    </PolicyLayout>
  );
};

export default PrivacyPolicy;
