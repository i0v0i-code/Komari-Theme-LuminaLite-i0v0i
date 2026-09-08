import { useRef, useState, type CSSProperties } from "react";
import type { PingOverviewBucket } from "@/types/komari";
import { latencyHeatColor, lossHeatColor } from "@/utils/metricTone";
import { formatHealthBucketTooltip } from "./pingBucketText";

// Shared historical controls retain upstream keyboard, hover and touch access.
export function PingHistoryBars({
  buckets,
  max,
  kind,
}: {
  buckets: PingOverviewBucket[];
  max: number;
  kind: "latency" | "loss";
}) {
  const safeMax = Math.max(1, max);
  const bars = buckets;
  const containerRef = useRef<HTMLDivElement>(null);
  const barRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const activeIndex = hoveredIndex ?? selectedIndex;
  const activeBucket = activeIndex == null ? null : bars[activeIndex] ?? null;
  const activeTooltip = activeBucket ? formatHealthBucketTooltip(activeBucket, kind) : null;
  const activeLeft =
    activeIndex == null || bars.length === 0
      ? "50%"
      : `clamp(42px, ${((activeIndex + 0.5) / bars.length) * 100}%, calc(100% - 42px))`;

  const focusedIndex = selectedIndex ?? (bars.length > 0 ? bars.length - 1 : 0);

  const selectAndFocus = (next: number) => {
    if (bars.length === 0) return;
    const target = Math.max(0, Math.min(bars.length - 1, next));
    setSelectedIndex(target);
    barRefs.current[target]?.focus();
  };

  const handleBarKeyDown = (event: React.KeyboardEvent, index: number) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      selectAndFocus(index - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      selectAndFocus(index + 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      selectAndFocus(0);
    } else if (event.key === "End") {
      event.preventDefault();
      selectAndFocus(bars.length - 1);
    }
  };

  return (
    <div
      ref={containerRef}
      className="compact-node-health-bars"
      data-kind={kind}
      style={{ "--compact-health-tooltip-x": activeLeft, gridTemplateColumns: `repeat(${Math.max(1, bars.length)}, minmax(0, 1fr))` } as CSSProperties}
      role="group"
      aria-label={`${kind === "latency" ? "延迟" : "丢包"}历史`}
      onMouseLeave={() => setHoveredIndex(null)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setHoveredIndex(null);
          setSelectedIndex(null);
        }
      }}
    >
      {activeTooltip && (
        <span className="compact-node-health-tooltip" aria-hidden="true">
          {activeTooltip}
        </span>
      )}
      {bars.map((bucket, index) => {
        const hasSamples = bucket.total > 0;
        const latencyValue = bucket.value ?? 0;
        const lossValue = bucket.loss ?? 0;
        const active = kind === "latency" ? bucket.value != null : hasSamples;
        const height =
          kind === "latency"
            ? `${active ? Math.max(26, Math.min(100, (latencyValue / safeMax) * 100)) : 24}%`
            : `${active ? Math.max(38, Math.min(100, 84 - Math.min(lossValue, 45))) : 24}%`;
        const color = active
          ? kind === "latency"
            ? latencyHeatColor(latencyValue)
            : lossHeatColor(lossValue)
          : "var(--progress-bg)";
        const style = {
          "--compact-health-height": height,
          "--compact-health-color": color,
          opacity: active ? 0.94 : 0.42,
        } as CSSProperties;
        const tooltip = formatHealthBucketTooltip(bucket, kind);

        return (
          <button
            key={`${bucket.index}-${index}`}
            ref={(el) => {
              barRefs.current[index] = el;
            }}
            type="button"
            className="compact-node-health-bar"
            style={style}
            data-selected={selectedIndex === index ? "true" : "false"}
            tabIndex={index === focusedIndex ? 0 : -1}
            aria-label={tooltip}
            title={tooltip}
            onMouseEnter={() => setHoveredIndex(index)}
            onClick={(event) => { event.preventDefault(); event.stopPropagation(); setSelectedIndex(index); }}
            onKeyDown={(e) => handleBarKeyDown(e, index)}
          />
        );
      })}
    </div>
  );
}
