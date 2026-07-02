import { useSeoMeta } from '@unhead/react';
import { PolicyLayout, MessageEdenLink } from '@/components/PolicyLayout';

const ShippingPolicy = () => {
  useSeoMeta({
    title: 'Shipping Policy - Eden Weeks Art',
    description: 'Shipping policy for Eden Weeks Art — original artwork shipped from Cambridgeshire, England.',
  });

  return (
    <PolicyLayout title="Shipping Policy">
      <p className="text-lg">
        Every piece is packed by hand in Cambridgeshire, England. Originals are one of a kind, so
        they're wrapped carefully and shipped with tracking wherever possible.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-4 text-foreground">Where I ship</h2>
      <p>
        The shipping options and costs for your country are shown at checkout before you place an
        order. If your country isn't listed, <MessageEdenLink>message me</MessageEdenLink> and I'll
        see what I can arrange.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-4 text-foreground">Processing time</h2>
      <p>
        Ready-made artwork is usually dispatched within 5 working days. Commissions take longer —
        I'll agree a timeline with you before starting, and keep you updated as the piece
        progresses.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-4 text-foreground">Delivery times</h2>
      <p>
        Once dispatched, delivery depends on your location and the shipping option chosen at
        checkout. UK orders typically arrive within a few days; international orders can take one
        to three weeks. Tracking details are shared in Messages where available.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-4 text-foreground">Questions</h2>
      <p>
        Anything unclear? <MessageEdenLink>Message me</MessageEdenLink> and I'll get back to you.
      </p>
    </PolicyLayout>
  );
};

export default ShippingPolicy;
