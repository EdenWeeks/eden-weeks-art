import { useState } from 'react';
import { ArrowRightLeft, Loader2, Pencil, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useIsStoreOwner } from '@/hooks/useIsStoreOwner';
import { useProductAdmin } from '@/hooks/useProductAdmin';
import { useToast } from '@/hooks/useToast';
import { ProductFormDialog } from '@/components/admin/ProductFormDialog';
import { DeleteProductDialog } from '@/components/admin/DeleteProductDialog';
import type { UnifiedProduct } from '@/hooks/useUnifiedProducts';

interface OwnerProductActionsProps {
  product: UnifiedProduct;
  /** Called after the product is deleted (e.g. navigate back to the storefront). */
  onDeleted?: () => void;
}

/**
 * Owner controls for a single product. Gamma listings get Edit/Remove; legacy
 * NIP-15 listings get Transfer (republish as NIP-99) — they are edited in
 * LNbits until transferred.
 */
export function OwnerProductActions({ product, onDeleted }: OwnerProductActionsProps) {
  const isOwner = useIsStoreOwner();
  const { toast } = useToast();
  const { migrateNip15Product } = useProductAdmin();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (!isOwner) return null;

  const handleTransfer = async () => {
    if (!product.nip15) return;
    try {
      await migrateNip15Product.mutateAsync({ data: product.nip15, event: product.event });
      toast({
        title: 'Product transferred',
        description: `"${product.name}" is now a NIP-99 (Gamma) listing.`,
      });
    } catch (error) {
      console.error('Failed to migrate product:', error);
      toast({
        title: 'Transfer failed',
        description: 'Could not publish the NIP-99 listing. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="flex flex-wrap gap-3 rounded-lg border border-primary/40 bg-primary/10 p-3">
      <span className="self-center text-sm font-semibold text-primary">Owner</span>

      {product.protocol === 'gamma' ? (
        <>
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit product
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Remove
          </Button>
        </>
      ) : (
        <Button
          variant="outline"
          size="sm"
          disabled={migrateNip15Product.isPending}
          onClick={handleTransfer}
        >
          {migrateNip15Product.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <ArrowRightLeft className="mr-2 h-4 w-4" />
          )}
          Transfer to NIP-99
        </Button>
      )}

      {/* Lazy-mount so the form/dialog only initialise when opened. */}
      {editOpen && (
        <ProductFormDialog open={editOpen} onOpenChange={setEditOpen} event={product.event} />
      )}
      {deleteOpen && (
        <DeleteProductDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          event={product.event}
          onDeleted={onDeleted}
        />
      )}
    </div>
  );
}
