import { ArrowRightLeft, Check, Loader2 } from 'lucide-react';
import { useState } from 'react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/useToast';
import { useProducts, type Product } from '@/hooks/useProducts';
import { useGammaProducts } from '@/hooks/useGammaProducts';
import { useProductAdmin } from '@/hooks/useProductAdmin';
import { getDTag } from '@/lib/productAdmin';
import { MERCHANT_PUBKEY, STALL_ID } from '@/lib/merchant';

interface MigrateProductsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Lists Eden's legacy NIP-15 (kind 30018 / LNbits) listings and lets her
 * transfer each one to NIP-99/Gamma (kind 30402).
 *
 * The transferred event reuses the NIP-15 product id as its `d` tag, so the
 * storefront's unified query immediately prefers the Gamma version — the
 * NIP-15 event can stay published for LNbits without double-listing.
 */
export function MigrateProductsDialog({ open, onOpenChange }: MigrateProductsDialogProps) {
  const { toast } = useToast();
  const { data: nip15Products, isLoading } = useProducts(MERCHANT_PUBKEY, STALL_ID);
  const { data: gammaEvents } = useGammaProducts(100);
  const { migrateNip15Product } = useProductAdmin();
  const [migratingId, setMigratingId] = useState<string | null>(null);

  const migratedIds = new Set(
    (gammaEvents ?? []).map((event) => getDTag(event)).filter(Boolean)
  );

  const handleMigrate = async (product: Product) => {
    setMigratingId(product.data.id);
    try {
      await migrateNip15Product.mutateAsync({ data: product.data, event: product.event });
      toast({
        title: 'Product transferred',
        description: `"${product.data.name}" is now a NIP-99 (Gamma) listing.`,
      });
    } catch (error) {
      console.error('Failed to migrate product:', error);
      toast({
        title: 'Transfer failed',
        description: 'Could not publish the NIP-99 listing. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setMigratingId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" /> Migrate listings to NIP-99
          </DialogTitle>
          <DialogDescription>
            Your legacy NIP-15 (LNbits) listings. Transferring republishes a listing as a NIP-99
            (kind 30402) Gamma Markets event with the same identifier — the shop shows the new
            version from then on, and the LNbits listing keeps working until you retire it.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading NIP-15 listings…</p>
        ) : nip15Products && nip15Products.length > 0 ? (
          <ul className="divide-y rounded-md border">
            {nip15Products.map((product) => {
              const migrated = migratedIds.has(product.data.id);
              const isMigrating = migratingId === product.data.id;
              return (
                <li key={product.data.id} className="flex items-center justify-between gap-2 p-3">
                  <div className="flex min-w-0 items-center gap-3">
                    {product.data.images?.[0] && (
                      <img
                        src={product.data.images[0]}
                        alt=""
                        className="h-10 w-10 shrink-0 rounded object-cover"
                      />
                    )}
                    <div className="min-w-0">
                      <p className="truncate font-medium">{product.data.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {product.data.price} {product.data.currency}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {migrated ? (
                      <Badge variant="secondary" className="gap-1">
                        <Check className="h-3 w-3" /> Migrated
                      </Badge>
                    ) : (
                      <Badge variant="outline">NIP-15</Badge>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={migrated || isMigrating}
                      aria-label={`Transfer ${product.data.name} to NIP-99`}
                      onClick={() => handleMigrate(product)}
                    >
                      {isMigrating ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <ArrowRightLeft className="mr-2 h-4 w-4" />
                      )}
                      Transfer
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            No NIP-15 listings found — everything is already on NIP-99.
          </p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
