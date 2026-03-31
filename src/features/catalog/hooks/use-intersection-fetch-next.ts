"use client";

import { useEffect, type RefObject } from "react";

type UseIntersectionFetchNextOptions = {
  targetRef: RefObject<Element | null>;
  hasNextPage: boolean;
  isFetching: boolean;
  fetchNext: () => void | Promise<unknown>;
  rootMargin?: string;
};

/**
 * When the target intersects the viewport, calls `fetchNext` if more pages exist and a fetch is not in flight.
 */
export function useIntersectionFetchNext({
  targetRef,
  hasNextPage,
  isFetching,
  fetchNext,
  rootMargin = "200px 0px",
}: UseIntersectionFetchNextOptions) {
  useEffect(() => {
    const element = targetRef.current;
    if (!element) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting && hasNextPage && !isFetching) {
          void fetchNext();
        }
      },
      { rootMargin },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [targetRef, fetchNext, hasNextPage, isFetching, rootMargin]);
}
