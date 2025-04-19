import { useState, useEffect } from 'react';

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkIfMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      
      // Check if the user agent contains mobile-specific keywords
      const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
      
      // Also check screen width as a fallback
      const isMobileByScreenSize = window.innerWidth < 768;
      
      setIsMobile(mobileRegex.test(userAgent) || isMobileByScreenSize);
    };
    
    // Initial check
    checkIfMobile();
    
    // Re-check on window resize
    window.addEventListener('resize', checkIfMobile);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);
  
  return isMobile;
}