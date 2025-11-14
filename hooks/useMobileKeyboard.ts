import { useState, useEffect } from 'react';

/**
 * Hook to detect when mobile keyboard is visible and calculate the adjustment needed
 * @returns The bottom padding adjustment in pixels (0 when keyboard is hidden)
 */
export const useMobileKeyboard = (): number => {
  const [keyboardHeight, setKeyboardHeight] = useState<number>(0);

  useEffect(() => {
    // Check if we're on a mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    ) || window.matchMedia('(max-width: 768px)').matches;

    if (!isMobile) {
      return; // Don't set up listeners on desktop
    }

    // Use Visual Viewport API if available (modern browsers)
    if (window.visualViewport) {
      const handleViewportChange = () => {
        const viewport = window.visualViewport;
        if (!viewport) return;

        // Calculate keyboard height as the difference between window height and visual viewport height
        const heightDiff = window.innerHeight - viewport.height;
        
        // Only consider it a keyboard if the difference is significant (more than 150px)
        // This helps avoid false positives from browser UI changes
        if (heightDiff > 150) {
          setKeyboardHeight(heightDiff);
        } else {
          setKeyboardHeight(0);
        }
      };

      window.visualViewport.addEventListener('resize', handleViewportChange);
      window.visualViewport.addEventListener('scroll', handleViewportChange);

      // Initial check
      handleViewportChange();

      return () => {
        window.visualViewport?.removeEventListener('resize', handleViewportChange);
        window.visualViewport?.removeEventListener('scroll', handleViewportChange);
      };
    } else {
      // Fallback for browsers without Visual Viewport API
      let initialHeight = window.innerHeight;

      const handleResize = () => {
        const currentHeight = window.innerHeight;
        const heightDiff = initialHeight - currentHeight;

        // If height decreased significantly, keyboard is likely open
        if (heightDiff > 150) {
          setKeyboardHeight(heightDiff);
        } else {
          setKeyboardHeight(0);
          // Update initial height when keyboard closes
          initialHeight = currentHeight;
        }
      };

      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }
  }, []);

  return keyboardHeight;
};
