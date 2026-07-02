import { useState } from 'react';
import { ArrowRightLeft, FolderTree, PackagePlus, Truck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useIsStoreOwner } from '@/hooks/useIsStoreOwner';
import { ProductFormDialog } from '@/components/admin/ProductFormDialog';
import { ShippingOptionsDialog } from '@/components/admin/ShippingOptionsDialog';
import { CollectionsDialog } from '@/components/admin/CollectionsDialog';
import { MigrateProductsDialog } from '@/components/admin/MigrateProductsDialog';

/**
 * Store-owner controls shown on the storefront. Rendered only when the
 * signed-in user is the merchant (`useIsStoreOwner`), so non-owners see nothing.
 */
export function OwnerToolbar() {
  const isOwner = useIsStoreOwner();
  const [addOpen, setAddOpen] = useState(false);
  const [shippingOpen, setShippingOpen] = useState(false);
  const [collectionsOpen, setCollectionsOpen] = useState(false);
  const [migrateOpen, setMigrateOpen] = useState(false);

  if (!isOwner) return null;

  return (
    <div className="border-b border-primary/40 bg-primary/10">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <span className="text-sm font-semibold text-primary">
          Store owner tools
        </span>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            onClick={() => setAddOpen(true)}
          >
            <PackagePlus className="mr-2 h-4 w-4" />
            Add product
          </Button>
          <Button size="sm" variant="outline" onClick={() => setShippingOpen(true)}>
            <Truck className="mr-2 h-4 w-4" />
            Shipping options
          </Button>
          <Button size="sm" variant="outline" onClick={() => setCollectionsOpen(true)}>
            <FolderTree className="mr-2 h-4 w-4" />
            Categories &amp; collections
          </Button>
          <Button size="sm" variant="outline" onClick={() => setMigrateOpen(true)}>
            <ArrowRightLeft className="mr-2 h-4 w-4" />
            Migrate to NIP-99
          </Button>
        </div>
      </div>

      {/* Lazy-mount: the dialogs run catalog queries (collections / products /
          shipping) on mount, so only mount one once it is actually opened to
          avoid fetching relay data the owner may never look at. */}
      {addOpen && <ProductFormDialog open={addOpen} onOpenChange={setAddOpen} />}
      {shippingOpen && <ShippingOptionsDialog open={shippingOpen} onOpenChange={setShippingOpen} />}
      {collectionsOpen && (
        <CollectionsDialog open={collectionsOpen} onOpenChange={setCollectionsOpen} />
      )}
      {migrateOpen && <MigrateProductsDialog open={migrateOpen} onOpenChange={setMigrateOpen} />}
    </div>
  );
}
