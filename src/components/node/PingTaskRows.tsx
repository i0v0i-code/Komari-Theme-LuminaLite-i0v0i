import { memo } from "react";
import type { NodePingSeries } from "@/hooks/useNodeCardModel";
import { PingHistoryBars } from "./PingHistoryBars";

export function metricText(value: number | null | undefined, unit: string) {
  if (value == null || !Number.isFinite(value) || value < 0) return "无样本";
  return `${unit === "ms" ? Math.round(value) : value.toFixed(1)}${unit}`;
}

/** Independent, non-tabbed ping rows: every target owns its values and trends. */
export const PingTaskRows = memo(function PingTaskRows({
  series,
  size = "regular",
}: {
  series: NodePingSeries[];
  size?: "regular" | "small";
  redrawKey?: string;
}) {
  if (series.length === 0) return null;

  return (
    <div className="ping-task-rows" data-size={size} role="list" aria-label="延迟任务列表">
      <div className="ping-task-row-heading" aria-hidden="true"><span>监测节点</span><span>延迟</span><span>丢包</span></div>
      {series.map(({ taskId, label, ping, buckets, latencyColor, lossColor }) => {
        const displayName = label || ping.taskName || `任务 #${taskId ?? "-"}`;
        const latencyLabel = metricText(ping.lastValue, "ms");
        const lossLabel = metricText(ping.loss, "%");
        return (
          <div
            className="ping-task-row"
            role="listitem"
            key={taskId ?? displayName}
            title={`${displayName} · 延迟 ${latencyLabel} · 丢包 ${lossLabel}`}
          >
            <div className="ping-task-row-name" title={displayName}>
              <span aria-hidden="true" className="ping-task-row-dot" style={{ background: latencyColor }} />
              <span>{displayName}</span>
            </div>
            <div className="ping-task-row-metric ping-task-row-latency">
              <strong aria-label={`延迟 ${latencyLabel}`} style={{ color: latencyColor }}>{latencyLabel}</strong>
              <PingHistoryBars buckets={buckets} max={ping.max} kind="latency" />
            </div>
            <div className="ping-task-row-metric ping-task-row-loss">
              <strong aria-label={`丢包 ${lossLabel}`} style={{ color: lossColor }}>{lossLabel}</strong>
              <PingHistoryBars buckets={buckets} max={1} kind="loss" />
            </div>
          </div>
        );
      })}
    </div>
  );
});
