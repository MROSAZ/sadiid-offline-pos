import { useState, useEffect } from 'react';

/**
 * Hook to detect if the device is a mobile device based on screen width
 * @param mobileBreakpoint - Screen width below which is considered mobile (default: 768px)
 * @returns Boolean indicating if the device is mobile
 */
export function useIsMobile(mobileBreakpoint: number = 768): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(
    typeof window !== 'undefined' ? window.innerWidth < mobileBreakpoint : false
  );

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const checkIsMobile = () => {
      const mobile = window.innerWidth < mobileBreakpoint;
      if (mobile !== isMobile) {
        setIsMobile(mobile);
      }
    };

    // Initial check
    checkIsMobile();

    // Add event listener for window resize
    window.addEventListener('resize', checkIsMobile);

    // Clean up
    return () => {
      window.removeEventListener('resize', checkIsMobile);
    };
  }, [mobileBreakpoint, isMobile]);

  return isMobile;
}

export default useIsMobile;
