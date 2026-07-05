import { useState } from 'react';
import { Radio, Settings } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useIsStoreOwner } from '@/hooks/useIsStoreOwner';
import { RelaySettingsDialog } from '@/components/admin/RelaySettingsDialog';

/**
 * Store-owner controls shown on the storefront. Rendered only when the
 * signed-in account is the store owner (`useIsStoreOwner`), so it never appears
 * for visitors.
 *
 * Eden manages products per-item via `OwnerProductActions`, so this toolbar
 * currently surfaces just the relay settings (edit the NIP-65 relay list and
 * re-broadcast the catalog). It's the mount point for future owner-wide actions.
 */
export function OwnerToolbar() {
  const isOwner = useIsStoreOwner();
  const [relaysOpen, setRelaysOpen] = useState(false);

  if (!isOwner) return null;

  return (
    <div className="mb-8 flex items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3">
      <span className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Settings className="h-4 w-4" />
        Store owner
      </span>
      <Button size="sm" variant="outline" onClick={() => setRelaysOpen(true)}>
        <Radio className="mr-2 h-4 w-4" />
        Relays
      </Button>

      {relaysOpen && (
        <RelaySettingsDialog open={relaysOpen} onOpenChange={setRelaysOpen} />
      )}
    </div>
  );
}
