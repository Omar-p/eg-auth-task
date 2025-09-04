import { useState, useEffect } from "react";

const MOBILE_BREAKPOINT = 768;

export function useMobile() {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined" || !window.matchMedia) {
      return false;
    }
    return window.innerWidth < MOBILE_BREAKPOINT;
  });

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) {
      return;
    }

    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = (event: MediaQueryListEvent) => {
      setIsMobile(event.matches);
    };

    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isMobile;
}
