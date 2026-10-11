/**
 * Eden-specific: the legacy NIP-15 (LNbits) stall + products are archived and
 * included in the catalog snapshot alongside the Gamma listings. Run with: node --test
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ARCHIVE_KINDS, LISTING_KINDS } from '../lib/archiveConfig.js';
import { countListings } from '../lib/archiveMonitor.js';
import { buildSnapshot } from '../lib/catalogSnapshot.js';
import { EventArchive } from '../lib/eventArchive.js';
import { product, shopPubkey, signed, silentLogger, withTempDir } from './archiveFixtures.js';

test('NIP-15 stall (30017) and products (30018) are archived and snapshotted', async () => {
  await withTempDir(async (dir) => {
    const archive = new EventArchive({ dir, merchantPubkey: shopPubkey, kinds: ARCHIVE_KINDS, logger: silentLogger });
    const stall = signed({ kind: 30017, tags: [['d', 'stall-1']], content: '{"id":"stall-1","name":"Eden","currency":"GBP"}' });
    const legacy = signed({ kind: 30018, tags: [['d', 'painting-1']], content: '{"id":"painting-1","name":"Painting"}' });
    assert.equal((await archive.save(stall)).status, 'saved');
    assert.equal((await archive.save(legacy)).status, 'saved');
    const ids = buildSnapshot(archive).events.map((e) => e.id);
    assert.ok(ids.includes(stall.id) && ids.includes(legacy.id));
  });
});

test('a product migrated from NIP-15 to Gamma counts as one live listing', () => {
  const gamma = product('painting-1', 'Painting', 200);
  const legacy = signed({ kind: 30018, tags: [['d', 'painting-1']], content: '{}' });
  const legacyOnly = signed({ kind: 30018, tags: [['d', 'sketch-2']], content: '{}' });
  assert.equal(countListings([gamma, legacy, legacyOnly], LISTING_KINDS), 2);
});
