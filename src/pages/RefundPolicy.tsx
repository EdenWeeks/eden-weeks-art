import { useSeoMeta } from '@unhead/react';
import { PolicyLayout, MessageEdenLink } from '@/components/PolicyLayout';

const RefundPolicy = () => {
  useSeoMeta({
    title: 'Refund Policy - Eden Weeks Art',
    description: 'Refund and returns policy for Eden Weeks Art.',
  });

  return (
    <PolicyLayout title="Refund Policy">
      <p className="text-lg">
        I want you to love the artwork you buy. If something isn't right, let's sort it out.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-4 text-foreground">Damaged in transit</h2>
      <p>
        If your artwork arrives damaged, <MessageEdenLink>message me</MessageEdenLink> within 7
        days of delivery with photos of the piece and the packaging. I'll offer a repair,
        replacement (where possible for prints) or a full refund.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-4 text-foreground">Returns</h2>
      <p>
        Ready-made pieces can be returned within 14 days of delivery in their original condition.
        Return postage is the buyer's responsibility, and I recommend a tracked service — the
        refund is issued once the piece arrives back safely.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-4 text-foreground">Commissions</h2>
      <p>
        Custom commissions are made just for you, so they can't be returned or refunded once work
        has started — but I share progress along the way, and I won't finish a piece you're not
        happy with without talking it through first.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-4 text-foreground">How refunds are paid</h2>
      <p>
        Payments are made over Bitcoin Lightning, so refunds are returned the same way — I'll ask
        for a Lightning invoice or address to send your refund to.
      </p>
    </PolicyLayout>
  );
};

export default RefundPolicy;
