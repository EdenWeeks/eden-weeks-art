// NOTE: This file is stable and usually should not be modified.
// It is important that all functionality in this file is preserved, and should only be modified if explicitly requested.
// Modified by explicit request: the store owner's management tools appear as a
// section of this dropdown when the signed-in account is the merchant.

import { useState } from 'react';
import {
  ArrowRightLeft,
  ChevronDown,
  FolderTree,
  LogOut,
  PackagePlus,
  Truck,
  UserIcon,
  UserPlus,
  Wallet,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu.tsx';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.tsx';
import { WalletModal } from '@/components/WalletModal';
import { useLoggedInAccounts, type Account } from '@/hooks/useLoggedInAccounts';
import { useIsStoreOwner } from '@/hooks/useIsStoreOwner';
import { ProductFormDialog } from '@/components/admin/ProductFormDialog';
import { ShippingOptionsDialog } from '@/components/admin/ShippingOptionsDialog';
import { CollectionsDialog } from '@/components/admin/CollectionsDialog';
import { MigrateProductsDialog } from '@/components/admin/MigrateProductsDialog';
import { genUserName } from '@/lib/genUserName';

interface AccountSwitcherProps {
  onAddAccountClick: () => void;
}

type StoreDialog = 'product' | 'shipping' | 'collections' | 'migrate' | null;

export function AccountSwitcher({ onAddAccountClick }: AccountSwitcherProps) {
  const { currentUser, otherUsers, setLogin, removeLogin } = useLoggedInAccounts();
  const isOwner = useIsStoreOwner();
  // Dialog state lives here (not inside DropdownMenuContent) so the dialog
  // survives the menu closing when an item is selected.
  const [storeDialog, setStoreDialog] = useState<StoreDialog>(null);

  if (!currentUser) return null;

  const getDisplayName = (account: Account): string => {
    return account.metadata.name ?? genUserName(account.pubkey);
  }

  return (
    <>
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button className='flex items-center gap-3 p-3 rounded-full hover:bg-accent transition-all w-full text-foreground'>
          <Avatar className='w-10 h-10'>
            <AvatarImage src={currentUser.metadata.picture} alt={getDisplayName(currentUser)} />
            <AvatarFallback>{getDisplayName(currentUser).charAt(0)}</AvatarFallback>
          </Avatar>
          <div className='flex-1 text-left hidden md:block truncate'>
            <p className='font-medium text-sm truncate'>{getDisplayName(currentUser)}</p>
          </div>
          <ChevronDown className='w-4 h-4 text-muted-foreground' />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className='w-56 p-2 animate-scale-in'>
        {isOwner && (
          <>
            <DropdownMenuLabel className='text-sm'>Store manager</DropdownMenuLabel>
            <DropdownMenuItem
              onSelect={() => setStoreDialog('product')}
              className='flex items-center gap-2 cursor-pointer p-2 rounded-md'
            >
              <PackagePlus className='w-4 h-4' />
              <span>Add product</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => setStoreDialog('shipping')}
              className='flex items-center gap-2 cursor-pointer p-2 rounded-md'
            >
              <Truck className='w-4 h-4' />
              <span>Shipping options</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => setStoreDialog('collections')}
              className='flex items-center gap-2 cursor-pointer p-2 rounded-md'
            >
              <FolderTree className='w-4 h-4' />
              <span>Categories &amp; collections</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => setStoreDialog('migrate')}
              className='flex items-center gap-2 cursor-pointer p-2 rounded-md'
            >
              <ArrowRightLeft className='w-4 h-4' />
              <span>Migrate to NIP-99</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <div className='font-medium text-sm px-2 py-1.5'>Switch Account</div>
        {otherUsers.map((user) => (
          <DropdownMenuItem
            key={user.id}
            onClick={() => setLogin(user.id)}
            className='flex items-center gap-2 cursor-pointer p-2 rounded-md'
          >
            <Avatar className='w-8 h-8'>
              <AvatarImage src={user.metadata.picture} alt={getDisplayName(user)} />
              <AvatarFallback>{getDisplayName(user)?.charAt(0) || <UserIcon />}</AvatarFallback>
            </Avatar>
            <div className='flex-1 truncate'>
              <p className='text-sm font-medium'>{getDisplayName(user)}</p>
            </div>
            {user.id === currentUser.id && <div className='w-2 h-2 rounded-full bg-primary'></div>}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <WalletModal>
          <DropdownMenuItem
            className='flex items-center gap-2 cursor-pointer p-2 rounded-md'
            onSelect={(e) => e.preventDefault()}
          >
            <Wallet className='w-4 h-4' />
            <span>Wallet Settings</span>
          </DropdownMenuItem>
        </WalletModal>
        <DropdownMenuItem
          onClick={onAddAccountClick}
          className='flex items-center gap-2 cursor-pointer p-2 rounded-md'
        >
          <UserPlus className='w-4 h-4' />
          <span>Add another account</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => removeLogin(currentUser.id)}
          className='flex items-center gap-2 cursor-pointer p-2 rounded-md text-red-500'
        >
          <LogOut className='w-4 h-4' />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>

    {/* Lazy-mount the management dialogs so they only query relays when opened. */}
    {storeDialog === 'product' && (
      <ProductFormDialog open onOpenChange={(open) => !open && setStoreDialog(null)} />
    )}
    {storeDialog === 'shipping' && (
      <ShippingOptionsDialog open onOpenChange={(open) => !open && setStoreDialog(null)} />
    )}
    {storeDialog === 'collections' && (
      <CollectionsDialog open onOpenChange={(open) => !open && setStoreDialog(null)} />
    )}
    {storeDialog === 'migrate' && (
      <MigrateProductsDialog open onOpenChange={(open) => !open && setStoreDialog(null)} />
    )}
    </>
  );
}
