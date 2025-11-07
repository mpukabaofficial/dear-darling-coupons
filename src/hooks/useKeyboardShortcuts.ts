import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface KeyboardShortcutsOptions {
  enableNavigation?: boolean;
  onSearchToggle?: () => void;
  isModalOpen?: boolean;
  onModalClose?: () => void;
}

export const useKeyboardShortcuts = ({
  enableNavigation = true,
  onSearchToggle,
  isModalOpen = false,
  onModalClose,
}: KeyboardShortcutsOptions = {}) => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input, textarea, or contenteditable element
      const target = event.target as HTMLElement;
      const isTyping =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      // ESC: Close modals (always active)
      if (event.key === 'Escape' && isModalOpen && onModalClose) {
        event.preventDefault();
        onModalClose();
        return;
      }

      // Don't trigger navigation shortcuts if typing
      if (isTyping && event.key !== 'Escape') {
        return;
      }

      // Navigation shortcuts (only if enabled and not typing)
      if (enableNavigation) {
        switch (event.key.toLowerCase()) {
          case 'n':
            event.preventDefault();
            navigate('/create-coupon');
            break;
          case 'h':
            event.preventDefault();
            navigate('/home');
            break;
          case 'm':
            event.preventDefault();
            navigate('/manage-coupons');
            break;
          case '/':
            if (onSearchToggle) {
              event.preventDefault();
              onSearchToggle();
            }
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, enableNavigation, onSearchToggle, isModalOpen, onModalClose]);
};
