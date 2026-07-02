import { NSecSigner, type NostrEvent } from '@nostrify/nostrify';
import { generateSecretKey } from 'nostr-tools';

/** A signer with the NIP-44 encryption capability gift wrapping requires. */
interface Nip44Signer {
  pubkey: string;
  signer: {
    nip44?: {
      encrypt(pubkey: string, plaintext: string): Promise<string>;
    };
  };
}

/** An unsigned inner ("rumor") event to be sealed and wrapped. */
export interface Rumor {
  kind: number;
  content: string;
  tags: string[][];
  created_at: number;
}

/**
 * NIP-59 gift wrapping: randomize a timestamp up to 2 days into the PAST only
 * (relays reject future timestamps) so wrap times don't leak send times.
 */
function randomizePastTimestamp(baseTime: number): number {
  const twoDaysInSeconds = 2 * 24 * 60 * 60;
  return baseTime - Math.floor(Math.random() * twoDaysInSeconds);
}

/**
 * Seal (kind 13) and gift-wrap (kind 1059) a rumor for one recipient, per
 * NIP-17/NIP-59. The wrap is signed with a random ephemeral key so the sender
 * identity is hidden; only the recipient can unwrap.
 *
 * Returns the two events to publish: the recipient's wrap and the sender's own
 * copy (wrapped to the sender so their client can show the sent message).
 */
export async function giftWrap(
  user: Nip44Signer,
  recipientPubkey: string,
  rumor: Rumor
): Promise<{ recipientWrap: NostrEvent; senderWrap: NostrEvent }> {
  if (!user.signer.nip44) {
    throw new Error('NIP-44 encryption not available for this login method');
  }

  const now = Math.floor(Date.now() / 1000);
  const rumorEvent = { ...rumor, pubkey: user.pubkey };

  const recipientSeal = {
    kind: 13,
    pubkey: user.pubkey,
    created_at: now,
    tags: [],
    content: await user.signer.nip44.encrypt(recipientPubkey, JSON.stringify(rumorEvent)),
  };
  const senderSeal = {
    kind: 13,
    pubkey: user.pubkey,
    created_at: now,
    tags: [],
    content: await user.signer.nip44.encrypt(user.pubkey, JSON.stringify(rumorEvent)),
  };

  const recipientRandomSigner = new NSecSigner(generateSecretKey());
  const senderRandomSigner = new NSecSigner(generateSecretKey());

  const [recipientWrap, senderWrap] = await Promise.all([
    recipientRandomSigner.signEvent({
      kind: 1059,
      created_at: randomizePastTimestamp(now),
      tags: [['p', recipientPubkey]],
      content: await recipientRandomSigner.nip44!.encrypt(
        recipientPubkey,
        JSON.stringify(recipientSeal)
      ),
    }),
    senderRandomSigner.signEvent({
      kind: 1059,
      created_at: randomizePastTimestamp(now),
      tags: [['p', user.pubkey]],
      content: await senderRandomSigner.nip44!.encrypt(user.pubkey, JSON.stringify(senderSeal)),
    }),
  ]);

  return { recipientWrap, senderWrap };
}
