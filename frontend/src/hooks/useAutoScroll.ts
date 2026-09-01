'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

export function useAutoScroll(dependencies: any[]) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [userHasScrolledUp, setUserHasScrolledUp] = useState(false);

  const scrollToBottom = useCallback((smooth: boolean = true) => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto'
      });
    }
  }, []);

  // Detect if user scrolls up away from bottom
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);
    
    if (distanceFromBottom > 120) {
      setUserHasScrolledUp(true);
    } else {
      setUserHasScrolledUp(false);
    }
  }, []);

  // Trigger scroll when dependencies change unless user deliberately scrolled up
  useEffect(() => {
    if (!userHasScrolledUp) {
      scrollToBottom(false);
    }
  }, [...dependencies, userHasScrolledUp, scrollToBottom]);

  return {
    containerRef,
    handleScroll,
    scrollToBottom,
    userHasScrolledUp
  };
}