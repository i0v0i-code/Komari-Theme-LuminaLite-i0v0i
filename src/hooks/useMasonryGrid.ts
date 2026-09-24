import { useLayoutEffect } from "react";

/** Keep DOM/sort order while letting cards occupy only the grid rows they need. */
export function useMasonryGrid(
  hostRef: { current: HTMLDivElement | null },
  sequence: readonly string[],
  revision: string,
  ready: boolean,
): void {
  useLayoutEffect(() => {
    const host = hostRef.current;
    if (!ready || !host) return;
    const desktop = window.matchMedia("(min-width: 768px)");
    const items = Array.from(host.children) as HTMLElement[];
    let frame = 0;
    const layout = () => {
      frame = 0;
      if (!desktop.matches) {
        host.style.removeProperty("--masonry-gap");
        for (const item of items) item.style.removeProperty("grid-row-end");
        return;
      }
      host.style.setProperty("--masonry-gap", getComputedStyle(host).columnGap);
      // Items align to start, so their height stays intrinsic rather than
      // stretching to their assigned span. Padding supplies the vertical gap.
      const spans = items.map((item) => Math.ceil(item.getBoundingClientRect().height));
      items.forEach((item, index) => {
        item.style.gridRowEnd = `span ${Math.max(1, spans[index])}`;
      });
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(layout);
    };
    const observer = new ResizeObserver(schedule);
    observer.observe(host);
    for (const item of items) observer.observe(item);
    desktop.addEventListener("change", schedule);
    layout();
    return () => {
      observer.disconnect();
      desktop.removeEventListener("change", schedule);
      cancelAnimationFrame(frame);
      host.style.removeProperty("--masonry-gap");
      for (const item of items) item.style.removeProperty("grid-row-end");
    };
  }, [hostRef, sequence, revision, ready]);
}
