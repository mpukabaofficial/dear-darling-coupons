import { useEffect, useRef, useState } from 'react';

interface AnimatedNumberProps {
  value: number;
  duration?: number;
}

export const AnimatedNumber = ({ value, duration = 1000 }: AnimatedNumberProps) => {
  const [displayValue, setDisplayValue] = useState(0);
  const [isFirstRender, setIsFirstRender] = useState(true);
  const frameRef = useRef<number>();
  const startTimeRef = useRef<number>();
  const startValueRef = useRef<number>(0);

  useEffect(() => {
    // Skip animation on first render
    if (isFirstRender) {
      setDisplayValue(value);
      setIsFirstRender(false);
      return;
    }

    startValueRef.current = displayValue;
    startTimeRef.current = Date.now();

    const animate = () => {
      const now = Date.now();
      const elapsed = now - (startTimeRef.current || now);
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3);

      const current = startValueRef.current + (value - startValueRef.current) * easeOut;
      setDisplayValue(Math.round(current));

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [value, duration, isFirstRender]);

  return <>{displayValue}</>;
};
