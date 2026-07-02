import { createContext, useCallback, useContext, useMemo, useState } from 'react';

export interface MessagesDrawerContextType {
  /** Whether the Messages drawer is currently open. */
  isOpen: boolean;
  /** Directly control the drawer open state (used by the Sheet). */
  setIsOpen: (open: boolean) => void;
  /** Open the Messages drawer focused on the conversation with Eden. */
  openMessages: () => void;
}

export const MessagesDrawerContext = createContext<MessagesDrawerContextType | null>(null);

export function useMessagesDrawerInternal(): MessagesDrawerContextType {
  const [isOpen, setIsOpen] = useState(false);

  const openMessages = useCallback(() => {
    setIsOpen(true);
  }, []);

  return useMemo(
    () => ({ isOpen, setIsOpen, openMessages }),
    [isOpen, openMessages]
  );
}

export function useMessagesDrawer(): MessagesDrawerContextType {
  const context = useContext(MessagesDrawerContext);
  if (!context) {
    throw new Error('useMessagesDrawer must be used within a MessagesDrawerProvider');
  }
  return context;
}
