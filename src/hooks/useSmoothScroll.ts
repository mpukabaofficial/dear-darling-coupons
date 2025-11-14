import { useCallback } from 'react';

export const useSmoothScroll = () => {
  const scrollToTop = useCallback((behavior: ScrollBehavior = 'smooth') => {
    window.scrollTo({
      top: 0,
      behavior,
    });
  }, []);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior,
    });
  }, []);

  const scrollToElement = useCallback(
    (elementId: string, behavior: ScrollBehavior = 'smooth', offset: number = 0) => {
      const element = document.getElementById(elementId);
      if (element) {
        const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
        const offsetPosition = elementPosition - offset;

        window.scrollTo({
          top: offsetPosition,
          behavior,
        });
      }
    },
    []
  );

  return {
    scrollToTop,
    scrollToBottom,
    scrollToElement,
  };
};
